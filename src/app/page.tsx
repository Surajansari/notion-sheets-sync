"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to join waitlist.");

      setFeedback({ text: data.message, type: "success" });
      setEmail("");
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-white selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">SyncFlow</span>
        </div>
        <a
          href="#waitlist"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-5 py-2.5 rounded-full transition"
        >
          Get Early Access
        </a>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          Beta Access Open for First 100 Users
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6">
          True 2-Way Sync for <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Notion & Google Sheets
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop paying \$49/mo for slow 2-hour delays or hitting 2,000 row limits.
          Get real-time 5-minute syncs and unlimited databases for a flat{" "}
          <strong className="text-white font-semibold">\$15/mo</strong>.
        </p>

        {/* Embedded Interactive Waitlist Form */}
        <div id="waitlist" className="w-full max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email..."
              required
              className="flex-1 bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Joining..." : "Join Waitlist →"}
            </button>
          </form>

          {feedback && (
            <p className={`mt-3 text-sm text-center ${feedback.type === "error" ? "text-red-400" : "text-green-400"}`}>
              {feedback.text}
            </p>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-4 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Lock in lifetime 30% discount at launch. No credit card required.
        </p>
      </section>

      {/* How it Works Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-800/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Up and Running in 60 Seconds
          </h2>
          <p className="text-slate-400 text-sm">
            No complex Zapier triggers or missing data logs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm mb-4">
              1
            </div>
            <h3 className="font-semibold text-lg mb-2">Connect Workspaces</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Authenticate your Google Sheets and Notion accounts securely with official 1-click OAuth.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm mb-4">
              2
            </div>
            <h3 className="font-semibold text-lg mb-2">Match Your Columns</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our simple UI automatically suggests mapping your Spreadsheet columns to Notion properties.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm mb-4">
              3
            </div>
            <h3 className="font-semibold text-lg mb-2">Auto-Sync on Autopilot</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Edits in Sheets push to Notion, and updates in Notion push back to Sheets every 5 minutes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}