import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string; error?: string };
}) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Bypass RLS using service role key for system connection lookups
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: connections } = await supabaseAdmin
    .from("oauth_connections")
    .select("provider, workspace_name, updated_at")
    .eq("user_id", user.id);

  const notionConn = connections?.find((c) => c.provider === "notion");
  const googleConn = connections?.find((c) => c.provider === "google");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold">🔄 SyncFlow</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user.email}</span>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-md font-medium transition">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {searchParams?.status === "notion_connected" && (
        <div className="mb-6 bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>🎉 Notion workspace successfully connected!</span>
          <Link href="/dashboard" className="text-xs underline hover:text-white">Dismiss</Link>
        </div>
      )}

      {searchParams?.error && (
        <div className="mb-6 bg-rose-950/60 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>⚠️ Error: {searchParams.error}</span>
          <Link href="/dashboard" className="text-xs underline hover:text-white">Dismiss</Link>
        </div>
      )}

      <main className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <p className="text-xs text-slate-400">Free Trial Mode (Active)</p>
          </div>
          <Link href="/dashboard/syncs/new" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg transition">
            + Create New Sync
          </Link>
        </div>

        <section>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Integrations Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">Notion</h4>
                  <p className="text-xs text-slate-400">{notionConn ? notionConn.workspace_name : "Not connected"}</p>
                </div>
                {notionConn ? (
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">✓ Connected</span>
                ) : (
                  <span className="bg-amber-950 text-amber-400 border border-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">Disconnected</span>
                )}
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <a href={`/api/auth/notion?user_id=${user.id}`} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition">
                  {notionConn ? "Reconnect" : "Connect Notion →"}
                </a>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">Google Workspace</h4>
                  <p className="text-xs text-slate-400">{googleConn ? googleConn.workspace_name : "Not connected"}</p>
                </div>
                {googleConn ? (
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">✓ Connected</span>
                ) : (
                  <span className="bg-amber-950 text-amber-400 border border-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">Disconnected</span>
                )}
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <a href={`/api/auth/google?user_id=${user.id}`} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition">
                  {googleConn ? "Reconnect" : "Connect Google →"}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}