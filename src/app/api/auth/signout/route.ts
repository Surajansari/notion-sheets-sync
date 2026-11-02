import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  
  // Clear any server-side auth cookies if present
  const cookieStore = cookies();
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.includes("supabase")) {
      cookieStore.delete(cookie.name);
    }
  });

  return NextResponse.redirect(new URL("/login", requestUrl.origin), {
    status: 302,
  });
}