import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
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

    // Initialize Resend dynamically inside the POST handler
    const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key_for_build");

    // Save lead to Supabase
    const { error: dbError } = await supabase
      .from("waitlist")
      .insert([{ email, status: "pending" }]);

    if (dbError) {
      if (dbError.code === "23505") {
        return NextResponse.json(
          { message: "You are already on the waitlist!" },
          { status: 200 }
        );
      }
      throw dbError;
    }

    // Send onboarding welcome email via Resend
    await resend.emails.send({
      from: "SyncFlow <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to SyncFlow Waitlist 🚀",
      html: `<p>Thanks for joining the SyncFlow waitlist!</p>`,
    });

    return NextResponse.json(
      { message: "You're on the list! Check your inbox." },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}