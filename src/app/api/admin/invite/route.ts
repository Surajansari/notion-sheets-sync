import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email, waitlistId } = await req.json();

    if (!email || !email.includes("@") || !waitlistId) {
      return NextResponse.json(
        { error: "Invalid payload details" },
        { status: 400 }
      );
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "Missing Supabase server credentials" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");

    // Clean App URL for invitation link
    let rawUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usesyncflow.com";
    rawUrl = rawUrl.replace(/\[|\]|\(https?:\/\/[^\)]+\)/g, "").trim();
    if (!rawUrl.startsWith("http")) rawUrl = "https://usesyncflow.com";

    const inviteLink = `${rawUrl}/login?email=${encodeURIComponent(email)}`;

    // 1. Send Invitation Email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "SyncFlow <hello@usesyncflow.com>",
      to: email,
      subject: "You're invited to SyncFlow Early Access! 🎉",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #4f46e5; margin-top: 0; font-size: 22px;">Your SyncFlow Early Access is Ready!</h2>
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">
            Great news! You've been approved for <strong>SyncFlow</strong> early access. You can now connect your Notion databases and Google Sheets for real-time, automated 2-way sync.
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${inviteLink}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
              Claim Your Access & Sign In →
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">
            SyncFlow — Automated 2-Way Notion & Google Sheets Sync
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Resend API Error:", emailError);
      return NextResponse.json(
        { error: emailError.message || "Failed to send invitation email" },
        { status: 500 }
      );
    }

    // 2. Update Waitlist Record Status in Supabase
    const { error: dbError } = await supabaseAdmin
      .from("waitlist")
      .update({
        status: "invited",
        invited_at: new Date().toISOString(),
      })
      .eq("id", waitlistId);

    if (dbError) {
      console.error("Database Update Error:", dbError);
      return NextResponse.json(
        { error: "Email sent, but database status update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Invite handler error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to trigger invitation" },
      { status: 500 }
    );
  }
}