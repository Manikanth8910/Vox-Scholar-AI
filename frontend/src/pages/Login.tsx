import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Headphones, Eye, EyeOff, Mail, Lock } from "lucide-react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.access_token);
      localStorage.removeItem('current_paper_id'); // Clear stale paper on fresh login
      toast({ title: "Success", description: "Logged in successfully" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/google', { credential: credentialResponse.credential });
      localStorage.setItem('token', data.access_token);
      localStorage.removeItem('current_paper_id');
      toast({ title: "Success", description: "Logged in via Google" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Google Login failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-white">
              VoxScholar <span className="text-gold">AI</span>
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/60">Sign in to continue your research journey</p>
        </div>

        {/* Card */}
        <div className="glass-dark rounded-3xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@university.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary/60 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white/80 text-sm font-medium">Password</label>
                <a href="#" className="text-primary text-sm hover:text-indigo-light transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary text-base py-3 mt-2"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

            {/* Divider + Google — only shown when client ID is configured */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/40 text-sm">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Google Login Component */}
                <div className="flex justify-center w-full mt-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      toast({
                        title: "Error",
                        description: "Google Login failed",
                        variant: "destructive"
                      });
                    }}
                    theme="filled_black"
                    shape="rectangular"
                    width="100%"
                    text="continue_with"
                  />
                </div>
              </>
            )}
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:text-indigo-light font-medium transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
