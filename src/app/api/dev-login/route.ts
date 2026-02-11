import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  const userId = crypto.randomUUID();
  response.cookies.set('dev_mode', '1', {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  });
  response.cookies.set('dev_user_id', userId, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  });
  response.cookies.set('dev_role', 'admin', {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  });
  response.cookies.set('active_team_id', 'd18014dc-bba2-4980-be27-bdd1fa45f58c', { // Apostles
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  });
  return response;
}
