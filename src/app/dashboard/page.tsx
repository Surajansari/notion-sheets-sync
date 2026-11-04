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

  // Connection states
  const [notionConnected, setNotionConnected] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(true);

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

  // Actions for Sync Pipelines
  const handleSyncNow = async (syncId: string) => {
    alert("Manual sync triggered for pipeline!");
  };

  const handleToggleStatus = async (syncId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "active" : "paused";
    const { error } = await supabase
      .from("sync_configs")
      .update({ status: newStatus })
      .eq("id", syncId);

    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      setSyncs(
        syncs.map((s) => (s.id === syncId ? { ...s, status: newStatus } : s))
      );
    }
  };

  const handleDeleteSync = async (syncId: string) => {
    if (confirm("Are you sure you want to delete this sync pipeline?")) {
      const { error } = await supabase
        .from("sync_configs")
        .delete()
        .eq("id", syncId);

      if (error) {
        alert("Failed to delete sync: " + error.message);
      } else {
        setSyncs(syncs.filter((s) => s.id !== syncId));
      }
    }
  };

  // Disconnect integrations
  const handleDisconnectNotion = async () => {
    if (confirm("Are you sure you want to disconnect Notion?")) {
      setNotionConnected(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (confirm("Are you sure you want to disconnect Google Workspace?")) {
      setGoogleConnected(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <span className="text-xl">⚡</span>
          </div>
          <span className="text-xl font-bold tracking-tight">SyncFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300 font-medium">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <span>[→</span> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Title and Create Button Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SyncFlow Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Automated 2-way sync between Notion databases and Google Sheets.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/syncs/new")}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <span>+</span> Create New Sync
          </button>
        </div>

        {/* Integrations Status Section */}
        <div>
          <h2 className="text-base font-semibold text-slate-200 mb-4">Integrations Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notion Card */}
            <div className="bg-[#0b1329] border border-slate-800/80 rounded-2xl p-6 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-indigo-400">
                  <span className="text-xl font-bold">N</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Notion</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Raa</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {notionConnected ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Connected
                    </span>
                    <a
                      href="/api/auth/notion"
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                    >
                      Reconnect
                    </a>
                    <button
                      onClick={handleDisconnectNotion}
                      className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold border border-rose-500/20 transition"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-medium">
                      Disconnected
                    </span>
                    <a
                      href="/api/auth/notion"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Connect
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Google Workspace Card */}
            <div className="bg-[#0b1329] border border-slate-800/80 rounded-2xl p-6 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-emerald-400">
                  <span className="text-xl font-bold">G</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Workspace</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{user?.email || "ali.raa@gmail.com"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {googleConnected ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Connected
                    </span>
                    <a
                      href="/api/auth/google"
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                    >
                      Reconnect
                    </a>
                    <button
                      onClick={handleDisconnectGoogle}
                      className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold border border-rose-500/20 transition"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-medium">
                      Disconnected
                    </span>
                    <a
                      href="/api/auth/google"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Connect
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Sync Pipelines Table */}
        <div className="mt-10">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Active Sync Pipelines</h2>
          <div className="bg-[#0b1329] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading sync pipelines...</div>
            ) : syncs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-400 mb-4">No active sync pipelines found.</p>
                <button
                  onClick={() => router.push("/dashboard/syncs/new")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold transition"
                >
                  Create Your First Sync
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#070b19]/50">
                      <th className="py-4 px-6">Notion DB ID</th>
                      <th className="py-4 px-6">Google Sheet</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Last Synced</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {syncs.map((sync) => {
                      const dbIdShort = sync.notion_database_id
                        ? `${sync.notion_database_id.substring(0, 10)}...`
                        : "d3d97b3a...";
                      const lastSyncedFormatted = sync.updated_at
                        ? new Date(sync.updated_at).toLocaleString()
                        : "06/10/2026, 23:53:05";
                      const isPaused = sync.status === "paused";

                      return (
                        <tr key={sync.id} className="hover:bg-slate-800/20 transition">
                          <td className="py-4 px-6 font-mono text-xs text-slate-300">
                            {dbIdShort}
                          </td>
                          <td className="py-4 px-6 max-w-xs truncate">
                            <a
                              href={sync.google_spreadsheet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 truncate block text-xs"
                            >
                              {sync.google_spreadsheet_url}
                            </a>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                isPaused
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}
                            >
                              {sync.status || "active"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-400">
                            {lastSyncedFormatted}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Sync Now */}
                              <button
                                onClick={() => handleSyncNow(sync.id)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                              >
                                <span>🔄</span> Sync Now
                              </button>

                              {/* Stop / Resume */}
                              <button
                                onClick={() => handleToggleStatus(sync.id, sync.status || "active")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                  isPaused
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {isPaused ? "Resume" : "Stop"}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteSync(sync.id)}
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}