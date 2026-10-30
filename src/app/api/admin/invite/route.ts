import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL}/signup`;

    // 1. Update waitlist table status to 'invited'
    const { error: dbError } = await supabaseAdmin
      .from('waitlist')
      .update({ 
        status: 'invited', 
        invited_at: new Date().toISOString() 
      })
      .eq('email', email);

    if (dbError) {
      console.error('Waitlist update error:', dbError.message);
    }

    // 2. Send the Beta Invite email via Resend
    await resend.emails.send({
      from: 'SyncFlow <hello@usesyncflow.com>',
      to: email,
      subject: '🔥 Your SyncFlow Beta Invite is Here! (Claim Your Pro Trial)',
      html: `
        <div style="background-color: #020617; color: #f8fafc; padding: 40px; font-family: Arial, sans-serif; border-radius: 8px;">
          <h2 style="color: #ffffff; margin-bottom: 20px;">Your Access Has Been Unlocked! 🔒✨</h2>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">The wait is over. Your spot for the <strong>SyncFlow Beta</strong> is ready.</p>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">Click the secure button below to create your account, set your password, and instantly claim your <strong>14-Day Free Pro Trial</strong>:</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background: linear-gradient(to right, #6366f1, #4f46e5); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accept Beta Invite & Start Syncing →</a>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 40px;">If you have any questions as you test out your first sync, simply reply directly to this email!</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin invite API error:', err);
    return NextResponse.json({ error: err.message || 'Database error saving new user' }, { status: 400 });
  }
}