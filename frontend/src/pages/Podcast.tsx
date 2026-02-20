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
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const speeds = [0.75, 1, 1.25, 1.5, 2];
const API_URL = "http://localhost:8000/api";

export default function PodcastPage() {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [paperData, setPaperData] = useState<any>(null);
  const [podcastData, setPodcastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const currentPaperId = localStorage.getItem('currentPaperId');
    const token = localStorage.getItem('token');

    if (currentPaperId && token) {
      const id = parseInt(currentPaperId);

      // 1. Fetch Paper
      fetch(`${API_URL}/papers/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setPaperData(data))
        .catch(err => console.error(err));

      // 2. Fetch Podcasts
      fetch(`${API_URL}/podcasts`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const existing = data.find((p: any) => p.paper_id === id);
          if (existing) {
            setPodcastData(existing);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const generatePodcast = async () => {
    const token = localStorage.getItem('token');
    const paperId = localStorage.getItem('currentPaperId');
    if (!token || !paperId) return;

    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/podcasts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          paper_id: parseInt(paperId),
          style: "educational",
          voice_male: "pNInz6obpgmqSIn64dym", // Default male
          voice_female: "pfZD6S8RkYI2h9N6H68F", // Default female
          speed: 1.0
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Generation failed");
      }

      const status = await response.json();

      // Successfully generated, now fetch the full detail
      const detailRes = await fetch(`${API_URL}/podcasts/${status.podcast_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const detailData = await detailRes.json();
      setPodcastData(detailData);
    } catch (err: any) {
      alert(`Failed: ${err.message}. Make sure ElevenLabs API key is configured in backend.`);
    } finally {
      setGenerating(false);
    }
  };

  const transcript = podcastData?.transcript_json || [];

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
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground leading-tight truncate">
                  {paperData?.title || "Loading Paper..."}
                </h3>
                <p className="text-muted-foreground text-sm mt-0.5 truncate">
                  {paperData?.authors || "AI Research Analysis"}
                </p>
              </div>
            </div>

            {!podcastData ? (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Volume2 className="w-10 h-10 text-primary" />
                </div>
                <h4 className="font-display text-xl font-bold mb-2">No Podcast Generated</h4>
                <p className="text-muted-foreground text-sm max-w-xs mb-6">
                  Would you like VoxScholar AI to generate a professional audio discussion of this paper?
                </p>
                <button
                  onClick={generatePodcast}
                  disabled={generating || !paperData}
                  className="btn-primary px-8 py-3 disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Discussion...
                    </>
                  ) : "Generate Podcast"}
                </button>
                {generating && (
                  <p className="text-xs text-primary mt-4 animate-pulse">
                    This may take a minute. We are synthesizing voices...
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="relative h-2 bg-muted rounded-full cursor-pointer">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-primary rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-glow border-2 border-background"
                      style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>{Math.floor((progress / 100) * (podcastData?.audio_duration || 0))}s</span>
                    <span>{Math.floor(podcastData?.audio_duration || 0)}s</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-5">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <span className="text-muted-foreground text-xs">10s</span>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setPlaying(!playing)}
                    className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
                  >
                    {playing ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-0.5" />
                    )}
                  </motion.button>
                  <span className="text-muted-foreground text-xs">10s</span>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
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
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-accent/20 transition-all">
                    <Download className="w-4 h-4" />
                    MP3
                  </button>
                </div>
              </>
            )}
          </motion.div>

          {/* Transcript */}
          <div className="card-premium p-5 max-h-[420px] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-semibold text-foreground">Podcast Transcript</h4>
              {!podcastData && <span className="text-xs text-muted-foreground">Waiting for generation...</span>}
            </div>
            {transcript.length === 0 && !generating && !loading && (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                The transcript will appear here after generation.
              </div>
            )}
            <AnimatePresence>
              {transcript.map((entry: any, i: number) => {
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
                        <span className="text-gold text-xs font-semibold uppercase tracking-wide">Quick Recap</span>
                      </div>
                      {entry.text?.split("\n").filter(Boolean).map((line: string, j: number) => (
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setActiveIndex(i)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${entry.speaker === "A" ? "bg-primary/5 hover:bg-primary/10" : "bg-accent/5 hover:bg-accent/10"
                      } ${isActive ? "ring-2 ring-primary/40 shadow-glow" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${entry.speaker === "A" ? "text-primary" : "text-accent"
                          }`}
                      >
                        {entry.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {entry.text}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Notes Panel */}
        <NotesPanel paperData={paperData} />
      </div>
    </DashboardLayout>
  );
}

function NotesPanel({ paperData }: { paperData: any }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (paperData?.summary) {
      setNotes(`## Summary\n\n${paperData.summary}\n\n## Key Findings\n\n${paperData.key_findings?.map((f: string) => `- ${f}`).join('\n') || ""}\n\n## Research Notes\n\n`);
    }
  }, [paperData]);

  return (
    <motion.div
      className="card-premium p-5 flex flex-col h-full min-h-[600px]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-display font-semibold text-foreground">AI Analysis & Notes</h4>
        <span className="text-xs text-muted-foreground">{notes.length} chars</span>
      </div>
      <textarea
        className="flex-1 bg-muted/30 rounded-xl p-4 text-foreground text-sm resize-none border border-border focus:outline-none focus:border-primary/50 font-mono leading-relaxed"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="AI summary will appear here. Add your own notes while listening..."
      />
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          { label: "Save Notes", primary: true },
          { label: "Check Methodology", primary: false },
          { label: "Generate Study Quiz", primary: false },
          { label: "Key Concepts", primary: false },
        ].map((btn) => (
          <button
            key={btn.label}
            className={`py-2 rounded-xl text-sm font-medium transition-all ${btn.primary
                ? "bg-gradient-primary text-white shadow-glow"
                : "bg-secondary text-secondary-foreground hover:bg-accent/20 border border-border"
              }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
