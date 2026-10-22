"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  Users, 
  Mail, 
  CheckCircle, 
  Clock, 
  Send, 
  RefreshCw, 
  Search,
  LogOut,
  ShieldAlert
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AdminWaitlistContent() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function fetchWaitlist() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLeads(data);
        setFilteredLeads(data);
      }
      setLoading(false);
    }

    fetchWaitlist();
  }, [router]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredLeads(leads);
    } else {
      setFilteredLeads(
        leads.filter((lead) =>
          lead.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, leads]);

  const handleSendInvite = async (waitlistId: string, email: string) => {
    setInvitingId(waitlistId);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitlistId, email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send invitation.");

      setFeedback({ msg: `Invite sent to ${email}!`, type: "success" });

      // Update local state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === waitlistId
            ? { ...lead, status: "invited", invited_at: new Date().toISOString() }
            : lead
        )
      );
    } catch (err: any) {
      setFeedback({ msg: err.message, type: "error" });
    } finally {
      setInvitingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const pendingCount = leads.filter((l) => l.status !== "invited").length;
  const invitedCount = leads.filter((l) => l.status === "invited").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Users className="w-4 h-4" />
            </div>
            <span>Sync<span className="text-indigo-400">Flow</span> Admin</span>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition"
          >
            Go to User Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
              feedback.type === "error"
                ? "bg-red-950/50 border border-red-500/40 text-red-200"
                : "bg-emerald-950/50 border border-emerald-500/40 text-emerald-200"
            }`}
          >
            <span>{feedback.msg}</span>
            <button onClick={() => setFeedback(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Users className="w-4 h-4 text-indigo-400" /> Total Signups
            </div>
            <p className="text-2xl font-bold text-white mt-2">{leads.length}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Clock className="w-4 h-4 text-amber-400" /> Pending Approval
            </div>
            <p className="text-2xl font-bold text-amber-400 mt-2">{pendingCount}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Invites Sent
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-2">{invitedCount}</p>
          </div>
        </div>

        {/* Search & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-white">Waitlist Leads ({filteredLeads.length})</h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Waitlist Table */}
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-slate-400 text-xs">
            No waitlist signups found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-medium">
                <tr>
                  <th className="px-6 py-4">User Email</th>
                  <th className="px-6 py-4">Signed Up</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Invited At</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {lead.status === "invited" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Invited
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {lead.invited_at ? new Date(lead.invited_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSendInvite(lead.id, lead.email)}
                        disabled={invitingId === lead.id || lead.status === "invited"}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <Send className={`w-3 h-3 ${invitingId === lead.id ? "animate-spin" : ""}`} />
                        {invitingId === lead.id
                          ? "Sending..."
                          : lead.status === "invited"
                          ? "Re-invite"
                          : "Approve & Invite"}
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

export default function AdminWaitlistPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <AdminWaitlistContent />
    </Suspense>
  );
}