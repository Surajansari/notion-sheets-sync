import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let userId = searchParams.get("user_id");

  // If user_id wasn't passed in query params, try getting it from the active Supabase session
  if (!userId || userId === "undefined" || userId === "null") {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    return NextResponse.redirect(
      new URL("/login?error=missing_user", request.url)
    );
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  
  // Fixed regex: removed the accidental backslash before $ so trailing slashes are correctly stripped
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://usesyncflow.com").replace(/\/+$/, "");
  const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/notion/callback`);

  if (!clientId) {
    console.error("CRITICAL: NOTION_CLIENT_ID is missing from environment variables.");
    return NextResponse.redirect(
      new URL("/dashboard?error=missing_notion_client_id", request.url)
    );
  }

  const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}&state=${userId}`;

  return NextResponse.redirect(notionAuthUrl);
}