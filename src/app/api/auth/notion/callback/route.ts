import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("--- NOTION CALLBACK STARTED ---");
  console.log("User ID from state:", userId);
  console.log("Auth Code present:", !!code);

  if (error || !code || !userId || userId === "undefined" || userId === "null") {
    console.error("Callback failed: missing params or user denied");
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent("Missing user ID or permission denied")}`, request.url)
    );
  }

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing in .env.local");
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent("Missing Supabase Service Key in .env.local")}`, request.url)
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const clientId = process.env.NOTION_CLIENT_ID!;
    const clientSecret = process.env.NOTION_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/notion/callback`;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Notion API Error:", data);
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent("Notion Token Exchange Failed")}`, request.url)
      );
    }

    console.log("Saving token to Supabase for user:", userId);

    const { error: dbError } = await supabaseAdmin
      .from("oauth_connections")
      .upsert(
        {
          user_id: userId,
          provider: "notion",
          access_token: data.access_token,
          workspace_id: data.workspace_id,
          workspace_name: data.workspace_name || "Notion Workspace",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (dbError) {
      console.error("DATABASE SAVE ERROR DETAILS:", dbError);
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent(dbError.message || "Database Save Error")}`, request.url)
      );
    }

    console.log("Successfully saved Notion connection!");
    return NextResponse.redirect(
      new URL("/dashboard?status=notion_connected", request.url)
    );
  } catch (err: any) {
    console.error("Unhandled OAuth Exception:", err);
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(err?.message || "Server Exception")}`, request.url)
    );
  }
}