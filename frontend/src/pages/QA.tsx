import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Send, Volume2, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "http://localhost:8000/api";

export default function QAPage() {
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paperId, setPaperId] = useState<number | null>(null);
  const [paperData, setPaperData] = useState<any>(null);

  useEffect(() => {
    const currentPaperId = localStorage.getItem('currentPaperId');
    const token = localStorage.getItem('token');

    if (currentPaperId && token) {
      const id = parseInt(currentPaperId);
      setPaperId(id);

      // Fetch paper details
      fetch(`${API_URL}/papers/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setPaperData(data))
        .catch(err => console.error("Failed to fetch paper:", err));

      // Fetch chat history
      fetch(`${API_URL}/chat/history/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.messages && data.messages.length > 0) {
            const history = data.messages.map((m: any) => ({
              role: m.role === "assistant" ? "ai" : "user",
              text: m.content
            }));
            setMessages(history);
          } else {
            setMessages([{
              role: "ai",
              text: "Hello! I've analyzed your paper. What specific insights or sections would you like me to explain?"
            }]);
          }
        })
        .catch(err => {
          console.error("History fetch error:", err);
          setMessages([{
            role: "ai",
            text: "Hello! I've analyzed your paper. What specific insights or sections would you like me to explain?"
          }]);
        });
    } else {
      setPaperId(1);
      setMessages([{
        role: "ai",
        text: "Hello! I've analyzed your paper. What specific insights or sections would you like me to explain?"
      }]);
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
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
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
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === "user"
                    ? "bg-gradient-primary text-white rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                    }`}
                >
                  {msg.role === "ai" && (
                    <div className="flex items-center justify-between mb-2 border-b border-border pb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-tighter">
                        VoxScholar Expert Analysis
                      </span>
                      <div className="flex gap-2">
                        <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={`${msg.role === "ai" ? "prose prose-sm dark:prose-invert max-w-none text-foreground" : "text-white"} whitespace-pre-wrap text-sm leading-relaxed`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
