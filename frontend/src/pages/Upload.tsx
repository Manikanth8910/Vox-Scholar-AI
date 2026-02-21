import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6279/api";

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const uploadAndProcess = async (selectedFile: File) => {
    setFile(selectedFile);
    setError("");
    setLoading(true);
    setProgress(10);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in to upload papers.");

      // 1. Upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", selectedFile.name.replace(".pdf", ""));

      setProgress(25);
      const uploadResponse = await fetch(
        `${API_URL}/papers/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.detail || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      const paperId = uploadData.paper_id;
      localStorage.setItem("currentPaperId", paperId.toString());

      setProgress(50);
      setProcessing(true);

      // 2. Start Process (Background)
      const processResponse = await fetch(
        `${API_URL}/papers/${paperId}/process`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!processResponse.ok) {
        const data = await processResponse.json();
        throw new Error(data.detail || "Processing failed to start");
      }

      // 3. Poll for Status
      let isCompleted = false;
      let attempts = 0;
      const maxAttempts = 300; // 10 minutes total (2s * 300)

      while (!isCompleted && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `${API_URL}/papers/${paperId}/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setProgress(50 + statusData.progress / 2); // Scale 0-100 to 50-100

          if (statusData.status === "completed") {
            isCompleted = true;
            setProgress(100);
            setTimeout(() => setShowModal(true), 500);
          } else if (statusData.status === "failed") {
            throw new Error(statusData.message || "Processing failed");
          }
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error(
          "Processing timed out. Please check your Research Memory later.",
        );
      }
    } catch (err: any) {
      setError(err.message);
      setFile(null);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      uploadAndProcess(dropped);
    } else {
      setError("Please upload a PDF file.");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      uploadAndProcess(selected);
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
            Drag and drop a PDF to get started. VoxScholar AI will process it
            instantly.
          </p>
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-3xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300 ${dragging
            ? "border-primary bg-primary/5 shadow-glow scale-[1.02]"
            : file
              ? progress === 100
                ? "border-green-400/50 bg-green-400/5"
                : "border-border/50 bg-muted/20"
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
                {progress === 100 ? (
                  <CheckCircle className="w-16 h-16 text-green-400" />
                ) : (
                  <Loader2 className="w-16 h-16 text-muted-foreground animate-spin" />
                )}
                <div className="font-semibold text-foreground text-lg">
                  {file.name}
                </div>
                <div className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">
                  {progress === 100 ? "Processing Complete" : processing ? "Processing Paper..." : "Uploading..."}
                </div>
                <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                  <motion.div
                    className="h-full bg-gradient-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {progress}%
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
                  <div className="text-muted-foreground">
                    or click to browse files
                  </div>
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
          {[
            "Instant processing",
            "AI-powered insights",
            "Secure & private",
          ].map((tip) => (
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
                  This helps VoxScholar AI tailor the experience to your
                  knowledge level.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate("/podcast");
                  }}
                  className="w-full btn-primary py-3.5 text-base"
                >
                  Yes – I have already
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate("/podcast");
                  }}
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
