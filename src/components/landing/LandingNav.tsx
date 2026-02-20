import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Headphones, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-dark shadow-card py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container-max px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-white">
            VoxScholar <span className="text-gold">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "How It Works", "Why VoxScholar"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <button className="px-5 py-2 rounded-xl text-white/80 hover:text-white text-sm font-medium transition-colors border border-white/20 hover:border-white/40">
              Sign In
            </button>
          </Link>
          <Link to="/signup">
            <button className="btn-gold text-sm py-2">Get Started</button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-dark md:hidden border-t border-white/10"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {["Features", "How It Works", "Why VoxScholar"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-white/70 hover:text-white transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1">
                  <button className="w-full px-4 py-2 rounded-xl border border-white/20 text-white text-sm">
                    Sign In
                  </button>
                </Link>
                <Link to="/signup" className="flex-1">
                  <button className="w-full btn-gold text-sm py-2">Get Started</button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
