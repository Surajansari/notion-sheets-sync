import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Basic validation
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 2. Insert into Supabase waitlist table
    const { error: dbError } = await supabase
      .from("waitlist")
      .insert([{ email, status: "pending" }]);

    if (dbError) {
      // 23505 = Supabase duplicate key violation code
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "You are already on the waitlist!" },
          { status: 400 }
        );
      }
      throw dbError;
    }

    // 3. Send automated welcome email via Resend
    await resend.emails.send({
      from: "SyncFlow <onboarding@resend.dev>", // Replace with your verified domain in production
      to: email,
      subject: "You're on the SyncFlow Early Access Waitlist! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #4f46e5;">Welcome to SyncFlow Early Access</h2>
          <p>Thanks for locking in your spot! We are onboarding users in weekly batches to ensure zero sync lag between Notion and Google Sheets.</p>
          <p><strong>Want early access in the next batch?</strong> Reply directly to this email and let me know your biggest frustration with Zapier or Make.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 14px; color: #64748b;">SyncFlow — True 2-Way Notion & Google Sheets Sync</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "Successfully joined the waitlist!" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Waitlist error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process request." },
      { status: 500 }
    );
  }
}