"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  LogOut, 
  Database, 
  FileSpreadsheet,
  Zap,
  Clock
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncs, setSyncs] = useState<any[]>([]);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Fetch user's sync configurations
      const { data } = await supabase
        .from("sync_configs")
        .select("*")
        .eq("user_id", session.user.id);

      if (data) setSyncs(data);
      setLoading(false);
    }

    checkUser();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
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

      {/* DASHBOARD CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Active Syncs</h1>
            <p className="text-slate-400 text-xs mt-1">
              Manage real-time 5-minute syncs between Notion and Google Sheets.
            </p>
          </div>

          <button
            onClick={() => alert("Part 4 will connect your Notion & Google accounts!")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 w-fit"
          >
            <Plus className="w-4 h-4" />
            Create New Sync
          </button>
        </div>

        {/* Integration Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Notion Workspace</h3>
                <p className="text-xs text-slate-500">Not Connected</p>
              </div>
            </div>
            <button className="text-xs font-semibold text-indigo-400 hover:underline">
              Connect
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Google Workspace</h3>
                <p className="text-xs text-slate-500">Not Connected</p>
              </div>
            </div>
            <button className="text-xs font-semibold text-indigo-400 hover:underline">
              Connect
            </button>
          </div>
        </div>

        {/* Sync Configurations List */}
        {syncs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
            <Zap className="w-8 h-8 text-indigo-400 mx-auto mb-3 opacity-60" />
            <h3 className="font-semibold text-base text-white">No active syncs found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Connect your Notion database and Google Sheet to start automated 2-way syncing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {syncs.map((sync) => (
              <div key={sync.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{sync.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Syncing every {sync.sync_interval_minutes} mins
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}