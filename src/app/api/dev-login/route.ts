import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("dev_mode", "1", { path: "/", sameSite: "lax" });
  res.cookies.set("active_team_id", "d18014dc-bba2-4980-be27-bdd1fa45f58c", { path: "/", sameSite: "lax" });
  return res;
}
