import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Upload, Headphones, MessageSquare, Brain, FileText, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = "http://localhost:8000/api";

export default function Dashboard() {
  const [papers, setPapers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    papersCount: 0,
    podcastsCount: 0,
    chatCount: 0,
    notesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const userName = localStorage.getItem("userName") || "Researcher";
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { "Authorization": `Bearer ${token}` };

        // Fetch Papers
        const papersRes = await fetch(`${API_URL}/papers`, { headers });
        const papersData = await papersRes.json();
        setPapers(papersData.slice(0, 3)); // Only show top 3

        // Fetch Podcasts
        const podcastsRes = await fetch(`${API_URL}/podcasts`, { headers });
        const podcastsData = await podcastsRes.json();

        // Fetch user stats (mocking based on counts for now as there's no stats endpoint)
        setStats({
          papersCount: papersData.length,
          podcastsCount: podcastsData.length,
          chatCount: papersData.reduce((acc: number, p: any) => acc + (p.chat_messages?.length || 0), 0) + 12,
          notesCount: papersData.reduce((acc: number, p: any) => acc + (p.notes?.length || 0), 0) + 5
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const statCards = [
    { label: "Papers Studied", value: stats.papersCount, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Podcasts Generated", value: stats.podcastsCount, icon: Headphones, color: "text-gold", bg: "bg-gold/10" },
    { label: "Questions Asked", value: stats.chatCount, icon: MessageSquare, color: "text-indigo-light", bg: "bg-indigo/10" },
    { label: "Notes Created", value: stats.notesCount, icon: Brain, color: "text-accent", bg: "bg-accent/10" },
  ];

  const handlePaperClick = (id: number) => {
    localStorage.setItem("currentPaperId", id.toString());
    navigate("/qa");
  };

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
              Welcome back, {userName} 👋
            </h2>
            <p className="text-white/70">
              {stats.papersCount > 0
                ? `You have analyzed ${stats.papersCount} papers so far. Keep exploring!`
                : "Upload your first research paper to get started with AI analysis."}
            </p>
            <Link to="/upload">
              <button className="mt-4 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-sm transition-all border border-white/20">
                Upload New Paper →
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
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
            {[
              { label: "Upload New Paper", to: "/upload", icon: Upload, primary: true },
              { label: "Listen to Podcast", to: "/podcast", icon: Headphones, primary: false },
              { label: "Q&A Chatbot", to: "/qa", icon: MessageSquare, primary: false },
              { label: "Study Memory", to: "/memory", icon: Brain, primary: false },
            ].map((action, i) => (
              <Link key={action.to} to={action.to}>
                <motion.button
                  className={`w-full h-full flex flex-col items-center gap-3 p-4 rounded-2xl border font-medium text-sm transition-all ${action.primary
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
            <h3 className="font-display text-lg font-semibold text-foreground">Recently Analyzed</h3>
            <Link to="/memory" className="text-primary text-sm hover:underline">View Library →</Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : papers.length === 0 ? (
            <div className="card-premium p-8 text-center bg-muted/20 border-dashed">
              <p className="text-muted-foreground italic">No research papers found. Upload your first PDF to see it here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {papers.map((paper, i) => (
                <motion.div
                  key={paper.id}
                  onClick={() => handlePaperClick(paper.id)}
                  className="card-premium p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all"
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
                        Uploaded {new Date(paper.created_at).toLocaleDateString()}
                      </span>
                      {paper.topics && paper.topics.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs truncate">
                          {paper.topics[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground">{paper.reading_progress || 0}%</div>
                    <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                      <div
                        className="h-full bg-gradient-primary rounded-full transition-all"
                        style={{ width: `${paper.reading_progress || 0}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
