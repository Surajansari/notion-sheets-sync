import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId || userId === "undefined" || userId === "null") {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent("Missing user ID")}`, request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  // Use NEXT_PUBLIC_APP_URL or fallback directly to request origin (https://usesyncflow.com)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(
    scopes
  )}&access_type=offline&prompt=consent&state=${userId}`;

  return NextResponse.redirect(googleAuthUrl);
}