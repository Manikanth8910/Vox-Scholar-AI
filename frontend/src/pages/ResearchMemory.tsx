import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { FileText, Calendar, TrendingUp, Info, Loader2, Download, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6279/api";

export default function ResearchMemory() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/papers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPapers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleOpenPaper = (id: number) => {
    localStorage.setItem("current_paper_id", id.toString());
    navigate("/qa");
  };

  const handleDeletePaper = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this research paper? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/papers/${id}`);
      setPapers(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete paper:", err);
    }
  };

  return (
    <DashboardLayout title="Research Memory">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Papers", value: papers.length },
            {
              label: "Topics Analyzed",
              value: Array.from(new Set(papers.flatMap((p) => p.topics || [])))
                .length,
            },
            {
              label: "Completion Rate",
              value:
                papers.length > 0
                  ? `${Math.round(papers.reduce((acc, p) => acc + (p.reading_progress || 0), 0) / papers.length)}%`
                  : "0%",
            },
          ].map((s) => (
            <div key={s.label} className="card-premium p-4 text-center">
              <div className="font-display text-3xl font-bold text-foreground">
                {s.value}
              </div>
              <div className="text-muted-foreground text-sm mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Connection banner */}
        <motion.div
          className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Info className="w-5 h-5 text-accent shrink-0" />
          <span className="text-sm text-foreground">
            <strong>Intelligent Library:</strong> All your research is stored
            securely and indexed for semantic searching.
          </span>
        </motion.div>

        {/* Paper list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
            <p className="text-muted-foreground italic">
              Your knowledge base is empty. Upload a paper to start building
              your research memory.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map((paper, i) => (
              <motion.div
                key={paper.id}
                onClick={() => handleOpenPaper(paper.id)}
                className="card-premium p-5 cursor-pointer hover:border-primary/40 transition-all hover:shadow-glow-sm"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-semibold text-foreground mb-1 truncate">
                      {paper.title}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{" "}
                        {new Date(paper.created_at).toLocaleDateString()}
                      </span>
                      {paper.authors && (
                        <span className="truncate max-w-[200px]">
                          By {paper.authors}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(paper.topics || []).slice(0, 5).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 justify-end">
                        <TrendingUp className="w-3 h-3" /> Progress
                      </div>
                      <div
                        className="font-display text-2xl font-bold"
                        style={{
                          color:
                            (paper.reading_progress || 0) > 80
                              ? "hsl(var(--primary))"
                              : (paper.reading_progress || 0) > 40
                                ? "hsl(var(--gold))"
                                : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {paper.reading_progress || 0}%
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeletePaper(e, paper.id)}
                      className="p-1 px-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      title="Delete Paper"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
