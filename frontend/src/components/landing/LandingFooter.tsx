import { Link } from "react-router-dom";
import { Headphones, Twitter, Github, Linkedin, Mail } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container-max px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-background">
                VoxScholar <span className="text-gold">AI</span>
              </span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed mb-6">
              Where Research Speaks Back. Transform papers into interactive conversations.
            </p>
            <div className="flex gap-3">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-lg bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-background/70" />
                </button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-background mb-4">Product</h4>
            <ul className="space-y-2 text-background/60 text-sm">
              {["Features", "How It Works", "Pricing", "Changelog"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-background transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-2 text-background/60 text-sm">
              {[
                { label: "About", to: "/about" },
                { label: "Contact", to: "/contact" },
                { label: "Privacy Policy", to: "#" },
                { label: "Terms of Service", to: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="hover:text-background transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-background mb-4">Stay Updated</h4>
            <p className="text-background/60 text-sm mb-4">
              Get the latest research AI updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 rounded-lg bg-background/10 border border-background/20 text-background placeholder-background/40 text-sm focus:outline-none focus:border-gold/60"
              />
              <button className="px-4 py-2 rounded-lg bg-gradient-gold text-accent-foreground text-sm font-semibold hover:shadow-gold transition-all">
                →
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/40 text-sm">
            © 2025 VoxScholar AI. All rights reserved.
          </p>
          <p className="text-background/40 text-sm italic font-display">
            "Where Research Speaks Back."
          </p>
        </div>
      </div>
    </footer>
  );
}
