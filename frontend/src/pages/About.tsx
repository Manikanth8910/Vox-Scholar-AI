import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { motion } from "framer-motion";
import { Target, Users, Zap } from "lucide-react";

const team = [
  { name: "Dr. Elena Vasquez", role: "Chief AI Researcher", initial: "E" },
  { name: "Prof. James Okafor", role: "Academic Advisor", initial: "J" },
  { name: "Sana Patel", role: "Lead Engineer", initial: "S" },
  { name: "Marcus Chen", role: "UX Research Lead", initial: "M" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-5xl font-bold text-foreground mb-4">
              About <span className="text-gradient-primary">VoxScholar AI</span>
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl mx-auto">
              We're building the future of academic research — making complex
              papers accessible, interactive, and genuinely human-like.
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            className="card-premium p-8 mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Target className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              Our Mission
            </h2>
            <p className="text-muted-foreground text-xl italic font-display leading-relaxed">
              "To make research accessible, interactive, and human-like."
            </p>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
              Academic papers are written for experts, but ideas deserve to
              reach everyone. VoxScholar AI bridges the gap between raw research
              and human understanding through AI-powered conversations, adaptive
              learning, and intelligent assistance.
            </p>
          </motion.div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {[
              {
                icon: Zap,
                title: "Intelligence First",
                desc: "Every feature is powered by state-of-the-art AI, fine-tuned for academic comprehension.",
              },
              {
                icon: Users,
                title: "Built for Researchers",
                desc: "Designed with feedback from PhDs, students, and professors across 30+ universities.",
              },
              {
                icon: Target,
                title: "Democratizing Knowledge",
                desc: "We believe cutting-edge research should be understandable by anyone, anywhere.",
              },
              {
                icon: Zap,
                title: "Continuous Learning",
                desc: "Our AI evolves with your research journey, remembering context across all your papers.",
              },
            ].map((value, i) => (
              <motion.div
                key={value.title}
                className="card-premium p-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              >
                <value.icon className="w-7 h-7 text-primary mb-3" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">{value.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Team */}
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Our Team
            </h2>
            <p className="text-muted-foreground mt-2">
              Passionate researchers and engineers
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                className="card-premium p-5 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.06 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-display text-2xl font-bold mx-auto mb-3">
                  {member.initial}
                </div>
                <div className="font-semibold text-foreground text-sm">
                  {member.name}
                </div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  {member.role}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
