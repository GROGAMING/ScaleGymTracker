import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  // Generate join code
  let joinCode;
  let attempts = 0;
  let existing: any = null;
  do {
    joinCode = generateJoinCode();
    const { data: found } = await supabase
      .from("teams")
      .select("id")
      .eq("join_code", joinCode)
      .maybeSingle();
    existing = found;
    attempts++;
  } while (existing && attempts < 10);

  if (attempts >= 10) {
    return NextResponse.json({ error: "Failed to generate unique join code" }, { status: 500 });
  }

  // Create team
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .insert({ name, join_code: joinCode, join_code_active: true })
    .select()
    .single();

  if (teamErr) {
    return NextResponse.json({ error: teamErr.message }, { status: 500 });
  }

  // Add creator as admin
  const { error: memberErr } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: session.user.id, role: "admin" });

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  // Set active team
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({ user_id: session.user.id, active_team_id: team.id });

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ team, joinCode });
}
