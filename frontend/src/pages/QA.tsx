import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Send, Volume2, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";

const initialMessages = [
  {
    role: "ai",
    text: "Hello! I've fully analyzed 'Attention Is All You Need'. Ask me anything — from high-level concepts to specific equations.",
  },
  {
    role: "user",
    text: "Can you explain what Multi-Head Attention is in simple terms?",
  },
  {
    role: "ai",
    text: "Great question! Multi-Head Attention allows the model to look at different aspects of the input simultaneously. Imagine having 8 \"readers\" each focusing on a different part of the text — one tracks grammar, another tracks semantics, another follows cross-references. By running attention 'h' times in parallel with different learned projections, the model captures richer representations than a single attention mechanism could.",
  },
];

export default function QAPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPaper, setCurrentPaper] = useState<any>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pid = localStorage.getItem("current_paper_id");
    if (pid) {
      api.get(`/papers/${pid}`).then(({ data }) => setCurrentPaper(data)).catch(() => { });
      api.get(`/chat/history?paper_id=${pid}`).then(({ data }) => {
        const history = data.messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'ai',
          text: m.content
        }));
        setMessages(history.length > 0 ? history : [
          { role: "ai", text: "Hello! I'm ready to help you analyze your paper. Ask me anything!" }
        ]);
      }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const paperId = localStorage.getItem("current_paper_id");
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await api.post('/chat', {
        message: input,
        paper_id: paperId ? parseInt(paperId) : null,
        chat_history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      });

      setMessages(prev => [...prev, { role: "ai", text: data.message }]);
    } catch (err) {
      toast({ title: "Error", description: "Failed to get AI response", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Interactive Q&A">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-160px)]">
        {/* Context banner */}
        {currentPaper && (
          <motion.div
            className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">
              Chatting about: <strong>{currentPaper.title}</strong>
            </span>
          </motion.div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 ${msg.role === "user"
                    ? "bg-gradient-primary text-white rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                    }`}
                >
                  {msg.role === "ai" && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        VoxScholar AI
                      </span>
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Volume2 className="w-3 h-3" />
                        Play
                      </button>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 bg-card border border-border rounded-2xl flex items-center gap-3 px-4 py-3 focus-within:border-primary/50 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything about this research…"
              className="flex-1 bg-transparent text-foreground placeholder-muted-foreground text-sm focus:outline-none"
            />
          </div>
          <motion.button
            onClick={sendMessage}
            disabled={isLoading}
            whileTap={{ scale: 0.93 }}
            className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
          </motion.button>
        </div>
      </div>
    </DashboardLayout>
  );
}
