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
  const [messages, setMessages] = useState<
    Array<{ role: string; text: string }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paperId, setPaperId] = useState<number | null>(null);
  const [paperData, setPaperData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const pid = localStorage.getItem("current_paper_id");
    if (pid) {
      const numericId = parseInt(pid);
      setPaperId(numericId);
      api
        .get(`/papers/${numericId}`)
        .then(({ data }) => setPaperData(data))
        .catch(() => { });
      api
        .get(`/chat/history/${pid}`)
        .then(({ data }) => {
          const history = data.messages.map((m: any) => ({
            role: m.role === "user" ? "user" : "ai",
            text: m.content,
          }));
          setMessages(
            history.length > 0
              ? history
              : [
                {
                  role: "ai",
                  text: "Hello! I'm ready to help you analyze your paper. Ask me anything!",
                },
              ],
          );
        })
        .catch(() => { });
    } else {
      setMessages([
        {
          role: "ai",
          text: "Hello! Upload a research paper first, then ask me anything about it.",
        },
      ]);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");

    const newMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    const paperIdToUse = paperId || (localStorage.getItem("current_paper_id") ? parseInt(localStorage.getItem("current_paper_id")!) : null);

    if (!paperIdToUse) {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Please select a research paper from the dashboard or upload one first so I can provide context." }
      ]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in to chat.");

      const chatHistory = messages
        .filter((m) => !m.text.startsWith("Hello!"))
        .slice(-6) // Only send last 3 rounds of chat to keep context fresh
        .map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text,
        }));

      const { data } = await api.post(`/chat`, {
        paper_id: paperIdToUse,
        message: userMessage,
        chat_history: chatHistory,
      });

      if (data && data.message) {
        setMessages((prev) => [...prev, { role: "ai", text: data.message }]);
      } else {
        throw new Error("Received an empty response from the AI service.");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to connect to AI";
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Error: ${errorMsg}. Please ensure you have selected a paper and try again.`,
        },
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
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin pr-1"
        >
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
                    </div>
                  )}
                  {msg.role === "ai" ? (
                    <div
                      className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none
                        [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-primary [&_h2]:border-b [&_h2]:border-primary/10 [&_h2]:pb-1
                        [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-foreground
                        [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-sm [&_li]:leading-relaxed
                        [&_ol]:pl-5 [&_ol]:space-y-1.5
                        [&_strong]:text-foreground [&_strong]:font-bold
                        [&_p]:mb-3 [&_p:last-child]:mb-0
                        [&_code]:bg-primary/10 [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono [&_code]:border [&_code]:border-primary/20
                        [&_pre]:bg-muted/40 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:my-4 [&_pre]:overflow-x-auto
                        [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse
                        [&_th]:bg-muted/50 [&_th]:p-2 [&_th]:text-left [&_th]:border [&_th]:border-border [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase
                        [&_td]:p-2 [&_td]:border [&_td]:border-border [&_td]:text-xs"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(msg.text),
                      }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wide mr-2">
                  VoxScholar AI
                </span>
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Suggested Starters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { label: "👋 Say Hi", text: "Hello! I just started reading this paper. Can you give me a quick welcome overview?" },
            { label: "📝 Summarize", text: "What are the top 3 most important findings of this research paper?" },
            { label: "🔍 Methodology", text: "Explain the methodology used in this paper in simple terms." },
            { label: "💡 Key Insights", text: "What are the unique contributions or novel ideas presented here?" },
          ].map((starter, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setInput(starter.text);
              }}
              className="px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-all shadow-sm"
            >
              {starter.label}
            </motion.button>
          ))}
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
            {loading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </motion.button>
        </div>
      </div>
    </DashboardLayout>
  );
}
