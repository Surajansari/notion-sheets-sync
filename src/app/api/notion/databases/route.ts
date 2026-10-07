import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Fetch latest active Notion token from database
    const { data: connection, error: dbError } = await supabaseAdmin
      .from("oauth_connections")
      .select("access_token")
      .eq("provider", "notion")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (dbError || !connection?.access_token) {
      return NextResponse.json(
        { error: "No active Notion connection found" },
        { status: 404 }
      );
    }

    // 2. Fetch databases from Notion API
    const response = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          value: "database",
          property: "object",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to fetch Notion databases" },
        { status: response.status }
      );
    }

    // 3. Extract database titles and IDs
    const databases = data.results.map((db: any) => {
      const titleObj = db.title || [];
      const titleText =
        titleObj.map((t: any) => t.plain_text).join("") || "Untitled Database";
      return {
        id: db.id,
        title: titleText,
      };
    });

    return NextResponse.json({ databases });
  } catch (err: any) {
    console.error("Notion Databases API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}