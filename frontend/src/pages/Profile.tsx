import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Edit3, BookOpen, MessageSquare, Headphones, User, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [recentPapers, setRecentPapers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch profile stats
    api.get('/auth/profile')
      .then(({ data }) => setProfile(data))
      .catch(() => { });

    // Fetch papers
    api.get('/papers?limit=5')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data?.items ?? [];
        setRecentPapers(list);
      })
      .catch(() => { });
  }, []);

  const userInitial = profile?.full_name?.[0] || profile?.username?.[0] || "?";

  const statsList = [
    { label: "Total Podcasts", value: profile?.podcasts_count?.toString() || "0", icon: Headphones },
    { label: "Questions Asked", value: profile?.questions_asked?.toString() || "0", icon: MessageSquare },
    { label: "Notes Created", value: profile?.notes_count?.toString() || "0", icon: BookOpen },
  ];
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
              {userInitial}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-foreground">{profile?.full_name || "New User"}</h2>
              <p className="text-muted-foreground">{profile?.email || profile?.username}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile?.role === 'admin' ? (
                  <span className="px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-medium">Administrator</span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Scholar</span>
                )}
                {profile?.username && (
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">@{profile.username}</span>
                )}
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all">
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground">{profile?.papers_count || 0}</div>
              <div className="text-muted-foreground text-sm">Papers Studied</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground">{profile?.podcasts_count || 0}</div>
              <div className="text-muted-foreground text-sm">Audio Insights</div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statsList.map((stat, i) => (
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
            {recentPapers.length > 0 ? recentPapers.map((paper, i) => (
              <div key={paper.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground text-sm font-medium truncate">{paper.title}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(paper.created_at).toLocaleDateString()}</div>
                </div>
                <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            )) : (
              <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                No papers encountered yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
