"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// Initialize Supabase client safely with fallback placeholders for static evaluation
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SyncConfig {
  id: string;
  notion_database_id: string;
  google_spreadsheet_url: string;
  status: string;
  last_synced_at: string | null;
}

interface ConnectionStatus {
  notion: boolean;
  google: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [syncs, setSyncs] = useState<SyncConfig[]>([]);
  const [connections, setConnections] = useState<ConnectionStatus>({
    notion: false,
    google: false,
  });
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      // Fetch OAuth connections status
      const { data: conns } = await supabase
        .from("oauth_connections")
        .select("provider")
        .eq("user_id", userId);

      if (conns) {
        const hasNotion = conns.some((c) => c.provider === "notion");
        const hasGoogle = conns.some((c) => c.provider === "google");
        setConnections({ notion: hasNotion, google: hasGoogle });
      }

      // Fetch user sync configurations
      const { data: syncConfigs } = await supabase
        .from("sync_configs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (syncConfigs) {
        setSyncs(syncConfigs);
      }
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Display feedback messages from OAuth redirect callbacks
  useEffect(() => {
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");

    if (successParam) {
      setMessage(`Success: ${successParam}`);
    } else if (errorParam) {
      setMessage(`Error: ${errorParam}`);
    }
  }, [searchParams]);

  // Trigger manual "Sync Now" operation
  const handleSyncNow = async (syncId: string) => {
    setSyncingId(syncId);
    setMessage(null);

    try {
      const res = await fetch("/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("Sync completed successfully!");
        fetchData();
      } else {
        setMessage(`Sync failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setMessage(`Sync error: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading SyncFlow Dashboard...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SyncFlow Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Automated 2-way sync between Notion databases and Google Sheets
            </p>
          </div>
          <Link
            href="/dashboard/new-sync"
            className="inline-flex items-center justify-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
          >
            + Create New Sync
          </Link>
        </div>

        {/* Message Alert Banner */}
        {message && (
          <div className="p-4 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm flex justify-between items-center">
            <span>{message}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-blue-600 hover:text-blue-900 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Integrations Connection Section */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Integrations Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notion Integration Card */}
            <div className="flex items-center justify-between p-4 border rounded-lg border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-800">Notion</span>
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    connections.notion ? "bg-green-500" : "bg-red-400"
                  }`}
                />
              </div>
              {connections.notion ? (
                <span className="text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-full font-medium">
                  Connected
                </span>
              ) : (
                <a
                  href="/api/auth/notion"
                  className="text-xs text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-md font-medium transition"
                >
                  Connect Notion
                </a>
              )}
            </div>

            {/* Google Workspace Integration Card */}
            <div className="flex items-center justify-between p-4 border rounded-lg border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-800">Google Workspace</span>
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    connections.google ? "bg-green-500" : "bg-red-400"
                  }`}
                />
              </div>
              {connections.google ? (
                <span className="text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-full font-medium">
                  Connected
                </span>
              ) : (
                <a
                  href="/api/auth/google"
                  className="text-xs text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-md font-medium transition"
                >
                  Connect Google
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Pipelines List */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Active Sync Pipelines</h2>
          </div>

          {syncs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-4 text-sm">No sync pipelines created yet.</p>
              <Link
                href="/dashboard/new-sync"
                className="inline-block text-xs font-medium bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
              >
                Setup First Sync
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-6">Notion DB ID</th>
                    <th className="py-3.5 px-6">Google Sheet</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Last Synced</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {syncs.map((sync) => (
                    <tr key={sync.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6 font-mono text-xs text-gray-900">
                        {sync.notion_database_id.slice(0, 8)}...
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-xs">
                        <a
                          href={sync.google_spreadsheet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {sync.google_spreadsheet_url}
                        </a>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                            sync.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {sync.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500">
                        {sync.last_synced_at
                          ? new Date(sync.last_synced_at).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleSyncNow(sync.id)}
                          disabled={syncingId === sync.id}
                          className="px-3 py-1.5 text-xs font-medium text-black bg-gray-100 hover:bg-gray-200 rounded-md transition disabled:opacity-50"
                        >
                          {syncingId === sync.id ? "Syncing..." : "Sync Now"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}