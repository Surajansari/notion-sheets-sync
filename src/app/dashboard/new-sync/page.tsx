"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function NewSyncPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDb, setSelectedDb] = useState("");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [syncName, setSyncName] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchDatabases() {
      try {
        const res = await fetch("/api/notion/databases");
        const data = await res.json();
        if (data.databases) {
          setDatabases(data.databases);
        }
      } catch (err) {
        console.error("Failed to load Notion databases:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDatabases();
  }, []);

  const handleCreateSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("sync_configs").insert({
      user_id: user.id,
      name: syncName,
      notion_database_id: selectedDb,
      google_spreadsheet_url: spreadsheetUrl,
      status: "active",
    });

    if (!error) {
      router.push("/dashboard");
    } else {
      alert("Error creating sync: " + error.message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-8 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-xs text-slate-400 hover:text-white mb-6 flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-2">Create New Sync</h1>
      <p className="text-slate-400 text-sm mb-8">
        Set up automated 2-way synchronization between Notion and Google Sheets.
      </p>

      <form onSubmit={handleCreateSync} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Sync Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Sales Leads Sync"
            value={syncName}
            onChange={(e) => setSyncName(e.target.value)}
            className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select Notion Database
          </label>
          <select
            required
            value={selectedDb}
            onChange={(e) => setSelectedDb(e.target.value)}
            className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
          >
            <option value="">-- Choose Database --</option>
            {databases.map((db) => (
              <option key={db.id} value={db.id}>
                {db.title || "Untitled Database"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Google Sheet URL
          </label>
          <input
            type="url"
            required
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={spreadsheetUrl}
            onChange={(e) => setSpreadsheetUrl(e.target.value)}
            className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition"
        >
          {saving ? "Creating Sync..." : "Start Syncing"}
        </button>
      </form>
    </div>
  );
}