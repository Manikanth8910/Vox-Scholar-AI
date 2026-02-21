import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAudio } from "../../context/AudioContext";
import {
  Headphones,
  LayoutDashboard,
  Upload,
  Headphones as PodcastIcon,
  MessageSquare,
  FileText,
  Brain,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Upload, label: "Upload Paper", to: "/upload" },
  { icon: PodcastIcon, label: "Podcast", to: "/podcast" },
  { icon: MessageSquare, label: "Q&A Chat", to: "/qa" },
  { icon: FileText, label: "Notes", to: "/notes" },
  { icon: Brain, label: "Research Memory", to: "/memory" },
  { icon: BarChart3, label: "Flowchart", to: "/flowchart" },
];



interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    // Persist dark mode across pages via localStorage
    return localStorage.getItem("theme") !== "light";
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("currentPaperId");
    localStorage.removeItem("current_paper_id");
    navigate("/");
  };

  // Apply dark class to <html> so ALL screens share the same mode
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => { });
  }, []);

  const audio = useAudio();
  const userName = localStorage.getItem("userName") || user?.full_name || user?.username || "User";
  const userInitial = (user?.full_name?.[0] || user?.username?.[0] || userName[0] || "?").toUpperCase();

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0`}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-sidebar-foreground">
              VoxScholar <span className="text-gold">AI</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                    ? "bg-gradient-primary text-white shadow-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${active ? "animate-pulse" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-all"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          {/* Top nav */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              {/* Mobile toggle */}
              <button
                className="lg:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              {title && (
                <h1 className="font-display text-xl font-semibold text-foreground hidden sm:block">
                  {title}
                </h1>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Mode selector */}
              <div className="hidden md:flex items-center gap-2 relative">
                <select
                  value={audio.selectedStyle}
                  onChange={(e) => audio.setSelectedStyle(e.target.value)}
                  className="appearance-none bg-gradient-primary border border-primary/20 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-widest rounded-full pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-glow"
                >
                  <option value="educational">🎓 Educational</option>
                  <option value="beginner">🌱 Beginner</option>
                  <option value="exam">📋 Exam Prep</option>
                  <option value="research">🔬 Research</option>
                  <option value="debate">⚡ Debate</option>
                  <option value="storytelling">📖 Storytelling</option>
                  <option value="real-life">🌍 Real-Life</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/80 pointer-events-none" />
              </div>

              {/* Dark mode toggle */}
              <button
                onClick={() => setDark(!dark)}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-all border border-border"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-glow uppercase truncate"
                >
                  {userInitial}
                </button>
                {profileOpen && (
                  <div className="absolute top-full mt-1 right-0 w-44 bg-card border border-border rounded-xl shadow-card py-1 z-50">
                    <div className="px-4 py-2 border-b border-border mb-1">
                      <p className="text-xs text-muted-foreground truncate">{userName}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className={`flex-1 p-4 md:p-6 overflow-auto ${audio.audioSrc ? 'pb-24' : ''}`}>
            {children}
          </main>
        </div>
      </div>

      {/* Persistent Mini Player — visible on all screens while podcast plays */}
      {audio.audioSrc && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            {/* Album icon */}
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            {/* Title */}
            <div className="hidden sm:block min-w-0 w-36">
              <p className="text-xs font-semibold text-foreground truncate">{audio.podcastTitle || "Podcast"}</p>
              <p className="text-[10px] text-muted-foreground">{fmt(audio.currentTime)} / {fmt(audio.duration)}</p>
            </div>
            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => audio.skip(-10)} className="text-muted-foreground hover:text-foreground transition-colors">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={audio.togglePlay}
                className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
              >
                {audio.playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
              </button>
              <button onClick={() => audio.skip(10)} className="text-muted-foreground hover:text-foreground transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
            {/* Progress bar */}
            <div
              className="flex-1 h-1.5 bg-muted rounded-full cursor-pointer relative group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                audio.seek((e.clientX - rect.left) / rect.width);
              }}
            >
              <div
                className="h-full bg-gradient-primary rounded-full transition-all"
                style={{ width: `${audio.progress}%` }}
              />
            </div>
            {/* Volume */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="range" min={0} max={1} step={0.05}
                value={audio.volume}
                onChange={e => audio.setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
