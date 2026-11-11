"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response format.");
      }

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Successfully joined waitlist! Check your inbox.");
        setEmail("");
      } else {
        setIsError(true);
        setMessage(data.error || "Failed to join waitlist. Please try again.");
      }
    } catch (err: any) {
      console.error("Waitlist submission error:", err);
      setIsError(true);
      setMessage(err.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-6">
        {/* Logo Badge */}
        <div className="inline-flex items-center gap-3 bg-[#0b1329] border border-slate-800 px-4 py-2 rounded-2xl shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <span>🔄</span>
          </div>
          <span className="text-base font-bold tracking-tight text-white">SyncFlow</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          True 2-Way Sync for <br />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Notion & Google Sheets
          </span>
        </h1>

        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Stop paying $49/mo for slow delays or strict row limits. Get real-time 5-minute syncs and unlimited databases for a flat $15/mo.
        </p>

        {/* Waitlist Form */}
        <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-[#0b1329] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join →"}
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs border ${
                isError
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}
            >
              {message}
            </div>
          )}
        </form>

        <div className="pt-8">
          <a
            href="/login"
            className="text-xs text-slate-400 hover:text-indigo-400 underline transition"
          >
            Already have an account? Sign In →
          </a>
        </div>
      </div>
    </div>
  );
}