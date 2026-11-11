import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Insert into Supabase waitlist table
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .insert([{ email, status: "pending" }])
      .select();

    if (error) {
      console.error("Waitlist DB Error:", error);

      // Handle duplicate email (Postgres unique violation 23505)
      if (error.code === "23505") {
        return NextResponse.json(
          { message: "You are already on the waitlist! Welcome back." },
          { status: 200 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Send Automated Welcome Email via Resend
    try {
      await resend.emails.send({
        from: "SyncFlow <hello@usesyncflow.com>", // Make sure your domain is verified in Resend, or use onboarding@resend.dev for testing
        to: [email],
        subject: "You're on the SyncFlow Early Access List! 🚀",
        html: `
          <div style="font-family: sans-serif; background-color: #070b19; color: #ffffff; padding: 40px; border-radius: 16px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #0b1329; padding: 32px; border-radius: 12px; border: 1px solid #1e293b;">
              <h2 style="color: #818cf8; margin-top: 0;">Welcome to SyncFlow!</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Thank you for joining our exclusive early access waitlist. You are now in line for true 2-way real-time synchronization between Notion and Google Sheets.
              </p>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                When your cohort is activated, you'll receive your direct access link to set up your account and claim your 14-day Pro trial.
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #1e293b; color: #64748b; font-size: 12px;">
                <p>© 2026 SyncFlow. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Resend email delivery error:", emailErr);
      // We still return success since the user was added to the waitlist DB successfully
    }

    return NextResponse.json(
      { message: "Successfully joined waitlist! Check your inbox for confirmation.", data },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Waitlist API Exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}