import { motion } from "framer-motion";
import { Upload, Mic, HelpCircle } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload PDF",
    description:
      "Drag and drop your research paper. VoxScholar AI processes any academic PDF instantly.",
    color: "text-primary",
    bg: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  {
    icon: Mic,
    step: "02",
    title: "AI Generates Dialogue",
    description:
      "Our AI transforms the paper into a natural two-speaker podcast conversation with smart recaps.",
    color: "text-accent",
    bg: "bg-accent/10",
    borderColor: "border-accent/30",
  },
  {
    icon: HelpCircle,
    step: "03",
    title: "Ask & Understand",
    description:
      "Ask follow-up questions, explain equations, and take notes — all while listening.",
    color: "text-indigo-light",
    bg: "bg-indigo/10",
    borderColor: "border-indigo/30",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="section-padding bg-muted/30" id="how-it-works">
      <div className="container-max">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Simple Process
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It <span className="text-gradient-gold">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From PDF to podcast in seconds. Research has never been this intuitive.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary via-accent to-indigo opacity-30" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                className="relative text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                {/* Icon circle */}
                <div className="relative inline-flex mb-6">
                  <div
                    className={`w-20 h-20 rounded-2xl ${step.bg} border ${step.borderColor} flex items-center justify-center`}
                  >
                    <step.icon className={`w-9 h-9 ${step.color}`} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-primary text-white text-xs font-bold flex items-center justify-center shadow-glow">
                    {index + 1}
                  </span>
                </div>

                <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>

                {/* Arrow for md */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-4 text-muted-foreground/40 text-2xl">
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
