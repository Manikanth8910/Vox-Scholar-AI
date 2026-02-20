import { useState, useRef } from "react";
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
  Type,
  List,
  ListOrdered,
  Bold,
  Italic,
  CheckSquare,
  Copy,
  Heading1,
  Heading2,
  Eye,
  Edit3,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { marked } from 'marked';
import TurndownService from 'turndown';

const turndownService = new TurndownService();
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const speeds = [0.75, 1, 1.25, 1.5, 2];

const transcript: any[] = [];

export default function PodcastPage() {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [podcastData, setPodcastData] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState("educational");
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [currentPaper, setCurrentPaper] = useState<any>(null);
  const [allPapers, setAllPapers] = useState<any[]>([]);
  const [voiceMale, setVoiceMale] = useState("en-IN-PrabhatNeural");
  const [voiceFemale, setVoiceFemale] = useState("en-IN-NeerjaNeural");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Load available voices
  useEffect(() => {
    api.get('/podcasts/voices').then(({ data }) => {
      setAvailableVoices(data);
    }).catch(() => { });
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    const el = document.getElementById(`transcript-${activeIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  // Auto-load all papers on mount
  useEffect(() => {
    api.get('/papers').then(({ data }) => {
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setAllPapers(list);

      const pid = localStorage.getItem("current_paper_id");
      let selected = null;
      if (pid) {
        selected = list.find((p: any) => p.id.toString() === pid);
      }
      if (!selected && list.length > 0) {
        selected = list[0];
        localStorage.setItem('current_paper_id', selected.id.toString());
      }
      if (selected) {
        setCurrentPaper(selected);
      }
    }).catch(() => { });
  }, []);

  // When currentPaper changes, try to load its specific podcast
  useEffect(() => {
    if (currentPaper) {
      setPodcastData(null); // Reset until we find one
      setPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      api.get('/podcasts').then(({ data }) => {
        const list = Array.isArray(data) ? data : data?.items ?? [];
        // Find existing podcast for this paper
        const existingPodcast = list.find((pd: any) => pd.paper_id === currentPaper.id);
        if (existingPodcast) {
          api.get(`/podcasts/${existingPodcast.id}`).then(({ data: pd }) => {
            setPodcastData(pd);
          }).catch(() => { });
        }
      }).catch(() => { });
    }
  }, [currentPaper]);

  const handleGenerate = async () => {
    const paperId = localStorage.getItem("current_paper_id");
    if (!paperId) {
      toast({ title: "No Paper Found", description: "Upload a paper first to generate a podcast", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data } = await api.post('/podcasts/generate', {
        paper_id: parseInt(paperId),
        style: selectedStyle,
        speed,
        voice_male: voiceMale,
        voice_female: voiceFemale
      });
      const pd = await api.get(`/podcasts/${data.podcast_id}`);
      setPodcastData(pd.data);
      toast({ title: "Success", description: "Podcast generated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to generate podcast", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMp3 = () => {
    if (!podcastData?.audio_url) {
      toast({ title: "No Audio", description: "Generate a podcast first to download" });
      return;
    }
    const url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:6279'}${podcastData.audio_url}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${podcastData.title || 'podcast'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Downloading", description: "Your mp3 is being downloaded" });
  };

  const activeTranscript = podcastData?.transcript_json?.length ? podcastData.transcript_json : transcript;

  const saveProgress = async (pos: number) => {
    if (podcastData?.id) {
      try {
        await api.put(`/podcasts/${podcastData.id}`, { last_position: pos });
      } catch (err) { }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      saveProgress(audioRef.current.currentTime);
    } else {
      audioRef.current.play().catch(e => console.log(e));
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && podcastData?.transcript_json) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress(dur > 0 ? (cur / dur) * 100 : 0);

      // Find active index
      let accumulated = 0;
      const list = podcastData.transcript_json;
      for (let i = 0; i < list.length; i++) {
        const segDur = list[i].duration || 0;
        // In the backend, we now assume ~0.5s implicit gap per segment,
        // so we pad the active window to `segDur + 0.5`
        if (cur >= accumulated && cur < accumulated + segDur + 0.5) {
          setActiveIndex(i);
          break;
        }
        accumulated += segDur + 0.5;
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const seekTo = ratio * (audioRef.current.duration || 0);
    audioRef.current.currentTime = seekTo;
  };

  const skip = (secs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + secs, audioRef.current.duration || 0));
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const accumulatedTime = (index: number) => {
    if (!podcastData?.transcript_json) return 0;
    return podcastData.transcript_json.slice(0, index).reduce((acc: number, cur: any) => acc + (cur.duration || 0) + 1.0, 0);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  return (
    <DashboardLayout title="Podcast Player">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
        {/* Left: Player + Transcript */}
        <div className="space-y-4">
          {/* Player card */}
          <motion.div
            className="card-premium p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Paper info */}
            <div className="flex flex-col mb-6">

              {/* Paper Selection Dropdown */}
              <div className="mb-6 w-full relative">
                <select
                  value={currentPaper?.id || ""}
                  onChange={e => {
                    const nextId = e.target.value;
                    const nextP = allPapers.find(p => p.id.toString() === nextId);
                    if (nextP) {
                      localStorage.setItem("current_paper_id", nextId);
                      setCurrentPaper(nextP);
                    }
                  }}
                  className="w-full bg-accent/20 border border-input text-foreground text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  {allPapers.length === 0 && <option value="">No papers uploaded yet</option>}
                  {allPapers.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground leading-tight">
                    {podcastData?.title || currentPaper?.title || "Attention Is All You Need"}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{podcastData ? "AI Generated Podcast" : currentPaper ? `Ready to generate from ${currentPaper.filename}` : "Vaswani et al. · NeurIPS 2017"}</p>

                  <div className="flex gap-2 mt-2 items-center">
                    <select
                      value={selectedStyle}
                      onChange={e => setSelectedStyle(e.target.value)}
                      className="bg-secondary text-secondary-foreground text-xs rounded p-1"
                    >
                      <option value="educational">Educational</option>
                      <option value="beginner">Beginner</option>
                      <option value="exam">Exam</option>
                      <option value="research">Research</option>
                      <option value="debate">Debate</option>
                    </select>

                    <div className="flex flex-col gap-2 p-2 bg-accent/10 rounded-lg border border-accent/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Speaker Voices</span>
                      <div className="flex gap-2">
                        <div className="flex flex-col gap-1 w-1/2">
                          <label className="text-[9px] text-muted-foreground">Male Speaker</label>
                          <select
                            value={voiceMale}
                            onChange={e => setVoiceMale(e.target.value)}
                            className="bg-background border border-input text-[11px] rounded p-1.5 w-full outline-none focus:ring-1 focus:ring-primary"
                          >
                            {availableVoices.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1 w-1/2">
                          <label className="text-[9px] text-muted-foreground">Female Speaker</label>
                          <select
                            value={voiceFemale}
                            onChange={e => setVoiceFemale(e.target.value)}
                            className="bg-background border border-input text-[11px] rounded p-1.5 w-full outline-none focus:ring-1 focus:ring-primary"
                          >
                            {availableVoices.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="btn-primary w-full py-2 flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                          Generating Your Voices...
                        </>
                      ) : podcastData?.audio_url ? (
                        "Generate New Podcast"
                      ) : (
                        "Generate Podcast"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar — click to seek */}
            <div className="mb-4">
              <div
                className="relative h-2 bg-muted rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 w-4 h-4 rounded-full bg-primary shadow-glow border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <button onClick={() => skip(-10)} className="text-muted-foreground hover:text-foreground transition-colors">
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
              <button onClick={() => skip(10)} className="text-muted-foreground hover:text-foreground transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Speed + Download */}
            <div className="flex items-center justify-between">
              <div className="relative">
                <button
                  onClick={() => setSpeedOpen(!speedOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent/20 transition-all"
                >
                  {speed}x <ChevronDown className="w-3 h-3" />
                </button>
                {speedOpen && (
                  <div className="absolute bottom-full mb-1 bg-card border border-border rounded-xl shadow-card py-1">
                    {speeds.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSpeed(s); setSpeedOpen(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm ${speed === s ? "text-primary font-semibold" : "text-foreground hover:bg-muted"
                          }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <div className="w-20 h-1.5 bg-muted rounded-full">
                  <div className="w-3/4 h-full bg-primary rounded-full" />
                </div>
              </div>
              <button
                onClick={handleDownloadMp3}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-accent/20 transition-all"
              >
                <Download className="w-4 h-4" />
                MP3
              </button>
            </div>

            {podcastData?.audio_url && (
              <audio
                ref={audioRef}
                src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:6279'}${podcastData.audio_url}`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={(e) => {
                  if (podcastData?.last_position > 0) {
                    e.currentTarget.currentTime = podcastData.last_position;
                  }
                }}
                onEnded={() => {
                  setPlaying(false);
                  saveProgress(0);
                }}
                className="hidden"
              />
            )}
          </motion.div>

          {/* Transcript */}
          <div className="card-premium p-5 max-h-[420px] overflow-y-auto space-y-3">
            <h4 className="font-display font-semibold text-foreground mb-4">Transcript</h4>
            {activeTranscript.map((entry: any, i: number) => {
              if (entry.speaker === "recap") {
                return (
                  <div key={i} className="rounded-xl bg-gold/10 border border-gold/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-gold" />
                      <span className="text-gold text-xs font-semibold uppercase tracking-wide">Quick Recap</span>
                    </div>
                    {entry.text?.split("\n").filter(Boolean).map((line, j) => (
                      <p key={j} className="text-foreground text-sm">
                        {line}
                      </p>
                    ))}
                  </div>
                );
              }
              const isActive = i === activeIndex;
              return (
                <motion.div
                  key={i}
                  id={`transcript-${i}`}
                  onClick={() => {
                    if (audioRef.current && podcastData?.transcript_json) {
                      let time = 0;
                      for (let j = 0; j < i; j++) time += (podcastData.transcript_json[j].duration || 0) + 1.0;
                      audioRef.current.currentTime = time;
                    }
                    setActiveIndex(i);
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-l-4 ${entry.speaker === "A" || entry.speaker?.toString().toUpperCase() === "A" ? "speaker-a border-transparent" : "speaker-b border-transparent"
                    } ${isActive ? (entry.speaker === "A" || entry.speaker?.toString().toUpperCase() === "A" ? "bg-primary/10 border-primary ring-1 ring-primary/20 shadow-glow-sm" : "bg-accent/10 border-accent ring-1 ring-accent/20 shadow-glow-sm") : "opacity-60 grayscale-[0.3]"}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${entry.speaker === "A" ? "text-primary" : "text-accent"
                        }`}
                    >
                      {entry.name}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">{entry.time || fmt(accumulatedTime(i))}</span>
                  </div>
                  <p className={`text-[13px] leading-relaxed transition-colors ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {entry.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Notes Panel */}
        <NotesPanel paperId={currentPaper?.id || podcastData?.paper_id} paperTitle={currentPaper?.title || podcastData?.title} />
      </div>
    </DashboardLayout>
  );
}

function NotesPanel({ paperId, paperTitle }: { paperId?: number, paperTitle?: string }) {
  const [notes, setNotes] = useState("## Key Insights\n\n- Self-attention enables parallelization\n- Multi-head attention captures different subspaces\n\n## Questions\n- How does positional encoding work?\n");
  const [noteId, setNoteId] = useState<number | null>(null);

  useEffect(() => {
    if (paperId) {
      api.get(`/notes?paper_id=${paperId}`).then(({ data }) => {
        if (data && data.length > 0) {
          api.get(`/notes/${data[0].id}`).then(({ data: fullNote }) => {
            const htmlContent = marked(fullNote.content);
            setNotes(htmlContent as string);
            setNoteId(fullNote.id);
          });
        } else {
          setNotes("<h2>Key Insights</h2><ul><li>Start typing your research journey...</li></ul>");
          setNoteId(null);
        }
      });
    }
  }, [paperId]);
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
          content: markdown
        });
      } else {
        // Create new
        const { data } = await api.post('/notes', {
          title: paperTitle ? `Notes: ${paperTitle}` : "New Research Note",
          content: markdown,
          paper_id: paperId || null,
          tags: ["research", "podcast-insight"]
        });
        setNoteId(data.id);
      }
      toast({ title: "Success", description: "Notes saved to your research memory" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save notes", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsertTimestamp = () => {
    const audio = document.querySelector('audio');
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
      quill.insertText(position, ` [${fmtTime(time)}] `, 'bold', true);
    }
  };

  const execCommand = (cmd: string, value?: any) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      if (cmd === 'heading') {
        quill.format('header', value);
      } else if (cmd === 'list') {
        quill.format('list', value);
      } else {
        quill.format(cmd, true);
      }
    }
  };

  const handleDownload = async (format: 'md' | 'doc' | 'pdf') => {
    const html = quillRef.current ? quillRef.current.getEditor().root.innerHTML : "";
    const filename = `${paperTitle || 'notes'}.${format}`;

    if (format === 'md') {
      const markdown = turndownService.turndown(html);
      const element = document.createElement("a");
      const file = new Blob([markdown], { type: 'text/markdown' });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      toast({ title: "Downloaded", description: "Notes exported as Markdown (.md)" });
    } else if (format === 'doc') {
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
      const footer = "</body></html>";
      const sourceHTML = header + html + footer;

      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = filename;
      fileDownload.click();
      document.body.removeChild(fileDownload);
      toast({ title: "Downloaded", description: "Notes exported as Word (.doc)" });
    } else if (format === 'pdf') {
      toast({ title: "Preparing PDF", description: "Generating your PDF document..." });
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        const element = document.createElement('div');
        element.innerHTML = `<div style="padding: 40px; font-family: sans-serif; color: #000; font-size: 14px;">${html}</div>`;
        const opt = {
          margin: 0.5,
          filename: filename,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
        };
        html2pdf().set(opt).from(element).save().then(() => {
          toast({ title: "Downloaded", description: "Notes exported as PDF (.pdf)" });
        });
      } catch (err) {
        toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
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
      toast({ title: "Context Required", description: "Please upload or select a paper first" });
      return;
    }
    toast({ title: "Generating", description: "AI is crafting study notes for you..." });
    try {
      const { data } = await api.post(`/notes/generate?paper_id=${paperId}`);
      const htmlContent = marked(data.content);
      setNotes(htmlContent as string);
      toast({ title: "Ready!", description: "AI Study Notes generated successfully" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate study notes", variant: "destructive" });
    }
  };

  return (
    <motion.div
      className="card-premium p-5 flex flex-col h-full min-h-[600px] relative overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-display font-semibold text-foreground">Research Notepad</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInsertTimestamp}
            className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 hover:bg-primary/20 transition-all font-bold uppercase tracking-tighter"
          >
            Timestamp
          </button>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 p-1 px-2 hover:bg-muted rounded text-foreground font-bold italic text-sm">
                  H1 <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 z-50">
                <DropdownMenuItem onClick={() => execCommand('heading', 1)} className="font-display font-medium text-2xl py-2 cursor-pointer">Title</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('heading', 2)} className="font-display font-medium text-xl py-2 cursor-pointer">Subtitle</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('heading', 3)} className="font-semibold text-lg py-2 cursor-pointer">Heading</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('heading', 4)} className="font-semibold text-base py-1.5 cursor-pointer">Subheading</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('heading', 5)} className="font-medium text-sm py-1.5 cursor-pointer">Section</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('heading', 6)} className="text-sm py-1 cursor-pointer">Subsection</DropdownMenuItem>
                <DropdownMenuItem onClick={() => execCommand('heading', false)} className="text-sm mt-1 border-t rounded-none pt-2 font-mono cursor-pointer relative before:content-[''] before:w-1 before:h-4 before:bg-orange-500 before:absolute before:left-0 before:top-2 before:rounded-r">Body</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button onClick={() => execCommand('bold')} title="Bold" className="p-1 hover:bg-muted rounded ml-1"><Bold className="w-3 h-3" /></button>
            <button onClick={() => execCommand('list', 'bullet')} title="Bullet List" className="p-1 hover:bg-muted rounded"><List className="w-3 h-3" /></button>
            <button onClick={() => execCommand('list', 'ordered')} title="Numbered List" className="p-1 hover:bg-muted rounded"><ListOrdered className="w-3 h-3" /></button>
            <button onClick={handleCopy} title="Copy All" className="p-1 hover:bg-muted rounded ml-1"><Copy className="w-3 h-3" /></button>
          </div>
          <div className="flex items-center gap-1 ml-1">
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Math.min(48, Math.max(8, Number(e.target.value))))}
              className="w-12 text-center text-[11px] font-medium bg-muted/50 border border-border rounded py-0.5 focus:outline-none focus:border-primary/50"
              title="Font Size"
            />
            <span className="text-[10px] text-muted-foreground font-medium">px</span>
          </div>
        </div>
      </div>

      <div className="flex-1 mt-2 quill-wrapper overflow-hidden bg-muted/10 rounded-xl border border-border">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={notes}
          onChange={setNotes}
          modules={{ toolbar: false }}
          placeholder="Write your research notes here while listening…"
          className="h-full"
          style={{ fontSize: `${fontSize}px` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="py-2 rounded-xl text-sm font-medium transition-all bg-gradient-primary text-white shadow-glow disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Notes"}
        </button>
        <button
          onClick={handleGenerateStudyNotes}
          className="py-2 rounded-xl text-sm font-medium transition-all bg-secondary text-secondary-foreground hover:bg-accent/20 border border-border"
        >
          Generate AI Notes
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="py-2 rounded-xl text-sm font-medium transition-all bg-secondary text-secondary-foreground hover:bg-accent/20 border border-border flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-50">
            <DropdownMenuItem onClick={() => handleDownload('md')} className="py-2 cursor-pointer font-medium">Download Markdown (.md)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('doc')} className="py-2 cursor-pointer font-medium">Download Word Doc (.doc)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('pdf')} className="py-2 cursor-pointer font-medium">Download PDF (.pdf)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button className="py-2 rounded-xl text-sm font-medium transition-all bg-secondary text-secondary-foreground hover:bg-accent/20 border border-border">
          Flowchart
        </button>
      </div>
    </motion.div>
  );
}
