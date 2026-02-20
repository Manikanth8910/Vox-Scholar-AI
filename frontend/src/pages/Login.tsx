import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6279/api";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Headphones, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userEmail", email);

      // Also get user info to set name/avatar
      const userResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        localStorage.setItem(
          "userName",
          userData.full_name || userData.username,
        );
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Google login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);

      const decoded: any = jwtDecode(credentialResponse.credential);
      if (decoded.email) localStorage.setItem("userEmail", decoded.email);
      if (decoded.name) localStorage.setItem("userName", decoded.name);

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-white/60">
            Sign in to continue your research journey
          </p>
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
                <label className="text-white/80 text-sm font-medium">
                  Password
                </label>
                <a
                  href="#"
                  className="text-primary text-sm hover:text-indigo-light transition-colors"
                >
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
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-base py-3 mt-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google */}
            <div className="w-full flex items-center justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google authentication failed");
                }}
                shape="rectangular"
                theme="filled_black"
                text="continue_with"
                width="100%"
              />
            </div>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary hover:text-indigo-light font-medium transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
