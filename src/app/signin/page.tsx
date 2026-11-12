"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address above first to reset your password.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      setMessage("Password recovery email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send password recovery email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex items-center justify-center p-6">
      <form onSubmit={handleSignin} className="bg-[#0b1329] border border-slate-800 p-8 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-xs text-slate-400">Sign in to manage your active 2-way syncs</p>

        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">{error}</div>}
        {message && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs">{message}</div>}

        <div>
          <label className="block text-xs text-slate-400 mb-1">EMAIL ADDRESS</label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#070b19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-slate-400">PASSWORD</label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-indigo-400 hover:underline focus:outline-none"
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#070b19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Sign In →"}
        </button>

        <p className="text-center text-xs text-slate-400 pt-2">
          Don't have an account? <a href="/signup" className="text-indigo-400 hover:underline">Sign Up</a>
        </p>
      </form>
    </div>
  );
}