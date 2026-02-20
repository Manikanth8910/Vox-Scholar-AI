import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

import { useState, useEffect } from "react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function FlowchartPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [title, setTitle] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFlowchart = async () => {
      const paperId = localStorage.getItem("current_paper_id");
      if (!paperId) {
        toast({ title: "No Paper Found", description: "Please upload a paper first.", variant: "destructive" });
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/papers/${paperId}/flowchart`);
        setNodes(data.nodes);
        setTitle(data.paper_title);
      } catch (err: any) {
        toast({ title: "Error", description: err.response?.data?.detail || "Failed to load flowchart.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchFlowchart();
  }, [toast]);
  return (
    <DashboardLayout title="Flowchart View">
      <div className="max-w-2xl mx-auto py-4">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm">Research methodology flowchart</p>
        </motion.div>

        <div className="space-y-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            nodes.map((node, i) => (
              <motion.div
                key={node.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className={`rounded-2xl border-2 p-5 ${node.color || "border-primary/40 bg-primary/5"}`}>
                  <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${node.labelColor || "text-primary"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className={`font-display text-xl font-bold mb-2 ${node.labelColor || "text-primary"}`}>
                    {node.label}
                  </h3>
                  <p className="text-foreground text-sm leading-relaxed">{node.desc}</p>
                </div>
                {i < nodes.length - 1 && (
                  <div className="flex justify-center py-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-0.5 h-4 bg-border" />
                      <ArrowDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
