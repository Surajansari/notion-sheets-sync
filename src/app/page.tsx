"use client";

import React, { useState } from "react";
import { 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Layers,
  Lock
} from "lucide-react";

export default function WaitlistLandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
      } else {
        alert("Something went wrong. Please try again.");
        setStatus("idle");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting email.");
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <nav className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span>Sync<span className="text-indigo-400">Flow</span></span>
          </div>
          <a
            href="#waitlist"
            className="text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full transition shadow-md shadow-indigo-500/20"
          >
            Get Early Access
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Beta Access Open for First 100 Users</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          True 2-Way Sync for <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            Notion & Google Sheets
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Stop paying $49/mo for slow 2-hour delays or hitting 2,000 row limits. Get real-time 5-minute syncs and unlimited databases for a flat <strong className="text-white font-semibold">$15/mo</strong>.
        </p>

        {/* EMAIL CAPTURE FORM */}
        <div id="waitlist" className="mt-10 max-w-md mx-auto">
          {status === "success" ? (
            <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-sm flex items-center justify-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              <span>You're on the priority list! Check your inbox for confirmation.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="Enter your work email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 px-4 py-3.5 rounded-xl text-sm outline-none transition"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {status === "loading" ? "Joining..." : "Join Waitlist"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-slate-500 flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5" /> Lock in lifetime 30% discount at launch. No credit card required.
          </p>
        </div>
      </section>

      {/* COMPETITOR COMPARISON MATRIX */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Why Switch to SyncFlow?
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            See how we compare against standard integration tools on the market.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-4 px-6">Feature</th>
                <th className="py-4 px-6 text-slate-500">Sync2Sheets</th>
                <th className="py-4 px-6 text-slate-500">Addsync</th>
                <th className="py-4 px-6 text-indigo-400 font-bold bg-indigo-950/30">SyncFlow (Us)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-4 px-6 font-medium text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" /> Sync Speed
                </td>
                <td className="py-4 px-6 text-slate-400">2 Hours ($15/mo)</td>
                <td className="py-4 px-6 text-slate-400">60 Mins ($12/mo)</td>
                <td className="py-4 px-6 font-bold text-emerald-400 bg-indigo-950/20">5 Mins (Fastest)</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" /> Record Limits
                </td>
                <td className="py-4 px-6 text-slate-400">Unlimited</td>
                <td className="py-4 px-6 text-red-400 font-medium">Capped at 2,000</td>
                <td className="py-4 px-6 font-bold text-emerald-400 bg-indigo-950/20">Unlimited</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" /> Database Limit
                </td>
                <td className="py-4 px-6 text-slate-400">Max 3 ($15/mo)</td>
                <td className="py-4 px-6 text-slate-400">Max 10 ($12/mo)</td>
                <td className="py-4 px-6 font-bold text-emerald-400 bg-indigo-950/20">Unlimited Databases</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" /> Monthly Price
                </td>
                <td className="py-4 px-6 text-slate-400">$15 – $49 / mo</td>
                <td className="py-4 px-6 text-slate-400">$11.99 – $29.99 / mo</td>
                <td className="py-4 px-6 font-bold text-white bg-indigo-950/20">$15 / mo (Flat)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Up and Running in 60 Seconds
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            No complex Zapier triggers or missing data logs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-4">
              1
            </div>
            <h3 className="font-semibold text-white text-base">Connect Workspaces</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Authenticate your Google Sheets and Notion accounts securely with official 1-click OAuth.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-4">
              2
            </div>
            <h3 className="font-semibold text-white text-base">Match Your Columns</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Our simple UI automatically suggests mapping your Spreadsheet columns to Notion properties.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-4">
              3
            </div>
            <h3 className="font-semibold text-white text-base">Auto-Sync on Autopilot</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Edits in Sheets push to Notion, and updates in Notion push back to Sheets every 5 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600">
        <p>© 2026 SyncFlow. All rights reserved. Powered by Notion & Google Workspace APIs.</p>
      </footer>
    </div>
  );
}