import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Upload, Headphones, MessageSquare, Brain, FileText, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { label: "Papers Studied", value: "24", icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  { label: "Podcasts Generated", value: "18", icon: Headphones, color: "text-gold", bg: "bg-gold/10" },
  { label: "Questions Asked", value: "312", icon: MessageSquare, color: "text-indigo-light", bg: "bg-indigo/10" },
  { label: "Notes Created", value: "47", icon: Brain, color: "text-accent", bg: "bg-accent/10" },
];

const quickActions = [
  { label: "Upload New Paper", to: "/upload", icon: Upload, primary: true },
  { label: "Continue Podcast", to: "/podcast", icon: Headphones, primary: false },
  { label: "Open Q&A Chat", to: "/qa", icon: MessageSquare, primary: false },
  { label: "Research Memory", to: "/memory", icon: Brain, primary: false },
];

const recentPapers = [
  { title: "Attention Is All You Need", date: "Feb 18", topic: "Transformers", progress: 85 },
  { title: "BERT: Pre-training of Deep Bidirectional Transformers", date: "Feb 15", topic: "NLP", progress: 60 },
  { title: "Deep Residual Learning for Image Recognition", date: "Feb 12", topic: "CV", progress: 100 },
];

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome */}
        <motion.div
          className="rounded-2xl bg-gradient-primary p-6 shadow-glow relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10">
            <h2 className="font-display text-2xl font-bold text-white mb-1">
              Good morning, Dr. Jane 👋
            </h2>
            <p className="text-white/70">Ready to explore research today? You have 3 papers waiting.</p>
            <Link to="/upload">
              <button className="mt-4 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-sm transition-all border border-white/20">
                Upload New Paper →
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="card-premium p-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="font-display text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-muted-foreground text-sm mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <Link key={action.to} to={action.to}>
                <motion.button
                  className={`w-full flex flex-col items-center gap-3 p-4 rounded-2xl border font-medium text-sm transition-all ${
                    action.primary
                      ? "bg-gradient-primary text-white border-transparent shadow-glow hover:shadow-lg"
                      : "bg-card border-border text-foreground hover:border-primary/30 hover:shadow-glow"
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <action.icon className="w-6 h-6" />
                  {action.label}
                </motion.button>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent papers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold text-foreground">Recent Papers</h3>
            <Link to="/memory" className="text-primary text-sm hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentPapers.map((paper, i) => (
              <motion.div
                key={paper.title}
                className="card-premium p-4 flex items-center gap-4"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{paper.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {paper.date}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                      {paper.topic}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-foreground">{paper.progress}%</div>
                  <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                    <div
                      className="h-full bg-gradient-primary rounded-full"
                      style={{ width: `${paper.progress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
