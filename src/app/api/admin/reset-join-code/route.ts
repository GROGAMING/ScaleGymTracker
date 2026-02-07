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

  const { teamId } = await req.json();
  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
  }

  // Check if user is admin of the team
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", session.user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Generate new join code
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

  // Update team
  const { error: updateErr } = await supabase
    .from("teams")
    .update({ join_code: joinCode })
    .eq("id", teamId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ joinCode });
}
