import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Search,
  FileText,
  Calendar,
  Plus,
  Trash2,
  Download,
  Sparkles,
  FileDown,
  BookOpen,
  Loader2,
  ExternalLink,
  Copy,
  ArrowDown,
  GitBranch,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { marked } from "marked";
import TurndownService from "turndown";

const turndownService = new TurndownService();

// ─── GFG Reference Links ────────────────────────────────────────────────────
const GFG_TOPICS = [
  "Big O Notation",
  "Time Complexity",
  "Recursion",
  "Dynamic Programming",
  "Binary Search",
  "Sorting Algorithms",
  "Graph Theory",
  "Neural Networks",
  "Backpropagation",
  "Gradient Descent",
  "Transformer Architecture",
  "Attention Mechanism",
  "Matrix Multiplication",
  "Probability",
  "Bayesian Inference",
  "Entropy",
  "Convolutional Neural Network",
  "Recurrent Neural Network",
  "LSTM",
  "Decision Tree",
  "Random Forest",
  "Support Vector Machine",
  "Naive Bayes",
  "K-Means Clustering",
];

function GFGLink({ topic }: { topic: string }) {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");
  return (
    <a
      href={`https://www.geeksforgeeks.org/${slug}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
        bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors font-medium"
    >
      <ExternalLink className="w-2.5 h-2.5" />
      {topic}
    </a>
  );
}

function extractGFGTopics(text: string) {
  return GFG_TOPICS.filter((p) =>
    text.toLowerCase().includes(p.toLowerCase()),
  ).slice(0, 6);
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 1 — AI NOTES (Quill editor + embedded Flowchart + Save + Export)
// ════════════════════════════════════════════════════════════════════════════
function AINotesTab() {
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingNote, setEditingNote] = useState<any>(null);
  // Flowchart
  const [flowNodes, setFlowNodes] = useState<any[]>([]);
  const [flowTitle, setFlowTitle] = useState("");
  const [flowLoading, setFlowLoading] = useState(false);
  const quillRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
    loadFlowchart();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data } = await api.get("/notes");
      setNotes(data);
    } catch {}
  };

  const loadFlowchart = async () => {
    const pid = localStorage.getItem("current_paper_id");
    if (!pid) return;
    setFlowLoading(true);
    try {
      const { data } = await api.get(`/papers/${pid}/flowchart`);
      setFlowNodes(data.nodes || []);
      setFlowTitle(data.paper_title || "");
    } catch {
    } finally {
      setFlowLoading(false);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes((n) => n.filter((note) => note.id !== id));
      toast({ title: "Deleted" });
    } catch {
      toast({
        title: "Error",
        description: "Delete failed",
        variant: "destructive",
      });
    }
  };

  const handleCreateNote = async () => {
    try {
      const { data } = await api.post("/notes", {
        title: "New Research Note",
        content: "Start writing your insights here...",
        tags: ["web-note"],
      });
      setNotes((prev) => [data, ...prev]);
      toast({ title: "Created", description: "New note added" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;
    try {
      const markdown = turndownService.turndown(editingNote.content || "");
      await api.put(`/notes/${editingNote.id}`, {
        title: editingNote.title,
        content: markdown,
      });
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                title: editingNote.title,
                content_preview: markdown.substring(0, 100),
              }
            : n,
        ),
      );
      setEditingNote(null);
      toast({ title: "Saved ✓" });
    } catch {
      toast({
        title: "Error",
        description: "Save failed",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: "pdf" | "doc" | "md") => {
    if (!editingNote) return;
    const html = quillRef.current?.getEditor().root.innerHTML || "";
    const filename = `${editingNote.title || "notes"}.${format}`;

    if (format === "md") {
      const el = document.createElement("a");
      el.href = URL.createObjectURL(
        new Blob([turndownService.turndown(html)], { type: "text/markdown" }),
      );
      el.download = filename;
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
      toast({ title: "Downloaded as Markdown" });
    } else if (format === "doc") {
      const src =
        "data:application/vnd.ms-word;charset=utf-8," +
        encodeURIComponent(
          `<html><head><meta charset='utf-8'></head><body>${html}</body></html>`,
        );
      const el = document.createElement("a");
      document.body.appendChild(el);
      el.href = src;
      el.download = filename;
      el.click();
      document.body.removeChild(el);
      toast({ title: "Downloaded as Word Doc" });
    } else {
      toast({ title: "Preparing PDF..." });
      try {
        const html2pdf = (await import("html2pdf.js")).default;
        const el = document.createElement("div");
        el.innerHTML = `<div style="padding:40px;font-family:sans-serif;color:#000;font-size:14px">${html}</div>`;
        document.body.appendChild(el);
        await html2pdf()
          .set({
            margin: 0.5,
            filename,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          })
          .from(el)
          .save();
        document.body.removeChild(el);
        toast({ title: "Downloaded as PDF" });
      } catch {
        toast({ title: "PDF export failed", variant: "destructive" });
      }
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content_preview?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* ── Notes Section ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div>
            <h2 className="font-display font-bold text-foreground">My Notes</h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              Write, save, and export your research notes
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl bg-card border border-border focus:outline-none focus:border-primary/50 text-sm w-44"
              />
            </div>
            <button
              onClick={handleCreateNote}
              className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note, i) => (
                <motion.div
                  key={note.id}
                  className="card-premium p-4 flex flex-col h-full group cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() =>
                    api.get(`/notes/${note.id}`).then(({ data }) =>
                      setEditingNote({
                        ...data,
                        content: marked.parse(data.content || "") as string,
                      }),
                    )
                  }
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-semibold text-foreground mb-1.5 line-clamp-2 text-sm">
                    {note.title || "Untitled"}
                  </h4>
                  <p className="text-muted-foreground text-xs line-clamp-3 flex-1 leading-relaxed">
                    {note.content_preview || "No preview."}
                  </p>
                  <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-border text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  No notes yet — click "New Note" to start.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Flowchart Section ──────────────────────────────────────────── */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground">
              Research Flowchart
            </h3>
          </div>
          <button
            onClick={loadFlowchart}
            disabled={flowLoading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            {flowLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Refresh
          </button>
        </div>

        {flowLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : flowNodes.length > 0 ? (
          <div className="space-y-0 max-w-xl mx-auto">
            {flowTitle && (
              <p className="text-center text-xs text-muted-foreground mb-4 font-medium">
                {flowTitle}
              </p>
            )}
            {flowNodes.map((node, i) => (
              <motion.div
                key={node.id || i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div
                  className={`rounded-2xl border-2 p-4 ${node.color || "border-primary/40 bg-primary/5"}`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${node.labelColor || "text-primary"}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h4
                    className={`font-display text-base font-bold mb-1 ${node.labelColor || "text-primary"}`}
                  >
                    {node.label}
                  </h4>
                  <p className="text-foreground text-sm leading-relaxed">
                    {node.desc}
                  </p>
                </div>
                {i < flowNodes.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-0.5 h-3 bg-border" />
                      <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground text-sm">
            <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No flowchart yet. Upload a paper to generate one.
          </div>
        )}
      </div>

      {/* ── Note Editor Modal ──────────────────────────────────────────── */}
      {editingNote && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingNote(null);
          }}
        >
          <motion.div
            className="card-premium w-full max-w-3xl p-6 shadow-2xl space-y-4 my-8"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {/* Header with Export buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl font-bold font-display">Edit Note</h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  <FileDown className="w-3 h-3" /> PDF
                </button>
                <button
                  onClick={() => handleExport("doc")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                >
                  <FileDown className="w-3 h-3" /> DOC
                </button>
                <button
                  onClick={() => handleExport("md")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-muted/80 transition-colors border border-border"
                >
                  <Download className="w-3 h-3" /> MD
                </button>
                <button
                  onClick={() => setEditingNote(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors font-bold text-base ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Title */}
            <input
              className="w-full bg-muted/30 border border-border text-base font-bold p-2.5 px-3 rounded-xl focus:ring-1 focus:ring-primary/50 focus:outline-none"
              value={editingNote.title}
              onChange={(e) =>
                setEditingNote({ ...editingNote, title: e.target.value })
              }
              placeholder="Note Title"
            />

            {/* Quill Editor */}
            <div className="rounded-xl border border-border overflow-hidden bg-muted/5">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={editingNote.content}
                onChange={(val) =>
                  setEditingNote({ ...editingNote, content: val })
                }
                placeholder="Write your research insights..."
                style={{ minHeight: "300px" }}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ size: ["small", false, "large", "huge"] }],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ color: [] }, { background: [] }],
                    ["link", "clean"],
                  ],
                }}
                formats={[
                  "header",
                  "bold",
                  "italic",
                  "underline",
                  "strike",
                  "size",
                  "list",
                  "bullet",
                  "color",
                  "background",
                  "link",
                ]}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button
                onClick={() => setEditingNote(null)}
                className="px-5 py-2 rounded-xl text-sm bg-secondary text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn-primary px-7 py-2 text-sm"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 2 — AI SUMMARY (pure paper summary generation, nothing else)
// ════════════════════════════════════════════════════════════════════════════
function AISummaryTab() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [paperTitle, setPaperTitle] = useState("");
  const { toast } = useToast();

  const fetchSummary = async () => {
    const pid = localStorage.getItem("current_paper_id");
    if (!pid) {
      toast({
        title: "No Paper",
        description: "Upload a paper first to generate a summary.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/papers/${pid}`);
      setPaperTitle(data.title || "");
      setSummary(
        data.summary ||
          "No summary available yet. Try regenerating from the Upload page.",
      );
    } catch {
      toast({
        title: "Error",
        description: "Failed to load summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const gfgTopics = extractGFGTopics(summary);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-foreground text-lg">
            AI Summary
          </h2>
          {paperTitle && (
            <p className="text-muted-foreground text-xs mt-0.5 truncate max-w-md">
              {paperTitle}
            </p>
          )}
        </div>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card-premium p-16 flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">
            Generating AI summary…
          </p>
        </div>
      ) : summary ? (
        <motion.div
          className="card-premium p-6 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* GFG Links */}
          {gfgTopics.length > 0 && (
            <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/15 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                📚 Referenced Topics — GeeksForGeeks
              </p>
              <div className="flex flex-wrap gap-2">
                {gfgTopics.map((t) => (
                  <GFGLink key={t} topic={t} />
                ))}
              </div>
            </div>
          )}

          {/* Summary body */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed
              [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-5 [&_h2]:mb-2
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1
              [&_ul]:pl-4 [&_li]:text-sm [&_p]:mb-2.5 [&_strong]:text-foreground
              [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-xs"
            dangerouslySetInnerHTML={{
              __html: marked.parse(summary) as string,
            }}
          />

          {/* Copy button */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => {
                navigator.clipboard.writeText(summary);
                toast({ title: "Copied to clipboard" });
              }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Summary
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="card-premium p-16 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">
            Upload a paper, then click Refresh to generate your summary.
          </p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════════════════
export default function NotesPage() {
  const [tab, setTab] = useState<"notes" | "summary">("notes");

  const tabs = [
    {
      key: "notes" as const,
      label: "📝 AI Notes",
      hint: "Flowchart · Write · Save · Export",
    },
    {
      key: "summary" as const,
      label: "🧠 AI Summary",
      hint: "Simplified paper overview",
    },
  ];

  return (
    <DashboardLayout title="Research Notes">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* ── Tab Bar ───────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl w-fit border border-border shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === t.key
                  ? "bg-card shadow text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap hidden sm:block">
                  {t.hint}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="h-3" /> {/* spacing for the hint text */}
        {/* ── Tab Content ───────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "notes" ? <AINotesTab /> : <AISummaryTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
