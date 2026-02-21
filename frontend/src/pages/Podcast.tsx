import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Volume2,
  ChevronDown,
  Lightbulb,
  FileText,
  List,
  ListOrdered,
  Bold,
  Copy,
  ArrowDown,
  GitBranch,
  Sparkles,
  Loader2,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { marked } from "marked";
import TurndownService from "turndown";

const turndownService = new TurndownService();
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";

import { useAudio } from "../context/AudioContext";

const speeds = [0.75, 1, 1.25, 1.5, 2];
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6279/api";

/** Renders text with **bold** markers as visually highlighted emphasis spans */
const renderEmphasizedText = (text: string) => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 0
      ? part
      : (
        <mark
          key={i}
          className="bg-primary/20 text-primary font-bold rounded px-0.5 not-italic"
          title="🔊 Emphasized in audio"
        >
          {part}
        </mark>
      )
  );
};

export default function PodcastPage() {
  const audio = useAudio();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [podcastData, setPodcastData] = useState<any>(null);
  const selectedStyle = audio.selectedStyle;
  const speed = audio.speed;
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [currentPaper, setCurrentPaper] = useState<any>(null);
  const [allPapers, setAllPapers] = useState<any[]>([]);
  const [voiceMale, setVoiceMale] = useState("en-IN-PrabhatNeural");
  const [voiceFemale, setVoiceFemale] = useState("en-IN-NeerjaNeural");
  const { toast } = useToast();

  // Derived properties moved to top to avoid reference errors
  const activeTranscript = podcastData?.transcript_json || [];
  const isSettingsStale = podcastData && (
    podcastData.style !== selectedStyle ||
    podcastData.voice_male !== voiceMale ||
    podcastData.voice_female !== voiceFemale
  );

  // Convenience aliases from global audio context
  const playing = audio.playing;
  const volume = audio.volume;
  const setVolume = audio.setVolume;
  const currentTime = audio.currentTime;
  const duration = audio.duration;
  const progress = audio.progress;
  const audioRef = audio.audioRef;
  const skip = audio.skip;

  const togglePlay = () => {
    if (!audio.audioSrc) return;
    audio.togglePlay();
    if (audio.playing && podcastData?.id) {
      api
        .put(`/podcasts/${podcastData.id}`, {
          last_position: audio.currentTime,
        })
        .catch(() => { });
    }
  };

  // Load available voices and papers
  useEffect(() => {
    api.get("/services/voices/edge-tts").then(({ data }) => {
      const allowedVoices = ["en-IN-NeerjaNeural", "en-IN-PrabhatNeural", "en-IN-PriyaNeural", "en-IN-RaviNeural"];
      setAvailableVoices((data || []).filter((v: any) => allowedVoices.includes(v.id)));
    }).catch(() => { });

    api.get("/papers").then(({ data }) => {
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setAllPapers(list);
      const pid = localStorage.getItem("current_paper_id");
      const selected = pid ? list.find((p: any) => p.id.toString() === pid) : list[0];
      if (selected) {
        setCurrentPaper(selected);
        localStorage.setItem("current_paper_id", selected.id.toString());
      }
    }).catch(() => { });
  }, []);

  // When currentPaper changes, try to load its specific podcast
  useEffect(() => {
    if (currentPaper) {
      setPodcastData(null);
      api.get("/podcasts").then(({ data }) => {
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        const existingPodcast = list.find((pd: any) => pd.paper_id === currentPaper.id);
        if (existingPodcast) {
          api.get(`/podcasts/${existingPodcast.id}`).then(({ data: pd }) => {
            setPodcastData(pd);
            if (pd.audio_url) {
              const src = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:6279"}/api/podcasts/${pd.id}/audio?t=${Date.now()}`;
              audio.setAudioSrc(src);
              audio.setPodcastTitle(pd.title || currentPaper.title || "Podcast");
            }
          }).catch(() => { });
        }
      }).catch(() => { });
    }
  }, [currentPaper]);

  const handleGenerate = async () => {
    if (!currentPaper) return toast({ title: "No Paper Selected", variant: "destructive" });
    if (audio.playing) audio.togglePlay();
    setIsGenerating(true);
    try {
      if (podcastData?.id) await api.delete(`/podcasts/${podcastData.id}`).catch(() => { });
      const { data } = await api.post("/podcasts/generate", {
        paper_id: currentPaper.id, style: selectedStyle, speed, voice_male: voiceMale, voice_female: voiceFemale,
      });
      const pd = await api.get(`/podcasts/${data.podcast_id}`);
      setPodcastData(pd.data);
      if (pd.data?.audio_url) {
        const src = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:6279"}/api/podcasts/${pd.data.id}/audio?t=${Date.now()}`;
        audio.setAudioSrc(src);
        audio.setPodcastTitle(pd.data.title || "Podcast");
      }
      toast({ title: "Success", description: "Podcast generated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to generate podcast", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const handleDownloadMp3 = () => {
    if (!podcastData?.audio_url) return toast({ title: "No Audio" });
    const url = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:6279"}/api/podcasts/${podcastData.id}/audio?t=${Date.now()}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${podcastData.title || "podcast"}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePaper = async () => {
    if (!currentPaper) return;
    if (!window.confirm("Are you sure you want to delete this research paper? This will remove all associated data including podcasts and notes.")) {
      return;
    }

    try {
      await api.delete(`/papers/${currentPaper.id}`);
      toast({ title: "Paper Deleted" });
      setAllPapers(prev => prev.filter(p => p.id !== currentPaper.id));
      if (allPapers.length > 1) {
        const next = allPapers.find(p => p.id !== currentPaper.id);
        if (next) {
          setCurrentPaper(next);
          localStorage.setItem("current_paper_id", next.id.toString());
        }
      } else {
        setCurrentPaper(null);
        localStorage.removeItem("current_paper_id");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete paper", variant: "destructive" });
    }
  };

  const saveProgress = async (pos: number) => {
    if (podcastData?.id) await api.put(`/podcasts/${podcastData.id}`, { last_position: pos }).catch(() => { });
  };
  // Update active transcript index from global audio context time
  useEffect(() => {
    if (!podcastData?.transcript_json) return;
    const cur = currentTime;
    let accumulated = 0;
    const list = podcastData.transcript_json;
    for (let i = 0; i < list.length; i++) {
      const segDur = list[i].duration || 0;
      if (cur >= accumulated && cur < accumulated + segDur + 0.5) {
        setActiveIndex(i);
        break;
      }
      accumulated += segDur + 0.5;
    }
  }, [currentTime, podcastData]);

  // Auto-scroll the active transcript segment into view
  useEffect(() => {
    if (activeIndex >= 0) {
      const el = document.getElementById(`transcript-seg-${activeIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeIndex]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    audio.seek((e.clientX - rect.left) / rect.width);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  const accumulatedTime = (index: number) => {
    if (!podcastData?.transcript_json) return 0;
    return podcastData.transcript_json
      .slice(0, index)
      .reduce((acc: number, cur: any) => acc + (cur.duration || 0) + 1.0, 0);
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  return (
    <DashboardLayout title="Podcast Player">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Player + Transcript */}
        <div className="space-y-4">
          {/* Player card */}
          <motion.div
            className="card-premium p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Paper info */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1.5 block">
                  Select Context Paper
                </label>
                <div className="relative mb-2 pr-4">
                  <select
                    value={currentPaper?.id || ""}
                    onChange={(e) => {
                      const pid = parseInt(e.target.value);
                      const paper = allPapers.find((p) => p.id === pid);
                      if (paper) {
                        setCurrentPaper(paper);
                        localStorage.setItem("current_paper_id", String(pid));
                      }
                    }}
                    className="w-full appearance-none bg-background border border-border hover:border-primary/50 text-sm font-semibold text-foreground rounded-lg py-2 pl-3 pr-8 outline-none transition-all shadow-sm focus:ring-2 focus:ring-primary/20 truncate"
                  >
                    {allPapers.length === 0 && (
                      <option value="">No papers available</option>
                    )}
                    {allPapers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground font-medium truncate max-w-[400px]">
                    {currentPaper?.authors ? `By ${currentPaper.authors}` : "VoxScholar Analysis Ready"}
                  </p>
                  {currentPaper && (
                    <button
                      onClick={handleDeletePaper}
                      className="p-1 px-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] flex items-center gap-1 font-bold uppercase tracking-wider"
                      title="Delete Paper"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
                {/* Status badge */}
                <div className="flex items-center gap-2 mb-3">
                  {podcastData?.audio_url && !isSettingsStale ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Voice generated &amp; ready
                    </span>
                  ) : currentPaper ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-primary text-white text-[10px] font-bold uppercase tracking-widest animate-pulse shadow-glow">
                        <Sparkles className="w-3.5 h-3.5" />
                        {isSettingsStale ? "Update Required" : "Ready to generate"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/20 border border-primary/20 text-foreground text-[10px] font-bold uppercase tracking-widest">
                        Mode: {selectedStyle}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs">
                      <FileText className="w-3.5 h-3.5" />
                      Upload a paper to begin
                    </span>
                  )}
                </div>

                {/* Settings grid — stacks on mobile, 2-col on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {/* Speaker Voices */}
                  <div className="flex flex-col gap-2 p-3 bg-accent/10 rounded-xl border border-accent/20 col-span-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      🎤 Speaker Voices
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-muted-foreground">Male</label>
                        <select
                          value={voiceMale}
                          onChange={(e) => setVoiceMale(e.target.value)}
                          className="bg-background border border-input text-[11px] rounded p-1.5 w-full outline-none focus:ring-1 focus:ring-primary"
                        >
                          {availableVoices.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-muted-foreground">Female</label>
                        <select
                          value={voiceFemale}
                          onChange={(e) => setVoiceFemale(e.target.value)}
                          className="bg-background border border-input text-[11px] rounded p-1.5 w-full outline-none focus:ring-1 focus:ring-primary"
                        >
                          {availableVoices.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate button — full width below settings */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !currentPaper}
              className={`w-full py-3 mt-4 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl bg-gradient-primary text-white shadow-glow transition-all ${isGenerating || !currentPaper
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90 shadow-primary/20 active:scale-[0.98]"
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Your Voices...
                </>
              ) : podcastData?.audio_url && !isSettingsStale ? (
                <>
                  <SkipForward className="w-4 h-4" />
                  Regenerate New Podcast
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isSettingsStale ? "Apply Changes & Generate" : "Generate Podcast"}
                </>
              )}
            </button>

            {/* Progress bar — click to seek */}
            <div className="mb-4">
              <div
                className="relative h-2 bg-muted rounded-full cursor-pointer group"
                onClick={handleSeek}
                onWheel={(e) => {
                  // Mouse wheel scrolls ±5s through the podcast
                  skip(e.deltaY > 0 ? -5 : 5);
                }}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 w-4 h-4 rounded-full bg-primary shadow-glow border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: `${progress}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <button
                onClick={() => skip(-10)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <span className="text-muted-foreground text-xs">10s</span>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
              >
                {playing ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-0.5" />
                )}
              </motion.button>
              <span className="text-muted-foreground text-xs">10s</span>
              <button
                onClick={() => skip(10)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Speed + Download */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1.5 appearance-none rounded-full cursor-pointer accent-white"
                  style={{
                    background: `linear-gradient(to right, #7B2CBF 0%, #7B2CBF ${volume * 100}%, hsl(var(--muted)) ${volume * 100}%, hsl(var(--muted)) 100%)`
                  }}
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />
              </div>
              <button
                onClick={handleDownloadMp3}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-primary text-white text-xs font-semibold shadow-glow hover:opacity-90 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                MP3
              </button>
            </div>

            {/* Global audio state used */}
          </motion.div>

          {/* Transcript section */}
          <div className="card-premium p-5 max-h-[420px] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-semibold text-foreground">
                Podcast Transcript
              </h4>
              {!podcastData && currentPaper && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Waiting for generation...
                </span>
              )}
            </div>
            {activeTranscript.length === 0 && !isGenerating && (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                The transcript will appear here after generation.
              </div>
            )}
            <AnimatePresence>
              {activeTranscript.map((entry: any, i: number) => {
                if (entry.speaker === "recap") {
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-xl bg-gold/10 border border-gold/20 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-gold" />
                        <span className="text-gold text-xs font-semibold uppercase tracking-wide">
                          Quick Recap
                        </span>
                      </div>
                      {entry.text
                        ?.split("\n")
                        .filter(Boolean)
                        .map((line: string, j: number) => (
                          <p key={j} className="text-foreground text-sm">
                            {line}
                          </p>
                        ))}
                    </motion.div>
                  );
                }
                const isActive = i === activeIndex;
                return (
                  <motion.div
                    key={i}
                    id={`transcript-seg-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setActiveIndex(i)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${entry.speaker === "A"
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "bg-accent/5 hover:bg-accent/10"
                      } ${isActive ? "ring-2 ring-primary/40 shadow-glow" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${entry.speaker === "A" ? "text-primary" : "text-accent"
                          }`}
                      >
                        {entry.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {entry.timestamp}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {renderEmphasizedText(entry.text)}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Notes Panel */}
        <NotesPanel
          paperId={currentPaper?.id}
          paperTitle={currentPaper?.title}
        />
      </div>
    </DashboardLayout>
  );
}

// ─── GFG Reference helper ───────────────────────────────────────────────────
const GFG_TOPICS = [
  "Big O Notation",
  "Recursion",
  "Dynamic Programming",
  "Binary Search",
  "Neural Networks",
  "Backpropagation",
  "Gradient Descent",
  "Transformer Architecture",
  "Attention Mechanism",
  "LSTM",
  "Decision Tree",
  "Support Vector Machine",
];
function GFGBadge({ topic }: { topic: string }) {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");
  return (
    <a
      href={`https://www.geeksforgeeks.org/${slug}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors font-medium"
    >
      <ExternalLink className="w-2 h-2" />
      {topic}
    </a>
  );
}

function NotesPanel({
  paperId,
  paperTitle,
}: {
  paperId?: number;
  paperTitle?: string;
}) {
  const [activeTab, setActiveTab] = useState<"notes" | "summary">("notes");

  // ── Tab 1 state ──────────────────────────────────────────────────────────
  const [notes, setNotes] = useState(
    "<h2>Key Insights</h2><ul><li>Start typing your research notes here while listening…</li></ul>",
  );
  const [noteId, setNoteId] = useState<number | null>(null);
  // ── Tab 1: Flowchart ─────────────────────────────────────────────────────
  const [flowNodes, setFlowNodes] = useState<any[]>([]);
  const [flowLoading, setFlowLoading] = useState(false);
  // ── Tab 2: Summary ───────────────────────────────────────────────────────
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (paperId) {
      // Load existing note
      api.get(`/notes?paper_id=${paperId}`).then(({ data }) => {
        if (data && data.length > 0) {
          api.get(`/notes/${data[0].id}`).then(({ data: fullNote }) => {
            setNotes(marked(fullNote.content) as string);
            setNoteId(fullNote.id);
          });
        } else {
          setNotes(
            "<h2>Key Insights</h2><ul><li>Start typing your research journey...</li></ul>",
          );
          setNoteId(null);
        }
      });
      // Load flowchart
      loadFlowchart(paperId);
    }
  }, [paperId]);

  const loadFlowchart = async (pid: number) => {
    setFlowLoading(true);
    try {
      const { data } = await api.get(`/papers/${pid}/flowchart`);
      setFlowNodes(data.nodes || []);
    } catch {
    } finally {
      setFlowLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!paperId) return;
    setSummaryLoading(true);
    try {
      const { data } = await api.get(`/papers/${paperId}`);
      setSummary(data.summary || "No summary available yet.");
    } catch {
    } finally {
      setSummaryLoading(false);
    }
  };
  const [isSaving, setIsSaving] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const quillRef = useRef<any>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!notes.trim() || isSaving) return;
    setIsSaving(true);

    // Convert HTML to Markdown for backend
    const markdown = turndownService.turndown(notes);

    try {
      if (noteId) {
        // Update existing
        await api.put(`/notes/${noteId}`, {
          title: paperTitle ? `Notes: ${paperTitle}` : "Updated Research Note",
          content: markdown,
        });
      } else {
        // Create new
        const { data } = await api.post("/notes", {
          title: paperTitle ? `Notes: ${paperTitle}` : "New Research Note",
          content: markdown,
          paper_id: paperId || null,
          tags: ["research", "podcast-insight"],
        });
        setNoteId(data.id);
      }
      toast({
        title: "Success",
        description: "Notes saved to your research memory",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsertTimestamp = () => {
    const audio = document.querySelector("audio");
    if (audio && quillRef.current) {
      const time = audio.currentTime;
      const fmtTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
      };

      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      const position = range ? range.index : quill.getLength();
      quill.insertText(position, ` [${fmtTime(time)}] `, "bold", true);
    }
  };

  const execCommand = (cmd: string, value?: any) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      if (cmd === "heading") {
        quill.format("header", value);
      } else if (cmd === "list") {
        quill.format("list", value);
      } else {
        quill.format(cmd, true);
      }
    }
  };

  const handleDownload = async (format: "md" | "doc" | "pdf") => {
    const html = quillRef.current
      ? quillRef.current.getEditor().root.innerHTML
      : "";
    const filename = `${paperTitle || "notes"}.${format}`;

    if (format === "md") {
      const markdown = turndownService.turndown(html);
      const element = document.createElement("a");
      const file = new Blob([markdown], { type: "text/markdown" });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      toast({
        title: "Downloaded",
        description: "Notes exported as Markdown (.md)",
      });
    } else if (format === "doc") {
      const header =
        "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
      const footer = "</body></html>";
      const sourceHTML = header + html + footer;

      const source =
        "data:application/vnd.ms-word;charset=utf-8," +
        encodeURIComponent(sourceHTML);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = filename;
      fileDownload.click();
      document.body.removeChild(fileDownload);
      toast({
        title: "Downloaded",
        description: "Notes exported as Word (.doc)",
      });
    } else if (format === "pdf") {
      toast({
        title: "Preparing PDF",
        description: "Generating your PDF document...",
      });
      try {
        const html2pdf = (await import("html2pdf.js")).default;
        const element = document.createElement("div");
        element.innerHTML = `<div style="padding: 40px; font-family: sans-serif; color: #000; font-size: 14px;">${html}</div>`;
        const opt = {
          margin: 0.5,
          filename: filename,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: {
            unit: "in" as const,
            format: "letter" as const,
            orientation: "portrait" as const,
          },
        };
        document.body.appendChild(element);
        html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            document.body.removeChild(element);
            toast({
              title: "Downloaded",
              description: "Notes exported as PDF (.pdf)",
            });
          });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to generate PDF",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopy = () => {
    const text = quillRef.current ? quillRef.current.getEditor().getText() : "";
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Notes copied to clipboard" });
  };

  const handleGenerateStudyNotes = async () => {
    if (!paperId) {
      toast({
        title: "Context Required",
        description: "Please upload or select a paper first",
      });
      return;
    }
    toast({
      title: "Generating",
      description: "AI is crafting study notes for you...",
    });
    try {
      const { data } = await api.post(`/notes/generate?paper_id=${paperId}`);
      const htmlContent = marked(data.content);
      setNotes(htmlContent as string);
      toast({
        title: "Ready!",
        description: "AI Study Notes generated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate study notes",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      className="card-premium flex flex-col h-full min-h-[600px] relative overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 p-1 bg-muted/40 border-b border-border">
        {(["notes", "summary"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveTab(t);
              if (t === "summary" && !summary) fetchSummary();
            }}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${activeTab === t
              ? "bg-gradient-primary text-white shadow-glow hover:opacity-90 active:scale-[0.98]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
          >
            {t === "notes" ? "📝 AI Notes" : "🧠 AI Summary"}
          </button>
        ))}
      </div>

      {/* ══ TAB 1 — AI Notes ════════════════════════════════════════════ */}
      {activeTab === "notes" && (
        <div className="flex flex-col flex-1 p-4 gap-3 overflow-y-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-1">
            <h4 className="font-display font-semibold text-foreground text-sm">
              Research Notepad
            </h4>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 p-1 px-2 hover:bg-muted rounded text-foreground font-bold text-xs">
                    H <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-40 z-50">
                  <DropdownMenuItem
                    onClick={() => execCommand("heading", 1)}
                    className="cursor-pointer"
                  >
                    H1 Title
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => execCommand("heading", 2)}
                    className="cursor-pointer"
                  >
                    H2 Subtitle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => execCommand("heading", 3)}
                    className="cursor-pointer"
                  >
                    H3 Heading
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => execCommand("heading", false)}
                    className="cursor-pointer"
                  >
                    Body Text
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => execCommand("bold")}
                className="p-1 hover:bg-muted rounded"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                onClick={() => execCommand("list", "bullet")}
                className="p-1 hover:bg-muted rounded"
              >
                <List className="w-3 h-3" />
              </button>
              <button
                onClick={() => execCommand("list", "ordered")}
                className="p-1 hover:bg-muted rounded"
              >
                <ListOrdered className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-muted rounded"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={handleInsertTimestamp}
                className="text-[9px] bg-gradient-primary text-white px-2 py-0.5 rounded shadow-glow hover:opacity-90 font-bold ml-1 transition-all"
              >
                TS
              </button>
            </div>
          </div>

          {/* Quill editor */}
          <div
            className="quill-wrapper overflow-hidden bg-muted/10 rounded-xl border border-border"
            style={{ minHeight: 180 }}
          >
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={notes}
              onChange={setNotes}
              modules={{ toolbar: false }}
              placeholder="Write your research notes while listening…"
              style={{ fontSize: `${fontSize}px`, minHeight: 180 }}
            />
          </div>

          {/* Save + Export */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="py-2 rounded-xl text-xs font-semibold bg-gradient-primary text-white shadow-glow disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Notes"}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="py-2 rounded-xl text-xs font-semibold bg-gradient-primary text-white shadow-glow hover:opacity-90 transition-all flex items-center justify-center gap-1.5">
                  <Download className="w-3 h-3" /> Export
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 z-50">
                <DropdownMenuItem
                  onClick={() => handleDownload("md")}
                  className="cursor-pointer text-sm"
                >
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownload("doc")}
                  className="cursor-pointer text-sm"
                >
                  Word Doc (.doc)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownload("pdf")}
                  className="cursor-pointer text-sm"
                >
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Embedded Flowchart ────────────────────────────────────── */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Research Flowchart
                </span>
                {flowNodes.length > 0 && (
                  <span className="text-[9px] text-muted-foreground">
                    ({flowNodes.length} steps)
                  </span>
                )}
              </div>
              <button
                onClick={() => paperId && loadFlowchart(paperId)}
                disabled={flowLoading || !paperId}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 shadow-sm"
              >
                {flowLoading ? (
                  <>
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Generating…
                  </>
                ) : flowNodes.length > 0 ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5" /> Regenerate
                  </>
                ) : (
                  <>
                    <GitBranch className="w-2.5 h-2.5" /> Generate Flowchart
                  </>
                )}
              </button>
            </div>
            {flowLoading ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <p className="text-[11px] text-muted-foreground">
                  AI is building your flowchart…
                </p>
              </div>
            ) : flowNodes.length > 0 ? (
              <div className="space-y-0 max-h-72 overflow-y-auto pr-1">
                {flowNodes.map((node, i) => (
                  <div key={node.id || i}>
                    <div
                      className={`rounded-xl border p-2.5 text-xs ${node.color || "border-primary/30 bg-primary/5"}`}
                    >
                      <span
                        className={`text-[9px] font-bold uppercase ${node.labelColor || "text-primary"}`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p
                        className={`font-bold text-[11px] mt-0.5 ${node.labelColor || "text-primary"}`}
                      >
                        {node.label}
                      </p>
                      <p className="text-foreground text-[10px] leading-relaxed mt-0.5">
                        {node.desc}
                      </p>
                    </div>
                    {i < flowNodes.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="flex flex-col items-center gap-0">
                          <div className="w-px h-2.5 bg-border" />
                          <ArrowDown className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center gap-2 text-center">
                <GitBranch className="w-8 h-8 text-muted-foreground opacity-30" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  No flowchart yet.
                  <br />
                  Click{" "}
                  <span className="text-primary font-semibold">
                    Generate Flowchart
                  </span>{" "}
                  above
                  <br />
                  to create a visual overview of this paper.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB 2 — AI Summary ══════════════════════════════════════════ */}
      {activeTab === "summary" && (
        <div className="flex flex-col flex-1 p-4 gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Paper Summary
            </span>
            <button
              onClick={fetchSummary}
              disabled={summaryLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
            >
              {summaryLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {summaryLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {summaryLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Generating summary…
              </p>
            </div>
          ) : summary ? (
            <>
              {/* GFG links for summary */}
              {(() => {
                const topics = GFG_TOPICS.filter((t) =>
                  summary.toLowerCase().includes(t.toLowerCase()),
                ).slice(0, 4);
                return topics.length > 0 ? (
                  <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-green-500/5 border border-green-500/15">
                    <span className="text-[9px] font-bold text-green-600 w-full">
                      📚 GFG References
                    </span>
                    {topics.map((t) => (
                      <GFGBadge key={t} topic={t} />
                    ))}
                  </div>
                ) : null;
              })()}
              <div
                className="flex-1 prose prose-sm dark:prose-invert max-w-none text-foreground text-[12px] leading-relaxed
                  [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-3 [&_h2]:mb-1
                  [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-0.5
                  [&_ul]:pl-3 [&_li]:text-xs [&_p]:mb-1.5 [&_strong]:text-foreground"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(summary) as string,
                }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(summary);
                }}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors mt-auto self-start"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground opacity-40" />
              <p className="text-xs text-muted-foreground">
                Click Refresh to load the AI summary
                <br />
                for the current paper.
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
