"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [syncs, setSyncs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(14);
  const [notionConnected, setNotionConnected] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(true);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);

        let remaining = 14;
        if (user.created_at) {
          const createdAt = new Date(user.created_at).getTime();
          const now = new Date().getTime();
          const daysPassed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
          remaining = Math.max(1, 14 - daysPassed);
        }
        setTrialDaysLeft(remaining);

        const { data: syncConfigs, error } = await supabase
          .from("sync_configs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error) {
          setSyncs(syncConfigs || []);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, userId: user?.id }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout Error: " + (data.error || "Failed to contact payment gateway"));
      }
    } catch (err: any) {
      alert("Error: " + (err.message || "Could not complete request"));
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white">
      <div className="bg-[#0b1329] border-b border-slate-800/80 py-2.5 px-4 text-center text-xs text-slate-300 flex items-center justify-center gap-3">
        <span>🕒 Pro Trial Active: <strong className="text-white font-medium">{trialDaysLeft} days remaining</strong></span>
        <button onClick={handleUpgrade} className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition">
          Upgrade to Pro ($15/mo) →
        </button>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 bg-[#0b1329] border border-slate-800/80 px-4 py-2 rounded-2xl shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md">
              <span className="text-sm">🔄</span>
            </div>
            <span className="text-base font-bold tracking-tight text-white">SyncFlow</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleUpgrade} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
              <span>✨</span> Upgrade to Pro
            </button>
            <span className="text-sm text-slate-300 font-medium">{user?.email}</span>
            <button onClick={handleSignOut} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl text-xs font-semibold transition">
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Free Trial Mode ({trialDaysLeft} days left).</p>
          </div>
          <button onClick={() => router.push("/dashboard/syncs/new")} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition shadow-lg">
            + Create New Sync
          </button>
        </div>

        {/* Syncs Table */}
        <div className="bg-[#0b1329] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl p-6">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Active Sync Pipelines</h2>
          {loading ? (
            <p className="text-xs text-slate-400">Loading sync pipelines...</p>
          ) : syncs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 mb-3">No active sync pipelines found.</p>
              <button onClick={() => router.push("/dashboard/syncs/new")} className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-semibold">
                Create Your First Sync
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-4">Notion DB ID</th>
                  <th className="py-3 px-4">Google Sheet</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {syncs.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4 font-mono text-slate-300">{s.notion_database_id}</td>
                    <td className="py-3 px-4 text-indigo-400 truncate max-w-xs">{s.google_spreadsheet_url}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s.status || "active"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}