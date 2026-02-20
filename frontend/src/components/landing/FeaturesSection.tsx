import { motion } from "framer-motion";
import {
  Headphones,
  MessageSquare,
  Calculator,
  Layers,
  Brain,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Headphones,
    title: "AI Podcast Generator",
    description:
      "Transform dense research papers into engaging two-speaker dialogues with natural conversation flow.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: MessageSquare,
    title: "Interactive Q&A",
    description:
      "Ask anything about the paper and get context-aware AI responses grounded in the research.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Calculator,
    title: "Smart Equation Explainer",
    description:
      "Complex equations broken down into plain English with variable tables and real-world interpretations.",
    color: "text-indigo-light",
    bg: "bg-indigo/10",
  },
  {
    icon: Layers,
    title: "Adaptive Learning Modes",
    description:
      "Switch between Beginner, Exam, Research, Debate, Storytelling, and Real-Life Example modes.",
    color: "text-gold",
    bg: "bg-gold/10",
  },
  {
    icon: Brain,
    title: "Research Memory",
    description:
      "AI remembers your previous studies and highlights connections between related research papers.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: FileText,
    title: "Notes & Flowcharts",
    description:
      "Rich text notes with one-click flowchart generation to visualize research methodology.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
  return (
    <section className="section-padding bg-background" id="features">
      <div className="container-max">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Powerful Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="text-gradient-primary">Master Research</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Six intelligent tools that transform how academics, students, and researchers
            interact with complex scientific literature.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="card-premium p-6 group"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
