"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  LogOut, 
  Database, 
  FileSpreadsheet,
  Zap,
  AlertCircle,
  ExternalLink
} from "lucide-react";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncs, setSyncs] = useState<any[]>([]);
  const [notionConn, setNotionConn] = useState<any>(null);
  const [googleConn, setGoogleConn] = useState<any>(null);
  
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const statusParam = searchParams.get("status");

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data: connections } = await supabase
        .from("oauth_connections")
        .select("*")
        .eq("user_id", session.user.id);

      if (connections) {
        setNotionConn(connections.find((c) => c.provider === "notion"));
        setGoogleConn(connections.find((c) => c.provider === "google"));
      }

      const { data: syncData } = await supabase
        .from("sync_configs")
        .select("*")
        .eq("user_id", session.user.id);

      if (syncData) setSyncs(syncData);
      setLoading(false);
    }

    loadDashboardData();
  }, [router, statusParam]);

  const handleSyncNow = async (syncId: string) => {
    setSyncingId(syncId);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Sync execution failed");
      } else {
        const { data: updatedSyncs } = await supabase
          .from("sync_configs")
          .select("*")
          .eq("user_id", user.id);

        if (updatedSyncs) setSyncs(updatedSyncs);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to trigger sync");
    } finally {
      setSyncingId(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleNotionConnect = () => {
    if (!user?.id) return;
    window.location.href = `/api/auth/notion?user_id=${user.id}`;
  };

  const handleGoogleConnect = () => {
    if (!user?.id) return;
    window.location.href = `/api/auth/google?user_id=${user.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span>Sync<span className="text-indigo-400">Flow</span></span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:inline-block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Error Notification Banner */}
        {(errorMessage || errorParam) && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage || decodeURIComponent(errorParam!)}</span>
            </div>
            <button
              onClick={() => {
                setErrorMessage(null);
                router.replace("/dashboard");
              }}
              className="text-xs text-red-400 hover:text-red-200 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">SyncFlow Dashboard</h1>
            <p className="text-slate-400 text-xs mt-1">
              Automated 2-way sync between Notion databases and Google Sheets.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/new-sync")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 w-fit"
          >
            <Plus className="w-4 h-4" />
            Create New Sync
          </button>
        </div>

        {/* Integrations Status Section */}
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Integrations Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* Notion Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Notion</h3>
                <p className="text-xs text-slate-500">
                  {notionConn ? (notionConn.workspace_name || "Connected") : "Not Connected"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {notionConn && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              )}
              <button
                onClick={handleNotionConnect}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                {notionConn ? "Reconnect" : "Connect"}
              </button>
            </div>
          </div>

          {/* Google Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Google Workspace</h3>
                <p className="text-xs text-slate-500">
                  {googleConn ? (googleConn.workspace_name || "Connected") : "Not Connected"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {googleConn && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              )}
              <button
                onClick={handleGoogleConnect}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                {googleConn ? "Reconnect" : "Connect"}
              </button>
            </div>
          </div>
        </div>

        {/* Active Sync Pipelines Table */}
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Active Sync Pipelines</h2>
        {syncs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
            <Zap className="w-8 h-8 text-indigo-400 mx-auto mb-3 opacity-60" />
            <h3 className="font-semibold text-base text-white">No active syncs found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create a new sync pipeline to automate 2-way data flow between Notion and Google Sheets.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-medium">
                <tr>
                  <th className="px-6 py-4">Notion DB ID</th>
                  <th className="px-6 py-4">Google Sheet</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Synced</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {syncs.map((sync) => (
                  <tr key={sync.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {sync.notion_database_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <a
                        href={sync.google_spreadsheet_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1 truncate"
                      >
                        {sync.google_spreadsheet_url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {sync.status || "active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {sync.last_synced_at
                        ? new Date(sync.last_synced_at).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSyncNow(sync.id)}
                        disabled={syncingId === sync.id}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingId === sync.id ? "animate-spin" : ""}`} />
                        {syncingId === sync.id ? "Syncing..." : "Sync Now"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}