import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // If "code" is present, it's from OAuth. If not, check for access_token in hash (for email link)
  const hash = request.nextUrl.hash;
  const accessToken = hash.match(/access_token=([^&]+)/)?.[1];
  const refreshToken = hash.match(/refresh_token=([^&]+)/)?.[1];

  if (code) {
    // Handle OAuth callback
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    // Redirect to join or app
    return NextResponse.redirect(`${origin}/`);
  } else if (accessToken && refreshToken) {
    // Handle email link callback
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    // Redirect to join or app
    return NextResponse.redirect(`${origin}/`);
  } else {
    return NextResponse.redirect(`${origin}/login?error=no_code_or_tokens`);
  }
}
