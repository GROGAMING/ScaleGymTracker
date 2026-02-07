import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect('/doom-scroll');
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
