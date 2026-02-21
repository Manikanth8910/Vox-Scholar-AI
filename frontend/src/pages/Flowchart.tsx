import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, GitBranch, Sparkles, RefreshCw } from "lucide-react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function FlowchartPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [allPapers, setAllPapers] = useState<any[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load all papers for the dropdown
    api.get("/papers").then(({ data }) => {
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setAllPapers(list);

      const pid = localStorage.getItem("current_paper_id");
      if (pid) {
        setSelectedPaperId(parseInt(pid));
      } else if (list.length > 0) {
        setSelectedPaperId(list[0].id);
        localStorage.setItem("current_paper_id", list[0].id.toString());
      }
    }).catch(() => { });
  }, []);

  const generate = async () => {
    if (!selectedPaperId) {
      toast({
        title: "No Paper Selected",
        description: "Please select a paper from the list above.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get(`/papers/${selectedPaperId}/flowchart`);
      setNodes(data.nodes || []);
      setTitle(data.paper_title || "");
      setGenerated(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.detail || "Failed to generate flowchart.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaperChange = (id: number) => {
    setSelectedPaperId(id);
    localStorage.setItem("current_paper_id", id.toString());
    // Reset state when changing paper context
    setNodes([]);
    setGenerated(false);
    setTitle("");
  };

  return (
    <DashboardLayout title="Research Flowchart">
      <div className="max-w-2xl mx-auto py-4 space-y-6">
        {/* Header */}
        <motion.div
          className="card-premium p-6 flex flex-col gap-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {title || "Research Flowchart"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                AI methodology overview
              </p>
            </div>
            <button
              onClick={generate}
              disabled={loading || !selectedPaperId}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all
                bg-gradient-primary text-white shadow-glow disabled:opacity-50 hover:shadow-lg hover:scale-[1.02] active:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                </>
              ) : generated ? (
                <>
                  <RefreshCw className="w-4 h-4" /> Regenerate
                </>
              ) : (
                <>
                  <GitBranch className="w-4 h-4" /> Build Flowchart
                </>
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-border flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Select Paper to Analyze
            </label>
            <div className="relative">
              <select
                value={selectedPaperId || ""}
                onChange={(e) => handlePaperChange(parseInt(e.target.value))}
                className="w-full appearance-none bg-background border border-border hover:border-primary/50 text-sm font-semibold text-foreground rounded-xl py-3 pl-4 pr-10 outline-none transition-all shadow-sm focus:ring-2 focus:ring-primary/20 truncate"
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
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ArrowDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="card-premium p-16 flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              AI is building your flowchart…
            </p>
            <p className="text-muted-foreground text-xs">
              This may take 10–20 seconds
            </p>
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
                  <div
                    className={`rounded-2xl border-2 p-5 ${node.color || "border-primary/40 bg-primary/5"}`}
                  >
                    <div
                      className={`text-xs font-semibold uppercase tracking-widest mb-2 ${node.labelColor || "text-primary"}`}
                    >
                      Step {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3
                      className={`font-display text-xl font-bold mb-2 ${node.labelColor || "text-primary"}`}
                    >
                      {node.label}
                    </h3>
                    <p className="text-foreground text-sm leading-relaxed">
                      {node.desc}
                    </p>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <GitBranch className="w-14 h-14 text-muted-foreground opacity-30" />
            <div>
              <p className="text-foreground font-semibold mb-1">
                No flowchart yet
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Click{" "}
                <span className="text-primary font-semibold">
                  Generate Flowchart
                </span>{" "}
                above
                <br />
                to create an AI-powered visual overview of your paper.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
