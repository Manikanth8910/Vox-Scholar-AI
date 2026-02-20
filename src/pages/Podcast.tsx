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
} from "lucide-react";
import { motion } from "framer-motion";

const speeds = [0.75, 1, 1.25, 1.5, 2];

const transcript = [
  { speaker: "A", name: "Dr. Chen", text: "Today we're diving into the seminal paper 'Attention Is All You Need' by Vaswani et al. This fundamentally changed how we think about sequence-to-sequence models.", time: "0:00" },
  { speaker: "B", name: "Prof. Aria", text: "Exactly! And what makes it so groundbreaking is the complete elimination of recurrence. Instead, the transformer architecture relies entirely on attention mechanisms to draw global dependencies.", time: "0:18" },
  { speaker: "A", name: "Dr. Chen", text: "Let's start with the core concept — self-attention. The model attends to all positions in the input sequence simultaneously, unlike RNNs that process sequentially.", time: "0:35" },
  {
    speaker: "recap",
    text: "Quick Recap:\n• Transformer replaces RNNs entirely\n• Uses self-attention for global context\n• Enables parallelization during training",
    time: "1:00",
  },
  { speaker: "B", name: "Prof. Aria", text: "The key innovation is the Scaled Dot-Product Attention. Queries, Keys, and Values — these three matrices are the heart of the mechanism.", time: "1:05" },
  { speaker: "A", name: "Dr. Chen", text: "Right, and the scaling factor of √dk prevents the dot products from growing too large in high dimensions, which would push softmax into regions with tiny gradients.", time: "1:28" },
  { speaker: "B", name: "Prof. Aria", text: "Multi-head attention then allows the model to jointly attend to information from different representation subspaces at different positions — truly a brilliant design choice.", time: "1:52" },
];

export default function PodcastPage() {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [progress, setProgress] = useState(35);
  const [activeIndex, setActiveIndex] = useState(2);

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
              <div>
                <h3 className="font-display font-semibold text-foreground leading-tight">
                  Attention Is All You Need
                </h3>
                <p className="text-muted-foreground text-sm mt-0.5">Vaswani et al. · NeurIPS 2017</p>
              </div>
            </div>

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
                <span>1:28</span>
                <span>4:12</span>
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
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          speed === s ? "text-primary font-semibold" : "text-foreground hover:bg-muted"
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
          </motion.div>

          {/* Transcript */}
          <div className="card-premium p-5 max-h-[420px] overflow-y-auto space-y-3">
            <h4 className="font-display font-semibold text-foreground mb-4">Transcript</h4>
            {transcript.map((entry, i) => {
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
                  onClick={() => setActiveIndex(i)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    entry.speaker === "A" ? "speaker-a" : "speaker-b"
                  } ${isActive ? "ring-1 ring-primary/40" : ""}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        entry.speaker === "A" ? "text-primary" : "text-accent"
                      }`}
                    >
                      {entry.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.time}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {entry.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Notes Panel */}
        <NotesPanel />
      </div>
    </DashboardLayout>
  );
}

function NotesPanel() {
  const [notes, setNotes] = useState("## Key Insights\n\n- Self-attention enables parallelization\n- Multi-head attention captures different subspaces\n\n## Questions\n- How does positional encoding work?\n");

  return (
    <motion.div
      className="card-premium p-5 flex flex-col h-full min-h-[600px]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-display font-semibold text-foreground">Research Notes</h4>
        <span className="text-xs text-muted-foreground">{notes.length} chars</span>
      </div>
      <textarea
        className="flex-1 bg-muted/30 rounded-xl p-4 text-foreground text-sm resize-none border border-border focus:outline-none focus:border-primary/50 font-mono leading-relaxed"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write your research notes here while listening…"
      />
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          { label: "Save Notes", primary: true },
          { label: "Download PDF", primary: false },
          { label: "Generate Study Notes", primary: false },
          { label: "Convert to Flowchart", primary: false },
        ].map((btn) => (
          <button
            key={btn.label}
            className={`py-2 rounded-xl text-sm font-medium transition-all ${
              btn.primary
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
