"use client";

import Link from "next/link";
import { Users, Sparkles, Shield, ArrowRight } from "lucide-react";

export default function AdminHubPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-6 selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 p-8 rounded-2xl backdrop-blur-md shadow-2xl relative z-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-white">SyncFlow Admin Command</h1>
        </div>
        <p className="text-xs text-slate-400 text-center mb-8">
          Select an admin utility below to manage your beta waitlist or test your automated email conversion funnel.
        </p>

        <div className="space-y-4">
          <Link
            href="/admin/waitlist"
            className="flex items-center justify-between p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">Waitlist & User Management</h3>
                <p className="text-xs text-slate-400">View signups, send beta invites, and delete records.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
          </Link>

          <Link
            href="/admin/test-funnel"
            className="flex items-center justify-between p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">Funnel Testing Hub</h3>
                <p className="text-xs text-slate-400">Trigger and test all 5 lifecycle email stages instantly.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}