import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWaitlistEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, firstName, lastName } = await req.json();

    // 1. Insert into waitlist table
    const { error } = await supabase
      .from('waitlist')
      .insert([{ email, first_name: firstName || 'Valued', last_name: lastName || 'User' }]);

    if (error && !error.message.includes('duplicate')) {
      throw error;
    }

    // 2. Send engaging welcome/waitlist email
    await sendWaitlistEmail(email, firstName || 'Sync-Pioneer');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}