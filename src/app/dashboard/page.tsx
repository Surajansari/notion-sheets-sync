"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [syncs, setSyncs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        const { data: syncConfigs, error } = await supabase
          .from("sync_configs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching syncs:", error);
        } else {
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

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-lg">⚡</span> SyncFlow
          </h1>
          <p className="text-xs text-slate-400 mt-1">Free Trial Mode (Active)</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Integrations Status</h2>
          <button
            onClick={() => router.push("/dashboard/syncs/new")}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
          >
            + Create New Sync
          </button>
        </div>

        {/* Integration Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-base font-bold mb-1">Notion</h3>
            <p className="text-xs text-slate-400 mb-4">Connected Workspace</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
              ✓ Connected
            </span>
          </div>

          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-base font-bold mb-1">Google Workspace</h3>
            <p className="text-xs text-slate-400 mb-4">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
              ✓ Connected
            </span>
          </div>
        </div>

        {/* Active Syncs List */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Your Active Syncs</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading syncs...</p>
          ) : syncs.length === 0 ? (
            <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-400 mb-4">No active syncs found yet.</p>
              <button
                onClick={() => router.push("/dashboard/syncs/new")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold transition"
              >
                Create Your First Sync
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {syncs.map((sync) => (
                <div
                  key={sync.id}
                  className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div>
                    <h3 className="text-base font-bold text-white">{sync.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-md">
                      Google Sheet: {sync.google_spreadsheet_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-medium uppercase tracking-wider">
                      {sync.status || "active"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}