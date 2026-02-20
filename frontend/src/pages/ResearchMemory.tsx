import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { FileText, Calendar, Tag, Link, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";

const papers = [
  {
    id: 1,
    title: "Attention Is All You Need",
    date: "Feb 18, 2025",
    tags: ["Transformers", "NLP", "Attention"],
    similarity: 95,
    related: "BERT",
  },
  {
    id: 2,
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    date: "Feb 15, 2025",
    tags: ["NLP", "Pre-training", "BERT"],
    similarity: 88,
    related: "Attention Is All You Need",
  },
  {
    id: 3,
    title: "Deep Residual Learning for Image Recognition",
    date: "Feb 12, 2025",
    tags: ["Computer Vision", "ResNet", "Deep Learning"],
    similarity: 42,
    related: null,
  },
  {
    id: 4,
    title: "Generative Adversarial Networks",
    date: "Feb 8, 2025",
    tags: ["GANs", "Generative Models"],
    similarity: 37,
    related: null,
  },
  {
    id: 5,
    title: "Neural Architecture Search with Reinforcement Learning",
    date: "Feb 3, 2025",
    tags: ["AutoML", "NAS", "RL"],
    similarity: 60,
    related: "Attention Is All You Need",
  },
];

export default function ResearchMemory() {
  return (
    <DashboardLayout title="Research Memory">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Papers Studied", value: "24" },
            { label: "Topics Covered", value: "11" },
            { label: "Research Hours", value: "48h" },
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
          {papers.map((paper, i) => (
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
                      <Calendar className="w-3 h-3" /> {paper.date}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {paper.related && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                      <Link className="w-3 h-3" />
                      Connects with: <strong>{paper.related}</strong>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="w-3 h-3" /> Similarity
                  </div>
                  <div className="font-display text-2xl font-bold" style={{
                    color: paper.similarity > 70 ? "hsl(var(--primary))" : paper.similarity > 50 ? "hsl(var(--gold))" : "hsl(var(--muted-foreground))"
                  }}>
                    {paper.similarity}%
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
