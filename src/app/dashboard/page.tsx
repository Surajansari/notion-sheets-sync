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
  ExternalLink,
  Sparkles,
  CreditCard,
  Clock
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncs, setSyncs] = useState<any[]>([]);
  const [notionConn, setNotionConn] = useState<any>(null);
  const [googleConn, setGoogleConn] = useState<any>(null);
  
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

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

      // Fetch user profile / subscription details
      let { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!userProfile) {
        // Fallback default profile if trigger missed
        userProfile = {
          subscription_status: "trialing",
          plan_tier: "pro_trial",
          trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        };
      }
      setProfile(userProfile);

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

  // Calculate remaining trial days
  const getTrialDaysLeft = () => {
    if (!profile?.trial_ends_at) return 14;
    const diff = new Date(profile.trial_ends_at).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleUpgradeToPro = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to initiate checkout");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setUpgrading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isPro = profile?.subscription_status === "active";
  const daysLeft = getTrialDaysLeft();

  return (
    <div className={`min-h-screen font-sans transition-all duration-500 ${isPro ? "bg-slate-950 text-slate-100 selection:bg-pink-500 selection:text-white" : "bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white"}`}>
      
      {/* Dynamic Pro vs Trial Header Banner */}
      {isPro ? (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>SyncFlow Pro Active — Enjoying unlimited 5-minute synchronization pipelines!</span>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Pro Trial Active: <strong>{daysLeft} days remaining</strong></span>
          </div>
          <button
            onClick={handleUpgradeToPro}
            disabled={upgrading}
            className="bg-white text-slate-950 px-3 py-1 rounded-full text-xs font-bold hover:bg-slate-100 transition shadow"
          >
            {upgrading ? "Redirecting..." : "Upgrade to Pro ($15/mo) →"}
          </button>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className={`border-b sticky top-0 z-50 backdrop-blur-md ${isPro ? "border-purple-500/30 bg-slate-950/90 shadow-purple-950/20 shadow-xl" : "border-slate-800/60 bg-slate-950/80"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg ${isPro ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-pink-500/30 animate-pulse" : "bg-indigo-600 shadow-indigo-500/20"}`}>
              <RefreshCw className="w-5 h-5" />
            </div>
            <span>Sync<span className={isPro ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" : "text-indigo-400"}>Flow</span></span>
            {isPro && (
              <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest shadow">
                PRO
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isPro && (
              <button
                onClick={handleUpgradeToPro}
                disabled={upgrading}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl transition shadow-md shadow-indigo-600/25"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade to Pro
              </button>
            )}
            <span className="text-xs text-slate-400 hidden md:inline-block">{user?.email}</span>
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
        {(errorMessage || errorParam || statusParam === "pro_active") && (
          <div className="mb-6">
            {statusParam === "pro_active" && (
              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Payment successful! Welcome to SyncFlow Pro. Your subscription is active.</span>
              </div>
            )}
            {(errorMessage || errorParam) && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{errorMessage || decodeURIComponent(errorParam!)}</span>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-xs underline">Dismiss</button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Dashboard {isPro && <Sparkles className="w-5 h-5 text-pink-400" />}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              {isPro ? "Your Pro subscription is fully active. All pipelines sync every 5 minutes." : `Free Trial Mode (${daysLeft} days left before downgrade to 15-min intervals).`}
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/new-sync")}
            className={`font-semibold px-4 py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 w-fit shadow-lg ${
              isPro 
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white shadow-pink-500/25" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
            }`}
          >
            <Plus className="w-4 h-4" />
            Create New Sync
          </button>
        </div>

        {/* Integrations Status Section */}
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Integrations Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className={`p-5 rounded-2xl bg-slate-900/60 border flex items-center justify-between transition ${isPro ? "border-purple-500/30 hover:border-purple-500/50" : "border-slate-800"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isPro ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"}`}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Notion</h3>
                <p className="text-xs text-slate-500">{notionConn ? (notionConn.workspace_name || "Connected") : "Not Connected"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {notionConn && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              )}
              <button
                onClick={() => { if (user?.id) window.location.href = `/api/auth/notion?user_id=${user.id}`; }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                {notionConn ? "Reconnect" : "Connect"}
              </button>
            </div>
          </div>

          <div className={`p-5 rounded-2xl bg-slate-900/60 border flex items-center justify-between transition ${isPro ? "border-pink-500/30 hover:border-pink-500/50" : "border-slate-800"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isPro ? "bg-pink-500/10 border-pink-500/30 text-pink-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Google Workspace</h3>
                <p className="text-xs text-slate-500">{googleConn ? (googleConn.workspace_name || "Connected") : "Not Connected"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {googleConn && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              )}
              <button
                onClick={() => { if (user?.id) window.location.href = `/api/auth/google?user_id=${user.id}`; }}
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
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
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
                    <td className="px-6 py-4 font-mono text-slate-300">{sync.notion_database_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <a href={sync.google_spreadsheet_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 truncate">
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
                      {sync.last_synced_at ? new Date(sync.last_synced_at).toLocaleString() : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSyncNow(sync.id)}
                        disabled={syncingId === sync.id}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow"
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
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}