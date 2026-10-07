"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams, useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [notionConnected, setNotionConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncs, setSyncs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");
  const error = searchParams.get("error");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // 1. Fetch connected OAuth providers
        const { data: connections } = await supabase
          .from("oauth_connections")
          .select("provider")
          .eq("user_id", user.id);

        if (connections) {
          const providers = connections.map((item) => item.provider);
          setNotionConnected(providers.includes("notion"));
          setGoogleConnected(providers.includes("google"));
        }

        // 2. Fetch created sync configurations
        const { data: syncConfigs } = await supabase
          .from("sync_configs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (syncConfigs) {
          setSyncs(syncConfigs);
        }
      }
      setLoading(false);
    }

    loadUserData();
  }, [status]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleNotionConnect = () => {
    if (!user?.id) return alert("User session not found. Please log in again.");
    window.location.href = `/api/auth/notion?user_id=${user.id}`;
  };

  const handleGoogleConnect = () => {
    if (!user?.id) return alert("User session not found. Please log in again.");
    window.location.href = `/api/auth/google?user_id=${user.id}`;
  };

  const handleDeleteSync = async (syncId: string) => {
    if (!confirm("Are you sure you want to delete this sync configuration?")) return;

    const { error } = await supabase.from("sync_configs").delete().eq("id", syncId);
    if (!error) {
      setSyncs(syncs.filter((s) => s.id !== syncId));
    } else {
      alert("Error deleting sync: " + error.message);
    }
  };

  const handleSyncNow = async (syncId: string) => {
    setSyncingId(syncId);
    try {
      const res = await fetch("/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncId }),
      });

      const data = await res.json();
      if (res.ok) {
        setSyncs(
          syncs.map((s) =>
            s.id === syncId ? { ...s, last_synced_at: data.last_synced_at } : s
          )
        );
      } else {
        alert("Sync failed: " + data.error);
      }
    } catch (err) {
      console.error("Sync trigger error:", err);
      alert("Failed to trigger sync. Please try again.");
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="px-8 py-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Sync<span className="text-indigo-400">Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">{user?.email || "ali.raa@gmail.com"}</span>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 transition text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-10">
        {error && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-sm">
            Connection Error: {decodeURIComponent(error)}
          </div>
        )}

        {/* Title Section */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Active Syncs</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage real-time 5-minute syncs between Notion and Google Sheets.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/new-sync")}
            disabled={!notionConnected || !googleConnected}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              notionConnected && googleConnected
                ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-600/20"
                : "bg-indigo-600/40 text-indigo-200/50 cursor-not-allowed"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Sync
          </button>
        </div>

        {/* Workspace Connection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Notion Card */}
          <div className="p-6 bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.213-.7c.327-.023.514-.256.514-.583 0-.396-.327-.676-.816-.63l-12.286.77c-.513.023-.746.21-.862.466l-.19.211zm1.26 3.125l.023 12.355c.023.723.35 1.119 1.142 1.072l12.449-.77c.723-.046 1.002-.489 1.002-1.142V6.633c0-.653-.256-.98-1.002-.933L6.86 6.398c-.792.047-1.119.397-1.141.935zm3.17.91l7.857-.467c.28 0 .42.14.42.373 0 .187-.093.303-.326.326l-7.391.42c-.28.023-.42-.117-.42-.35 0-.187.093-.303.326-.303h-.466zm-.023 2.801l7.857-.466c.28 0 .42.14.42.373 0 .187-.093.303-.326.326l-7.391.42c-.28.023-.42-.117-.42-.35 0-.187.093-.303.326-.303h-.466zm0 2.801l7.857-.466c.28 0 .42.14.42.373 0 .187-.093.303-.326.326l-7.391.42c-.28.023-.42-.117-.42-.35 0-.187.093-.303.326-.303h-.466z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Notion Workspace</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {notionConnected ? "Connected" : "Not Connected"}
                </p>
              </div>
            </div>

            {notionConnected ? (
              <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full">
                Connected
              </span>
            ) : (
              <button
                onClick={handleNotionConnect}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline px-2 py-1 cursor-pointer"
              >
                Connect
              </button>
            )}
          </div>

          {/* Google Card */}
          <div className="p-6 bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Google Workspace</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {googleConnected ? "Connected" : "Not Connected"}
                </p>
              </div>
            </div>

            {googleConnected ? (
              <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full">
                Connected
              </span>
            ) : (
              <button
                onClick={handleGoogleConnect}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline px-2 py-1 cursor-pointer"
              >
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Active Syncs List or Empty State */}
        {syncs.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Configured Sync Pipelines ({syncs.length})
            </h2>
            {syncs.map((sync) => (
              <div
                key={sync.id}
                className="p-6 bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-white">{sync.name}</h3>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider rounded-full">
                      {sync.status || "Active"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                    <span>
                      Notion Database:{" "}
                      <strong className="text-slate-300">
                        {sync.notion_database_id}
                      </strong>
                    </span>
                    <span>•</span>
                    <a
                      href={sync.google_spreadsheet_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline truncate max-w-xs"
                    >
                      Open Google Sheet ↗
                    </a>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleSyncNow(sync.id)}
                    disabled={syncingId === sync.id}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white text-xs font-medium rounded-lg transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {syncingId === sync.id ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Syncing...
                      </>
                    ) : (
                      "Sync Now"
                    )}
                  </button>

                  <span className="text-xs text-slate-500 min-w-[140px] text-right">
                    {sync.last_synced_at
                      ? `Last synced: ${new Date(sync.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : "Pending initial run"}
                  </span>

                  <button
                    onClick={() => handleDeleteSync(sync.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition cursor-pointer"
                    title="Delete sync"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-800/80 rounded-3xl p-16 flex flex-col items-center justify-center text-center bg-[#0a0f24]/40">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No active syncs found</h3>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Connect your Notion database and Google Sheet to start automated 2-way syncing.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}