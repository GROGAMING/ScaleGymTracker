import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { joinCode, fullName } = await req.json();
  if (!joinCode || !fullName) {
    return NextResponse.json({ error: "Missing joinCode or fullName" }, { status: 400 });
  }

  // Find team
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("id")
    .eq("join_code", joinCode.toUpperCase())
    .eq("join_code_active", true)
    .single();

  if (teamErr || !team) {
    return NextResponse.json({ error: "Invalid join code" }, { status: 400 });
  }

  // Insert into team_members
  const { error: memberErr } = await supabase
    .from("team_members")
    .upsert({ team_id: team.id, user_id: session.user.id, role: "member" });

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  // Set active_team_id and full_name
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({ user_id: session.user.id, active_team_id: team.id, full_name: fullName });

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
