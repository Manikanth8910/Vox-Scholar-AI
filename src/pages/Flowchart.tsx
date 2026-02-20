import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const flowNodes = [
  {
    id: "problem",
    label: "Problem Statement",
    desc: "Sequence transduction models rely on complex RNNs or CNNs. Attention mechanisms have limited global dependency modeling.",
    color: "border-primary/40 bg-primary/5",
    labelColor: "text-primary",
  },
  {
    id: "method",
    label: "Proposed Method",
    desc: "Transformer architecture based entirely on attention mechanisms — no recurrence, no convolution.",
    color: "border-gold/40 bg-gold/5",
    labelColor: "text-gold",
  },
  {
    id: "dataset",
    label: "Dataset",
    desc: "WMT 2014 English-German (4.5M sentence pairs) and English-French (36M sentence pairs) translation tasks.",
    color: "border-indigo/40 bg-indigo/5",
    labelColor: "text-indigo-light",
  },
  {
    id: "eval",
    label: "Evaluation",
    desc: "BLEU score benchmarking against state-of-the-art models. Computational cost comparison in FLOPs.",
    color: "border-accent/40 bg-accent/5",
    labelColor: "text-accent",
  },
  {
    id: "results",
    label: "Results",
    desc: "28.4 BLEU on EN-DE, 41.0 on EN-FR. Trained in 12 hours on 8 P100 GPUs — orders of magnitude faster.",
    color: "border-primary/40 bg-primary/5",
    labelColor: "text-primary",
  },
  {
    id: "applications",
    label: "Applications",
    desc: "Machine translation, text summarization, image generation, protein structure prediction, and code synthesis.",
    color: "border-gold/40 bg-gold/5",
    labelColor: "text-gold",
  },
];

export default function FlowchartPage() {
  return (
    <DashboardLayout title="Flowchart View">
      <div className="max-w-2xl mx-auto py-4">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            Attention Is All You Need
          </h2>
          <p className="text-muted-foreground text-sm">Research methodology flowchart</p>
        </motion.div>

        <div className="space-y-0">
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
