import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId || userId === "undefined" || userId === "null") {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent("Missing user ID")}`, request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;

  // Clean raw APP_URL string to prevent any bracket/markdown corruption
  let rawUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usesyncflow.com";
  rawUrl = rawUrl.replace(/\[|\]|\(https?:\/\/[^\)]+\)/g, "").trim();
  if (!rawUrl.startsWith("http")) {
    rawUrl = "https://usesyncflow.com";
  }

  const redirectUri = `${rawUrl}/api/auth/google/callback`;

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