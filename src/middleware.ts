import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Note: This middleware runs on server, so can't access localStorage directly
// Dev mode checks are done on client-side in components

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Skip auth checks in dev bypass mode
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true') {
    return res;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Public paths
  if (pathname.startsWith('/login') || pathname.startsWith('/join') || pathname.startsWith('/onboarding') || pathname.startsWith('/auth')) {
    return res;
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check if user has a team
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_team_id')
    .eq('user_id', session.user.id)
    .single();

  if (!profile?.active_team_id) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
