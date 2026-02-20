import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const uploadFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name.replace('.pdf', ''));

      const { data } = await api.post('/papers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // trigger processing right away
      await api.post(`/papers/${data.paper_id}/process`);

      toast({ title: 'Success', description: 'Paper uploaded fully!' });
      localStorage.setItem('current_paper_id', data.paper_id.toString());
      setTimeout(() => setShowModal(true), 500);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Upload failed', variant: 'destructive' });
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      uploadFile(dropped);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      uploadFile(selected);
    }
  };

  return (
    <DashboardLayout title="Upload Paper">
      <div className="max-w-2xl mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">
            Upload Your Research Paper
          </h2>
          <p className="text-muted-foreground">
            Drag and drop a PDF to get started. VoxScholar AI will process it instantly.
          </p>
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-3xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300 ${dragging
              ? "border-primary bg-primary/5 shadow-glow scale-[1.02]"
              : file
                ? "border-green-400/50 bg-green-400/5"
                : "border-border hover:border-primary/50 hover:bg-primary/3 bg-card"
            }`}
        >
          <input
            type="file"
            accept=".pdf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileInput}
          />

          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <CheckCircle className="w-16 h-16 text-green-400" />
                <div className="font-semibold text-foreground text-lg">{file.name}</div>
                <div className="text-muted-foreground text-sm">
                  {(file.size / 1024 / 1024).toFixed(2)} MB — {uploading ? "Processing using AI..." : "Ready"}
                </div>
                <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                  <motion.div
                    className="h-full bg-gradient-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-9 h-9 text-primary" />
                </div>
                <div>
                  <div className="font-display text-xl font-semibold text-foreground mb-1">
                    Drop your PDF here
                  </div>
                  <div className="text-muted-foreground">or click to browse files</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  PDF files only — up to 50MB
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tips */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {["Instant processing", "AI-powered insights", "Secure & private"].map((tip) => (
            <div key={tip} className="p-3 rounded-xl bg-muted/50 text-center">
              <CheckCircle className="w-4 h-4 text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                  Have you read this topic before?
                </h3>
                <p className="text-muted-foreground text-sm">
                  This helps VoxScholar AI tailor the experience to your knowledge level.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => { setShowModal(false); navigate("/podcast"); }}
                  className="w-full btn-primary py-3.5 text-base"
                >
                  Yes – I have already
                </button>
                <button
                  onClick={() => { setShowModal(false); navigate("/podcast"); }}
                  className="w-full py-3.5 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-all text-base"
                >
                  No – Show Summary First
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
