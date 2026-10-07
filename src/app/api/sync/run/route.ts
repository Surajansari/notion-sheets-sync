import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { syncId } = await request.json();

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl || !syncId) {
      return NextResponse.json({ error: "Invalid payload or missing env" }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Fetch Sync Configuration
    const { data: sync, error: syncError } = await supabaseAdmin
      .from("sync_configs")
      .select("*")
      .eq("id", syncId)
      .single();

    if (syncError || !sync) {
      return NextResponse.json({ error: "Sync configuration not found" }, { status: 404 });
    }

    // 2. Fetch Notion and Google Tokens
    const { data: connections } = await supabaseAdmin
      .from("oauth_connections")
      .select("provider, access_token")
      .eq("user_id", sync.user_id);

    const notionToken = connections?.find((c) => c.provider === "notion")?.access_token;
    const googleToken = connections?.find((c) => c.provider === "google")?.access_token;

    if (!notionToken || !googleToken) {
      return NextResponse.json(
        { error: "Missing Notion or Google connection" },
        { status: 400 }
      );
    }

    // 3. Query Notion Database Pages
    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${sync.notion_database_id}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    const notionData = await notionRes.json();
    if (!notionRes.ok) {
      return NextResponse.json(
        { error: notionData.message || "Failed to fetch Notion data" },
        { status: notionRes.status }
      );
    }

    // 4. Extract Row Values from Notion
    const rows: string[][] = notionData.results.map((page: any) => {
      const props = page.properties || {};
      const values: string[] = [];

      for (const key in props) {
        const prop = props[key];
        if (prop.type === "title" && prop.title?.length > 0) {
          values.push(prop.title.map((t: any) => t.plain_text).join(""));
        } else if (prop.type === "rich_text" && prop.rich_text?.length > 0) {
          values.push(prop.rich_text.map((t: any) => t.plain_text).join(""));
        } else if (prop.type === "email") {
          values.push(prop.email || "");
        } else if (prop.type === "number") {
          values.push(prop.number !== null ? String(prop.number) : "");
        }
      }
      return values;
    });

    // 5. Extract Google Sheet ID from URL
    const sheetIdMatch = sync.google_spreadsheet_url.match(
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    );
    const spreadsheetId = sheetIdMatch ? sheetIdMatch[1] : null;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Invalid Google Sheet URL format" },
        { status: 400 }
      );
    }

    // 6. Push Rows to Google Sheet via Sheets API
    if (rows.length > 0) {
      const sheetsRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: rows,
          }),
        }
      );

      if (!sheetsRes.ok) {
        const sheetErr = await sheetsRes.json();
        return NextResponse.json(
          { error: sheetErr.error?.message || "Google Sheets update failed" },
          { status: sheetsRes.status }
        );
      }
    }

    // 7. Update last_synced_at Timestamp
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("sync_configs")
      .update({ last_synced_at: now })
      .eq("id", syncId);

    return NextResponse.json({ success: true, last_synced_at: now });
  } catch (err: any) {
    console.error("Sync Execution Error:", err);
    return NextResponse.json(
      { error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}