import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Supabase keys." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Insert into waitlist
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .insert([{ email, name: name || "" }])
      .select();

    if (error) {
      console.error("Waitlist DB Error:", error);
      
      // Handle duplicate email (Postgres unique violation error code 23505)
      if (error.code === "23505") {
        return NextResponse.json(
          { message: "You are already on the waitlist! Welcome back." },
          { status: 200 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Successfully joined waitlist!", data },
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