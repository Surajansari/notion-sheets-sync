import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ ERROR: RESEND_API_KEY is missing!");
      return NextResponse.json(
        { error: "Server missing API key" },
        { status: 500 }
      );
    }

    // 1. Send notification email TO YOU (ali.raa@gmail.com)
    // This always succeeds on Resend's free plan!
    await resend.emails.send({
      from: "SyncFlow Waitlist <onboarding@resend.dev>",
      to: "ali.raa@gmail.com",
      subject: "🚀 New SyncFlow Waitlist Signup!",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #4f46e5; margin-top: 0;">New Lead Captured!</h2>
          <p style="font-size: 16px;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 14px; color: #64748b;">Signed up at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    // 2. Try sending welcome email to subscriber (works if email is yours OR if you add custom domain later)
    try {
      await resend.emails.send({
        from: "SyncFlow <onboarding@resend.dev>",
        to: email,
        subject: "⚡ You're on the SyncFlow VIP Waitlist!",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
            <h2 style="color: #4f46e5;">Welcome to SyncFlow!</h2>
            <p>Thanks for locking in early access to <strong>SyncFlow</strong>.</p>
            <p>You've locked in a <strong>30% lifetime discount</strong> ($15/mo flat rate with 5-minute syncs).</p>
          </div>
        `,
      });
    } catch (err) {
      // Sandbox warning catch — user email still gets recorded in founder notification!
      console.log(`[Resend Sandbox Notice]: Couldn't email subscriber ${email} directly without custom domain, but founder notification was sent.`);
    }

    console.log(`✅ [WAITLIST LEAD CAPTURED]: ${email}`);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Waitlist API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit waitlist" },
      { status: 500 }
    );
  }
}