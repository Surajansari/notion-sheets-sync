import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");

    // Save lead to Supabase waitlist table
    const { error: dbError } = await supabase
      .from("waitlist")
      .insert([{ email, status: "pending" }]);

    if (dbError && dbError.code !== "23505") {
      throw dbError;
    }

    let rawUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usesyncflow.com";
    rawUrl = rawUrl.replace(/\[|\]|\(https?:\/\/[^\)]+\)/g, "").trim();
    if (!rawUrl.startsWith("http")) rawUrl = "https://usesyncflow.com";

    const loginLink = `${rawUrl}/login?email=${encodeURIComponent(email)}`;

    // Professional Welcome & Trial Explanation Email
    await resend.emails.send({
      from: "SyncFlow <hello@usesyncflow.com>",
      to: email,
      subject: "Welcome to SyncFlow! Your 14-Day Pro Trial Has Begun 🚀",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0; font-size: 24px;">Welcome aboard, Sync-Pioneer! 🎉</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Thank you for joining <strong>SyncFlow</strong>. You now have full access to our high-performance, real-time 2-way sync engine connecting your Notion databases and Google Sheets.
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px 20px; border-radius: 0 12px 12px 0; margin: 24px 0;">
            <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 16px;">🎁 Your 14-Day Free Pro Trial Includes:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.5;">
              <li><strong>Lightning-fast 5-minute background sync intervals</strong></li>
              <li><strong>Unlimited Notion databases & Google Sheets</strong></li>
              <li><strong>Automatic token refreshing & error alerts</strong></li>
            </ul>
          </div>

          <h3 style="color: #0f172a; font-size: 18px; margin-top: 24px;">What happens after your 14-day trial?</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            When your trial concludes, your account will transition to our Free tier (1 active sync pipeline updated every 15 minutes) unless you upgrade to <strong>SyncFlow Pro ($15/mo)</strong>. Rest assured, <strong>none of your configuration, historical logs, or synced data will ever be lost or deleted</strong>.
          </p>

          <div style="margin: 32px 0; text-align: center;">
            <a href="${loginLink}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);">
              Access Your Dashboard & Start Syncing →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            SyncFlow — True 2-Way Notion & Google Sheets Sync<br />
            If you have any questions, reply directly to this email—our founders read every message.
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "You're on the list! Check your inbox for trial details." },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}