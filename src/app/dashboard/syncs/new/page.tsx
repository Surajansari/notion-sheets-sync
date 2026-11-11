"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function NewSyncPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [syncName, setSyncName] = useState("");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [loadingDatabases, setLoadingDatabases] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      try {
        const res = await fetch(`/api/notion/databases?userId=${user.id}`);
        const data = await res.json();
        setDatabases(data.databases || []);
      } catch (err) {
        console.error("Failed to load Notion databases:", err);
      } finally {
        setLoadingDatabases(false);
      }
    }
    init();
  }, [router, supabase]);

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatabase || !spreadsheetUrl) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.from("sync_configs").insert({
        user_id: user.id,
        sync_name: syncName,
        notion_database_id: selectedDatabase,
        google_spreadsheet_url: spreadsheetUrl,
        status: "active",
      });

      if (error) throw error;
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create sync pipeline.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto bg-[#0b1329] border border-slate-800/80 rounded-3xl p-8 shadow-2xl">
        <button onClick={() => router.push("/dashboard")} className="text-xs text-slate-400 hover:text-white mb-4 block">
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Create New Sync</h1>
        <p className="text-xs text-slate-400 mb-6">Set up automated 2-way synchronization between Notion and Google Sheets.</p>

        {errorMsg && <div className="mb-4 p-3 bg-rose-500/10 text-rose-400 rounded-xl text-xs border border-rose-500/20">{errorMsg}</div>}

        <form onSubmit={handleStartSync} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase">Sync Name</label>
            <input type="text" required placeholder="e.g. Sales Pipeline" value={syncName} onChange={(e) => setSyncName(e.target.value)} className="w-full bg-[#070b19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase">Select Notion Database</label>
            {loadingDatabases ? (
              <div className="p-3 bg-[#070b19] border border-slate-800 rounded-xl text-xs text-slate-400">Loading Notion databases...</div>
            ) : databases.length === 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-2">
                <p>No databases found. Please connect your Notion account first.</p>
                <a href="/api/auth/notion" className="inline-block px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold">Connect Notion Account →</a>
              </div>
            ) : (
              <select value={selectedDatabase} onChange={(e) => setSelectedDatabase(e.target.value)} className="w-full bg-[#070b19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
                <option value="">-- Choose Database --</option>
                {databases.map((db) => (
                  <option key={db.id} value={db.id}>{db.title || db.id}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase">Google Sheet URL</label>
            <input type="url" required placeholder="https://docs.google.com/spreadsheets/d/..." value={spreadsheetUrl} onChange={(e) => setSpreadsheetUrl(e.target.value)} className="w-full bg-[#070b19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
          </div>

          <button type="submit" disabled={submitting || databases.length === 0} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition">
            {submitting ? "Starting Sync..." : "Start Syncing →"}
          </button>
        </form>
      </div>
    </div>
  );
}