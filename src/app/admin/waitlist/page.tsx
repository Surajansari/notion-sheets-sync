"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Mail, Trash2, Send, ShieldAlert, RefreshCw, CheckCircle2, Clock } from "lucide-react";

export default function AdminWaitlistPage() {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: waitlistData } = await supabase.from('waitlist').select('*').order('created_at', { ascending: false });
      const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      
      setWaitlist(waitlistData || []);
      setProfiles(profilesData || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendInvite = async (email: string) => {
    if (!confirm(`Send beta invite email to ${email}?`)) return;
    setActionLoading(email);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Beta invite successfully sent to ${email}! 🚀`);
    } catch (err: any) {
      alert(`Failed to send invite: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUserRecord = async (email: string, userId?: string, type: 'waitlist' | 'user' = 'waitlist') => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchData();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SyncFlow Admin & Beta Hub</h1>
              <p className="text-xs text-slate-400">Manage waitlist signups, dispatch beta invites, and monitor user trials.</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Total Waitlist Signups</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-white">{waitlist.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Registered Users</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white">{profiles.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Pro Subscribers</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Active</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {profiles.filter(p => p.subscription_status === 'active' || p.subscription_status === 'pro_active').length}
            </div>
          </div>
        </div>

        {/* Waitlist Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden mb-12 shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Waitlist Queue ({waitlist.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Joined At</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {waitlist.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No waitlist entries found.</td>
                  </tr>
                ) : (
                  waitlist.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-medium text-white">{item.first_name} {item.last_name}</td>
                      <td className="px-6 py-4 text-slate-300">{item.email}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => sendInvite(item.email)}
                          disabled={actionLoading === item.email}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" /> {actionLoading === item.email ? "Sending..." : "Send Invite"}
                        </button>
                        <button
                          onClick={() => deleteUserRecord(item.email, undefined, 'waitlist')}
                          className="bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-red-300 p-1.5 rounded-lg transition inline-flex items-center cursor-pointer"
                          title="Delete from Waitlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registered Profiles Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Registered Profiles ({profiles.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Trial Ends / Sub</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No registered profiles found.</td>
                  </tr>
                ) : (
                  profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-medium text-white">{profile.first_name} {profile.last_name}</td>
                      <td className="px-6 py-4 text-slate-300">{profile.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          profile.subscription_status === 'active' || profile.subscription_status === 'pro_active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {profile.subscription_status || 'trialing'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {profile.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteUserRecord(profile.email, profile.id, 'user')}
                          className="bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-red-300 p-1.5 rounded-lg transition inline-flex items-center cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}