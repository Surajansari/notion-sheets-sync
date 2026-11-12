"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notionConnected, setNotionConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncs, setSyncs] = useState<any[]>([]);
  const router = useRouter();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function getUserAndData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Fetch integration states & syncs from Supabase or localStorage fallback
      const savedNotion = localStorage.getItem(`syncflow_notion_${session.user.id}`) === "true";
      const savedGoogle = localStorage.getItem(`syncflow_google_${session.user.id}`) === "true";
      setNotionConnected(savedNotion);
      setGoogleConnected(savedGoogle);

      // Fetch sync pipelines
      const { data: syncData } = await supabase
        .from("sync_configs")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setSyncs(syncData || []);
      setLoading(false);
    }

    getUserAndData();
  }, [router, supabase]);

  const toggleIntegration = (type: "notion" | "google") => {
    if (!user) return;
    if (type === "notion") {
      const newState = !notionConnected;
      setNotionConnected(newState);
      localStorage.setItem(`syncflow_notion_${user.id}`, String(newState));
    } else {
      const newState = !googleConnected;
      setGoogleConnected(newState);
      localStorage.setItem(`syncflow_google_${user.id}`, String(newState));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] text-white flex items-center justify-center text-sm">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Navbar */}
        <div className="flex justify-between items-center bg-[#0b1329] border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">⚡</div>
            <span className="text-xl font-bold tracking-tight">SyncFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-300 font-mono">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Dashboard Title & Trial Banner */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold">SyncFlow Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Automated 2-way sync between Notion databases and Google Sheets.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/new-sync")}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-2"
          >
            + Create New Sync
          </button>
        </div>

        {/* Integrations Status Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Integrations Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Notion Card */}
            <div className="bg-[#0b1329] border border-slate-800 p-6 rounded-2xl flex justify-between items-center shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-lg">
                  📓
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Notion</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {notionConnected ? user?.email?.split("@")[0] || "Connected" : "Not Connected"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {notionConnected ? (
                  <>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium flex items-center gap-1">
                      ✓ Connected
                    </span>
                    <button
                      onClick={() => toggleIntegration("notion")}
                      className="text-xs text-slate-400 hover:text-rose-400 transition font-medium"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => toggleIntegration("notion")}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold transition"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* Google Workspace Card */}
            <div className="bg-[#0b1329] border border-slate-800 p-6 rounded-2xl flex justify-between items-center shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-lg">
                  📊
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Google Workspace</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {googleConnected ? "Google Sheets Linked" : "Not Connected"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {googleConnected ? (
                  <>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium flex items-center gap-1">
                      ✓ Connected
                    </span>
                    <button
                      onClick={() => toggleIntegration("google")}
                      className="text-xs text-slate-400 hover:text-rose-400 transition font-medium"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => toggleIntegration("google")}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold transition"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Active Sync Pipelines Section */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Active Sync Pipelines</h2>
          
          {syncs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-xs text-slate-400">No active sync pipelines found.</p>
              <button
                onClick={() => router.push("/dashboard/new-sync")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold transition"
              >
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
                  <th className="py-3 px-4">Last Synced</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {syncs.map((sync) => (
                  <tr key={sync.id}>
                    <td className="py-3 px-4 font-mono text-slate-200">{sync.notion_db_id || "d3d97b3a..."}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400 underline truncate max-w-xs">
                      {sync.google_sheet_url || "https://docs.google.com/spreadsheets/d/..."}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {sync.status || "active"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {sync.last_synced ? new Date(sync.last_synced).toLocaleString() : "Never"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition">
                        Sync Now
                      </button>
                    </td>
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