import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Headphones, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin } from '@react-oauth/google';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/google', { credential: credentialResponse.credential });
      localStorage.setItem('token', data.access_token);
      localStorage.removeItem('current_paper_id');
      toast({ title: "Success", description: "Signed up via Google" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Google Signup failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        full_name: form.name,
        username: form.email.split('@')[0]
      });
      toast({ title: "Success", description: "Account created! Please log in." });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-white">
              VoxScholar <span className="text-gold">AI</span>
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-white/60">Join thousands of researchers worldwide</p>
        </div>

        <div className="glass-dark rounded-3xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Dr. Jane Smith"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="researcher@university.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={form.confirm}
                  onChange={update("confirm")}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
            </div>

            <button disabled={isLoading} type="submit" className="w-full btn-primary text-base py-3 mt-2">
              {isLoading ? "Creating..." : "Create Account"}
            </button>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/40 text-sm">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="flex justify-center w-full mt-2">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      toast({
                        title: "Error",
                        description: "Google Signup failed",
                        variant: "destructive"
                      });
                    }}
                    theme="filled_black"
                    shape="rectangular"
                    width="100%"
                    text="signup_with"
                  />
                </div>
              </>
            )}
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-indigo-light font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
