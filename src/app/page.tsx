"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("You're on the waitlist! We'll email you your invite soon. 🎉");
        setEmail("");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit waitlist form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Logo Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b1329] border border-slate-800 rounded-2xl shadow-xl">
          <span className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold shadow-md">⚡</span>
          <span className="text-sm font-semibold tracking-tight">SyncFlow</span>
        </div>

        {/* Hero Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            True 2-Way Sync for <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-200 bg-clip-text text-transparent">
              Notion & Google Sheets
            </span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Stop paying $49/mo for slow delays or strict row limits. Get real-time 5-minute syncs and unlimited databases for a flat $15/mo.
          </p>
        </div>

        {/* Waitlist Capture Form */}
        <form onSubmit={handleWaitlistSubmit} className="bg-[#0b1329] border border-slate-800 p-3 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="Enter your work email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-[#070b19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-lg"
          >
            {loading ? "Joining..." : "Join →"}
          </button>
        </form>

        {error && <p className="text-xs text-rose-400">{error}</p>}
        {message && <p className="text-xs text-emerald-400">{message}</p>}

        {/* Sign In Navigation Link */}
        <p className="text-xs text-slate-400 pt-6">
          Already have an account? <a href="/signin" className="text-indigo-400 hover:underline font-medium">Sign In →</a>
        </p>

      </div>
    </div>
  );
}