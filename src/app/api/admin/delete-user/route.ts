import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { userId, email, type } = await req.json();

    if (type === 'waitlist') {
      // Delete from waitlist table
      const { error } = await supabaseAdmin.from('waitlist').delete().eq('email', email);
      if (error) throw error;
    } else {
      // Delete from Supabase Auth (cascade deletes profile usually, or delete explicitly)
      if (userId) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) throw authError;
      }
      const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('email', email);
      if (profileError && !profileError.message.includes('No rows')) throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}