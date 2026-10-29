"use client";

import { useState } from "react";
import { Play, Mail, CheckCircle, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function TestFunnelPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const triggerStage = async (stage: string) => {
    if (!email) {
      alert("Please enter a test email address first.");
      return;
    }
    setLoadingStage(stage);
    setMessage("");

    try {
      const res = await fetch('/api/admin/test-funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, stage, firstName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`✅ Success! ${stage.toUpperCase()} email dispatched to ${email}. Check your inbox!`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoadingStage(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SyncFlow Funnel Testing Hub</h1>
            <p className="text-xs text-slate-400">Trigger and verify every stage of your user lifecycle & email drip sequence on demand.</p>
          </div>
        </div>

        {/* Input Configuration */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-md mb-8 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" /> Target Test Recipient
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Test Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">First Name (Optional)</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Sync-Pioneer"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm outline-none transition"
              />
            </div>
          </div>
          {message && (
            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-indigo-300">
              {message}
            </div>
          )}
        </div>

        {/* Funnel Stages Cards */}
        <h2 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Funnel Lifecycle Stages</h2>
        <div className="space-y-4">
          
          {/* Stage 1 */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Stage 1</span>
              <h3 className="text-sm font-bold text-white mt-1">Waitlist Confirmation Email</h3>
              <p className="text-xs text-slate-400">Triggered immediately when a user joins the waitlist on the landing page.</p>
            </div>
            <button
              onClick={() => triggerStage('waitlist')}
              disabled={loadingStage === 'waitlist'}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> {loadingStage === 'waitlist' ? 'Sending...' : 'Test Waitlist Email'}
            </button>
          </div>

          {/* Stage 2 */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Stage 2</span>
              <h3 className="text-sm font-bold text-white mt-1">Beta Invitation Email</h3>
              <p className="text-xs text-slate-400">Sent when you approve a user from the admin waitlist hub with their secure invite link.</p>
            </div>
            <button
              onClick={() => triggerStage('invite')}
              disabled={loadingStage === 'invite'}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> {loadingStage === 'invite' ? 'Sending...' : 'Test Beta Invite'}
            </button>
          </div>

          {/* Stage 3 */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Stage 3</span>
              <h3 className="text-sm font-bold text-white mt-1">Trial Welcome Email (14-Day Pro)</h3>
              <p className="text-xs text-slate-400">Dispatched right after the user successfully registers and activates their account.</p>
            </div>
            <button
              onClick={() => triggerStage('trial')}
              disabled={loadingStage === 'trial'}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> {loadingStage === 'trial' ? 'Sending...' : 'Test Trial Welcome'}
            </button>
          </div>

          {/* Stage 4 */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Stage 4</span>
              <h3 className="text-sm font-bold text-white mt-1">Trial Expiry Reminder (Day 13)</h3>
              <p className="text-xs text-slate-400">Automated warning email sent 24 hours before their trial concludes to drive upgrades.</p>
            </div>
            <button
              onClick={() => triggerStage('reminder')}
              disabled={loadingStage === 'reminder'}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> {loadingStage === 'reminder' ? 'Sending...' : 'Test Expiry Reminder'}
            </button>
          </div>

          {/* Stage 5 */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Stage 5</span>
              <h3 className="text-sm font-bold text-white mt-1">Pro Conversion Welcome Email</h3>
              <p className="text-xs text-slate-400">Triggered automatically via Stripe webhook when the user completes payment.</p>
            </div>
            <button
              onClick={() => triggerStage('pro')}
              disabled={loadingStage === 'pro'}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> {loadingStage === 'pro' ? 'Sending...' : 'Test Pro Welcome'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}