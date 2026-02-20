import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Send, Volume2, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { marked } from "marked";

// Configure marked for safe, clean rendering
marked.setOptions({ breaks: true, gfm: true } as any);

function renderMarkdown(text: string): string {
  const raw = marked.parse(text || "") as string;
  return raw;
}

export default function QAPage() {
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paperId, setPaperId] = useState<number | null>(null);
  const [paperData, setPaperData] = useState<any>(null);

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
    } else {
      setMessages([{ role: "ai", text: "Hello! Upload a research paper first, then ask me anything about it." }]);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");

    const newMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("You must be logged in to chat.");

      const chatHistory = messages
        .filter(m => !m.text.startsWith("Hello!"))
        .map(m => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text
        }));

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paper_id: paperId || 1,
          message: userMessage,
          chat_history: chatHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "ai", text: data.message }]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages(prev => [
        ...prev,
        { role: "ai", text: `Error: ${err.message}. Please try refreshing or ensuring the paper is fully processed.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Interactive Q&A">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-160px)]">
        {/* Context banner */}
        <motion.div
          className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm text-foreground">
            Analyzing <strong>{paperData?.title || "Research Paper"}</strong>
            {paperData?.authors ? ` by ${paperData.authors}` : ""}
          </span>
        </motion.div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin pr-1">
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
                  className={`max-w-[82%] rounded-2xl px-4 py-3 ${msg.role === "user"
                    ? "bg-gradient-primary text-white rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                    }`}
                >
                  {msg.role === "ai" && (
                    <div className="flex items-center justify-between mb-2 border-b border-border pb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-tighter">
                        VoxScholar Expert Analysis
                      </span>
                      <button
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance(msg.text);
                          window.speechSynthesis.speak(utterance);
                        }}
                      >
                        <Volume2 className="w-3 h-3" />
                        Play
                      </button>
                    </div>
                  )}
                  {msg.role === "ai" ? (
                    <div
                      className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none
                        [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-primary
                        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
                        [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_li]:text-sm
                        [&_ol]:pl-4 [&_ol]:space-y-0.5
                        [&_strong]:text-foreground [&_strong]:font-semibold
                        [&_p]:mb-2 [&_p:last-child]:mb-0
                        [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-xs"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wide mr-2">VoxScholar AI</span>
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 bg-card border border-border rounded-2xl flex items-center gap-3 px-4 py-3 focus-within:border-primary/50 transition-all shadow-premium">
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
            disabled={loading}
            whileTap={{ scale: 0.93 }}
            className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
          </motion.button>
        </div>
      </div>
    </DashboardLayout>
  );
}
