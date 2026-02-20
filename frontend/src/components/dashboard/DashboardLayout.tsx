import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/api";
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

const modes = [
  "Beginner Mode",
  "Exam Mode",
  "Research Mode",
  "Debate Mode",
  "Storytelling Mode",
  "Real-Life Example Mode",
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [mode, setMode] = useState("Research Mode");
  const [modeOpen, setModeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => {
        // If unauthorized, could redirect to login
      });
  }, []);

  const userInitial = user?.full_name?.[0] || user?.username?.[0] || "?";

  return (
    <div className={dark ? "dark" : ""}>
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
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
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
              onClick={() => navigate("/")}
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
              <div className="relative hidden md:block">
                <button
                  onClick={() => setModeOpen(!modeOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent/20 transition-all border border-border"
                >
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {mode}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {modeOpen && (
                  <div className="absolute top-full mt-1 right-0 w-56 bg-card border border-border rounded-xl shadow-card py-1 z-50">
                    {modes.map((m) => (
                      <button
                        key={m}
                        onClick={() => { setMode(m); setModeOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${mode === m
                            ? "text-primary font-medium bg-primary/5"
                            : "text-foreground hover:bg-muted"
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
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
                  className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-glow"
                >
                  {userInitial}
                </button>
                {profileOpen && (
                  <div className="absolute top-full mt-1 right-0 w-44 bg-card border border-border rounded-xl shadow-card py-1 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <button
                      onClick={() => navigate("/")}
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
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
