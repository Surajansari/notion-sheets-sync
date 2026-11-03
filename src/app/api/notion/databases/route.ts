import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Fetch user's Notion access token from Supabase integrations / tokens table
    const { data: userTokens, error: tokenError } = await supabase
      .from("user_tokens")
      .select("notion_access_token")
      .eq("user_id", user.id)
      .single();

    const accessToken = userTokens?.notion_access_token || process.env.NOTION_API_KEY;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No Notion access token found. Please reconnect Notion." },
        { status: 400 }
      );
    }

    // 3. Query Notion API for accessible databases
    const notionRes = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

    const notionData = await notionRes.json();

    if (!notionRes.ok) {
      console.error("Notion API Error:", notionData);
      return NextResponse.json(
        { error: notionData.message || "Failed to fetch Notion databases" },
        { status: notionRes.status }
      );
    }

    // 4. Format database list for UI dropdown
    const databases = (notionData.results || []).map((db: any) => {
      const titleObj = db.title || db.name;
      let title = "Untitled Database";
      if (Array.isArray(titleObj) && titleObj.length > 0) {
        title = titleObj.map((t: any) => t.plain_text).join("");
      }
      return {
        id: db.id,
        title: title || "Untitled Database",
      };
    });

    return NextResponse.json({ databases });
  } catch (err: any) {
    console.error("Internal API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}