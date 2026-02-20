import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
<<<<<<< HEAD
import { motion } from "framer-motion";
import { ArrowDown, Info } from "lucide-react";

const API_URL = "http://localhost:8000/api";

const flowNodes = [
  {
    id: "problem",
    label: "Hypothesis",
    desc: "The primary research question or problem addressed by the paper.",
    color: "border-primary/40 bg-primary/5",
    labelColor: "text-primary",
  },
  {
    id: "method",
    label: "Methodology",
    desc: "The experimental setup or theoretical framework proposed.",
    color: "border-gold/40 bg-gold/5",
    labelColor: "text-gold",
  },
  {
    id: "eval",
    label: "Analysis",
    desc: "The evaluation metrics and comparison against baselines.",
    color: "border-indigo/40 bg-indigo/5",
    labelColor: "text-indigo-light",
  },
  {
    id: "results",
    label: "Key Conclusion",
    desc: "The main findings and their statistical significance.",
    color: "border-accent/40 bg-accent/5",
    labelColor: "text-accent",
  },
];

export default function FlowchartPage() {
  const [paperData, setPaperData] = useState<any>(null);

  useEffect(() => {
    const paperId = localStorage.getItem("currentPaperId");
    const token = localStorage.getItem("token");
    if (paperId && token) {
      fetch(`${API_URL}/papers/${paperId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setPaperData(data))
        .catch(console.error);
    }
  }, []);
=======
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, GitBranch, Sparkles, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function FlowchartPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    const paperId = localStorage.getItem("current_paper_id");
    if (!paperId) {
      toast({ title: "No Paper Found", description: "Please upload a paper first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/papers/${paperId}/flowchart`);
      setNodes(data.nodes || []);
      setTitle(data.paper_title || "");
      setGenerated(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to generate flowchart.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
>>>>>>> fab2c02 (Few functional changes done)

  return (
    <DashboardLayout title="Research Flowchart">
      <div className="max-w-2xl mx-auto py-4 space-y-6">

        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        >
<<<<<<< HEAD
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            {paperData?.title || "Research Paper Flow"}
          </h2>
          <p className="text-muted-foreground text-sm">Visual methodology roadmap</p>
        </motion.div>

        <div className="mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex gap-3">
          <Info className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground italic">
            The flow below illustrates the typical research structure of {paperData?.title || "your study"}.
            Individual node extraction for this specific paper is currently in optimization phase.
          </p>
        </div>

        <div className="space-y-0 opacity-80">
          {flowNodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className={`rounded-2xl border-2 p-5 ${node.color}`}>
                <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${node.labelColor}`}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className={`font-display text-xl font-bold mb-2 ${node.labelColor}`}>
                  {node.label}
                </h3>
                <p className="text-foreground text-sm leading-relaxed">{node.desc}</p>
              </div>
              {i < flowNodes.length - 1 && (
                <div className="flex justify-center py-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-0.5 h-4 bg-border" />
                    <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
=======
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {title || "Research Flowchart"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              AI-generated step-by-step methodology overview
            </p>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
              bg-gradient-primary text-white shadow-glow disabled:opacity-60 hover:shadow-lg hover:scale-[1.02] active:scale-100"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            ) : generated ? (
              <><RefreshCw className="w-4 h-4" /> Regenerate</>
            ) : (
              <><GitBranch className="w-4 h-4" /> Generate Flowchart</>
            )}
          </button>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="card-premium p-16 flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">AI is building your flowchart…</p>
            <p className="text-muted-foreground text-xs">This may take 10–20 seconds</p>
          </div>
        ) : nodes.length > 0 ? (
          <AnimatePresence>
            <div className="space-y-0">
              {nodes.map((node, i) => (
                <motion.div
                  key={node.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                >
                  <div className={`rounded-2xl border-2 p-5 ${node.color || "border-primary/40 bg-primary/5"}`}>
                    <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${node.labelColor || "text-primary"}`}>
                      Step {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3 className={`font-display text-xl font-bold mb-2 ${node.labelColor || "text-primary"}`}>
                      {node.label}
                    </h3>
                    <p className="text-foreground text-sm leading-relaxed">{node.desc}</p>
                  </div>
                  {i < nodes.length - 1 && (
                    <div className="flex justify-center py-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-0.5 h-4 bg-border" />
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <motion.div
            className="card-premium p-20 flex flex-col items-center gap-4 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <GitBranch className="w-14 h-14 text-muted-foreground opacity-30" />
            <div>
              <p className="text-foreground font-semibold mb-1">No flowchart yet</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Click <span className="text-primary font-semibold">Generate Flowchart</span> above<br />
                to create an AI-powered visual overview of your paper.
              </p>
            </div>
          </motion.div>
        )}
>>>>>>> fab2c02 (Few functional changes done)
      </div>
    </DashboardLayout>
  );
}
