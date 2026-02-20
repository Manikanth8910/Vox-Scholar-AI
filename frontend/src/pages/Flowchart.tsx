import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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

  return (
    <DashboardLayout title="Flowchart View">
      <div className="max-w-2xl mx-auto py-4">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
      </div>
    </DashboardLayout>
  );
}
