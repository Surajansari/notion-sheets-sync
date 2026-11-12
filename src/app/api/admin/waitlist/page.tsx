"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

export default function AdminWaitlistPage() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const isAuth = sessionStorage.getItem("syncflow_admin_auth");
    if (isAuth === "true") {
      setAuthorized(true);
      fetchWaitlist();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "SyncFlowAdmin2026!") {
      sessionStorage.setItem("syncflow_admin_auth", "true");
      setAuthorized(true);
      fetchWaitlist();
    } else {
      alert("Incorrect admin password.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("syncflow_admin_auth");
    setAuthorized(false);
    setPassword("");
  };

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/waitlist");
      const data = await res.json();
      if (res.ok) {
        setWaitlist(data.waitlist || []);
      } else {
        setMsg("Failed to load waitlist: " + data.error);
      }
    } catch (err: any) {
      setMsg("Error fetching waitlist: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndInvite = async (email: string) => {
    setMsg(`Sending invite to ${email}...`);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`Successfully invited ${email}!`);
        fetchWaitlist();
      } else {
        setMsg(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#070b19] text-white flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-[#0b1329] border border-slate-800 p-8 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
          <h1 className="text-xl font-bold">Admin Portal</h1>
          <p className="text-xs text-slate-400">Enter secure admin password to manage waitlist.</p>
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#070b19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition">
            Access Portal →
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Logout */}
        <div className="flex justify-between items-center bg-[#0b1329] border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-2xl font-bold">SyncFlow Admin & Beta Hub</h1>
            <p className="text-xs text-slate-400 mt-1">Manage waitlist signups and dispatch beta invites in real time.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchWaitlist} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold transition">
              Refresh Data
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition">
              Log Out
            </button>
          </div>
        </div>

        {msg && <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs">{msg}</div>}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0b1329] border border-slate-800 p-6 rounded-2xl shadow-xl">
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Waitlist Signups</p>
            <p className="text-3xl font-bold mt-2">{waitlist.length}</p>
          </div>
        </div>

        {/* Waitlist Table */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Waitlist Queue ({waitlist.length})</h2>
          {loading ? (
            <p className="text-xs text-slate-400">Loading leads...</p>
          ) : waitlist.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No waitlist entries found.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {waitlist.map((lead) => (
                  <tr key={lead.id}>
                    <td className="py-3 px-4 font-mono text-slate-200">{lead.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        lead.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {lead.status || "pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{new Date(lead.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      {lead.status !== "approved" ? (
                        <button
                          onClick={() => handleApproveAndInvite(lead.email)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold transition"
                        >
                          Approve & Invite →
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-medium">Invited</span>
                      )}
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