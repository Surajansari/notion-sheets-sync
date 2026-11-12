import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update waitlist status to approved
    await supabaseAdmin
      .from("waitlist")
      .update({ status: "approved", invited_at: new Date().toISOString() })
      .eq("email", email);

    const signupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.usesyncflow.com"}/signup`;

    // Send Invite & Trial Welcome Email via Resend
    await resend.emails.send({
      from: "SyncFlow <hello@usesyncflow.com>",
      to: [email],
      subject: "You're in! Claim your SyncFlow 14-Day Pro Trial 🚀",
      html: `
        <div style="font-family: sans-serif; background-color: #070b19; color: #ffffff; padding: 40px; border-radius: 16px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0b1329; padding: 32px; border-radius: 12px; border: 1px solid #1e293b;">
            <h2 style="color: #818cf8; margin-top: 0;">Your Access is Ready!</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Your cohort has been activated. You can now set up your SyncFlow account and instantly unlock your 14-day Pro trial.
            </p>
            <div style="margin: 30px 0;">
              <a href="${signupUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Set Up Your Account & Start Syncing →
              </a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              If you have any questions while connecting your Notion database or Google Sheet, reply directly to this email.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Invite sent successfully" });
  } catch (err: any) {
    console.error("Invite API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}