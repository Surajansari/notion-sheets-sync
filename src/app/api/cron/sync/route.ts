import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    // 1. Verify Secret Header
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "Missing Supabase env configuration" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 2. Fetch all active sync configurations
    const { data: syncs, error: fetchError } = await supabaseAdmin
      .from("sync_configs")
      .select("*")
      .eq("status", "active");

    if (fetchError || !syncs) {
      return NextResponse.json(
        { error: "Failed to fetch active sync configurations" },
        { status: 500 }
      );
    }

    const results = [];

    // 3. Process each sync rule
    for (const sync of syncs) {
      try {
        const { data: connections } = await supabaseAdmin
          .from("oauth_connections")
          .select("provider, access_token")
          .eq("user_id", sync.user_id);

        const notionToken = connections?.find((c) => c.provider === "notion")?.access_token;
        const googleToken = connections?.find((c) => c.provider === "google")?.access_token;

        if (!notionToken || !googleToken) {
          results.push({ syncId: sync.id, status: "skipped", reason: "Missing provider tokens" });
          continue;
        }

        // Fetch Notion records
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
          results.push({ syncId: sync.id, status: "failed", error: notionData.message });
          continue;
        }

        // Extract Notion property values
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

        // Parse Google Spreadsheet ID
        const sheetIdMatch = sync.google_spreadsheet_url.match(
          /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
        );
        const spreadsheetId = sheetIdMatch ? sheetIdMatch[1] : null;

        if (!spreadsheetId) {
          results.push({ syncId: sync.id, status: "failed", error: "Invalid Google Sheet URL" });
          continue;
        }

        // Write rows to Google Sheet
        if (rows.length > 0) {
          const sheetsRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${googleToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ values: rows }),
            }
          );

          if (!sheetsRes.ok) {
            const sheetErr = await sheetsRes.json();
            results.push({ syncId: sync.id, status: "failed", error: sheetErr.error?.message });
            continue;
          }
        }

        // Update database timestamp
        const now = new Date().toISOString();
        await supabaseAdmin
          .from("sync_configs")
          .update({ last_synced_at: now })
          .eq("id", sync.id);

        results.push({ syncId: sync.id, status: "success", syncedAt: now });
      } catch (err: any) {
        results.push({ syncId: sync.id, status: "error", error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: results.length,
      results,
    });
  } catch (err: any) {
    console.error("Cron Execution Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}