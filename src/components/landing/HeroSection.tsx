import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Headphones } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-hero opacity-85" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/6 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div
        className="absolute bottom-1/4 right-1/6 w-48 h-48 rounded-full bg-accent/10 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-6">
          <span className="flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-sm font-medium text-gold border border-gold/20">
            <Headphones className="w-4 h-4" />
            AI-Powered Research Assistant
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
        >
          Transform Research Papers
          <br />
          <span className="text-gradient-gold">into Conversations.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-white/70 mb-4 font-light tracking-wide"
        >
          Upload. Listen. Question. Understand.
        </motion.p>

        <motion.p
          variants={itemVariants}
          className="text-base text-white/50 mb-10 max-w-2xl mx-auto italic font-display"
        >
          "Where Research Speaks Back."
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup">
            <button className="btn-gold flex items-center gap-2 text-base shadow-gold">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
            <Play className="w-5 h-5 fill-white" />
            Watch Demo
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {[
            { value: "10K+", label: "Papers Analyzed" },
            { value: "50K+", label: "Podcasts Generated" },
            { value: "99%", label: "Scholar Satisfaction" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-gradient-gold">{stat.value}</div>
              <div className="text-white/50 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
