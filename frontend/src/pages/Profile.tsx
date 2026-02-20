import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Edit3, BookOpen, MessageSquare, Headphones, User } from "lucide-react";

const recentPapers = [
  "Attention Is All You Need",
  "BERT: Pre-training of Deep Bidirectional Transformers",
  "Deep Residual Learning for Image Recognition",
];

const stats = [
  { label: "Total Podcasts Generated", value: "18", icon: Headphones },
  { label: "Total Questions Asked", value: "312", icon: MessageSquare },
  { label: "Notes Created", value: "47", icon: BookOpen },
];

export default function Profile() {
  return (
    <DashboardLayout title="Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile card */}
        <motion.div
          className="card-premium p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-display text-3xl font-bold shadow-glow shrink-0">
              J
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-foreground">Dr. Jane Smith</h2>
              <p className="text-muted-foreground">jane.smith@university.edu</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["Machine Learning", "NLP", "Computer Vision"].map((interest) => (
                  <span key={interest} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all">
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground">24</div>
              <div className="text-muted-foreground text-sm">Papers Studied</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground">48h</div>
              <div className="text-muted-foreground text-sm">Research Time</div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="card-premium p-5 text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-muted-foreground text-xs mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Recently studied */}
        <motion.div
          className="card-premium p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display font-semibold text-foreground mb-4">Recently Studied Papers</h3>
          <div className="space-y-3">
            {recentPapers.map((paper, i) => (
              <div key={paper} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-sm">{paper}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
