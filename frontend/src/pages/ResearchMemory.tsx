import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { FileText, Calendar, Tag, Link, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import api from "../lib/api";

export default function ResearchMemory() {
  const [papers, setPapers] = useState<any[]>([]);

  useEffect(() => {
    api.get('/papers')
      .then(({ data }) => setPapers(data))
      .catch(() => { });
  }, []);
  return (
    <DashboardLayout title="Research Memory">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Papers Studied", value: papers.length.toString() },
            { label: "Topics Covered", value: "--" },
            { label: "Research Hours", value: "--" },
          ].map((s) => (
            <div key={s.label} className="card-premium p-4 text-center">
              <div className="font-display text-3xl font-bold text-foreground">{s.value}</div>
              <div className="text-muted-foreground text-sm mt-1">{s.label}</div>
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
            <strong>New connection detected:</strong> Your latest paper connects with your earlier study on{" "}
            <strong>BERT architecture</strong>. View related concepts →
          </span>
        </motion.div>

        {/* Paper list */}
        <div className="space-y-3">
          {papers.length > 0 ? papers.map((paper, i) => (
            <motion.div
              key={paper.id}
              className="card-premium p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-semibold text-foreground mb-1">{paper.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(paper.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(paper.topics || ["Research"]).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="w-3 h-3" /> Progress
                  </div>
                  <div className="font-display text-2xl font-bold text-primary">
                    {paper.reading_progress || 0}%
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="card-premium p-10 text-center text-muted-foreground">
              No papers in research memory yet.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
