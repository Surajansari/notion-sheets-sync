'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Sign up user with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Upsert profile directly to guarantee entry in profiles table
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          status: 'trialing',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (profileError) {
          console.error('Profile upsert warning:', profileError.message);
        }
      }

      // 3. Success! Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Database error saving new user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Create your SyncFlow Account</h1>
        <p className="text-slate-400 text-sm mb-6">Start syncing Notion and Sheets in 60 seconds</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium py-3 rounded-lg transition shadow-lg"
          >
            {loading ? 'Creating Account...' : 'Sign Up →'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account? <a href="/login" className="text-indigo-400 hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}