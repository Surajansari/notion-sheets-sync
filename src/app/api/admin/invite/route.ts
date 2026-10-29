import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendBetaInviteEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Generate Supabase invite link / invite user
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/signup`,
    });

    if (error) throw error;

    // 2. Send the gorgeous Beta Invite email via Resend
    const inviteLink = data?.user?.confirmation_sent_at 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/signup` 
      : `${process.env.NEXT_PUBLIC_SITE_URL}/signup`;

    await sendBetaInviteEmail(email, inviteLink);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}