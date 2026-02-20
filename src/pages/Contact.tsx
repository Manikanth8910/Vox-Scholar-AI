import { useState } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { motion } from "framer-motion";
import { Send, Mail, MapPin, Clock } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const update = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-5xl font-bold text-foreground mb-3">
              Get in <span className="text-gradient-gold">Touch</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Have a question or feedback? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Info */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              {[
                { icon: Mail, label: "Email", value: "hello@voxscholar.ai" },
                { icon: MapPin, label: "Location", value: "Cambridge, MA, USA" },
                { icon: Clock, label: "Response Time", value: "Within 24 hours" },
              ].map((item) => (
                <div key={item.label} className="card-premium p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="font-medium text-foreground text-sm">{item.value}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Form */}
            <motion.div
              className="md:col-span-2 card-premium p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={update("name")}
                        placeholder="Your name"
                        className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={update("email")}
                        placeholder="your@email.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
                    <textarea
                      value={form.message}
                      onChange={update("message")}
                      rows={6}
                      placeholder="Tell us about your research needs or feedback…"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-all resize-none"
                    />
                  </div>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
