import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "Adaptive Learning",
    description:
      "VoxScholar adapts explanations based on your knowledge level — from beginner to research expert.",
  },
  {
    title: "Mathematical Simplification",
    description:
      "Complex equations are broken down with step-by-step explanations and real-world interpretations.",
  },
  {
    title: "Personalized Research Memory",
    description:
      "The AI remembers all your past papers and surfaces meaningful connections across your entire research journey.",
  },
  {
    title: "Multimodal Learning",
    description:
      "Combine text, audio podcasts, visual flowcharts, and interactive Q&A for deeper comprehension.",
  },
  {
    title: "Academic Intelligence",
    description:
      "Trained on millions of papers, VoxScholar understands context, citations, and domain-specific language.",
  },
  {
    title: "Offline-First Notes",
    description:
      "Rich text notes sync with your research and can be exported as formatted PDFs instantly.",
  },
];

export default function WhyVoxSection() {
  return (
    <section className="section-padding bg-background" id="why">
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Why VoxScholar AI
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Research, Reimagined
              <br />
              <span className="text-gradient-primary">for Human Minds.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Academic papers are dense, complex, and hard to digest. VoxScholar AI bridges
              the gap between raw research and human understanding — through the power of
              conversation, audio, and intelligent assistance.
            </p>
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-card border border-border shadow-card">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Trusted by{" "}
                <span className="font-semibold text-foreground">10,000+ researchers</span>{" "}
                worldwide
              </span>
            </div>
          </motion.div>

          {/* Right benefits */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                className="p-4 rounded-xl bg-gradient-card border border-border shadow-card hover:shadow-glow transition-all duration-300"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <CheckCircle2 className="w-5 h-5 text-primary mb-2" />
                <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
