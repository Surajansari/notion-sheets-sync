import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("--- GOOGLE CALLBACK STARTED ---");
  console.log("User ID from state:", userId);
  console.log("Auth Code present:", !!code);

  if (error || !code || !userId || userId === "undefined" || userId === "null") {
    console.error("Google Callback failed: missing params or user denied", error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent("Google permission denied or session missing")}`, request.url)
    );
  }

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing");
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent("Missing Supabase Service Key in .env.local")}`, request.url)
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google Token Exchange Failed:", tokens);
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent("Google Token Exchange Failed")}`, request.url)
      );
    }

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    const userInfo = await userRes.json();

    console.log("Saving Google token to Supabase for user:", userId);

    const { error: dbError } = await supabaseAdmin
      .from("oauth_connections")
      .upsert(
        {
          user_id: userId,
          provider: "google",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          workspace_name: userInfo.email || "Google Workspace",
          expires_at: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null,
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

    console.log("Successfully saved Google connection!");
    return NextResponse.redirect(
      new URL("/dashboard?status=google_connected", request.url)
    );
  } catch (err: any) {
    console.error("Unhandled Google OAuth Exception:", err);
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(err?.message || "Server Exception")}`, request.url)
    );
  }
}