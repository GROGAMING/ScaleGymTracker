import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const authed = cookies().get("admin_authed")?.value === "1";
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uploadId } = await req.json();
  if (!uploadId) return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });

  const { data: row, error: rErr } = await supabaseAdmin
    .from("uploads")
    .select("id, bucket, path")
    .eq("id", uploadId)
    .single();

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const { error: sErr } = await supabaseAdmin.storage.from(row.bucket).remove([row.path]);
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  const { error: uErr } = await supabaseAdmin
    .from("uploads")
    .delete()
    .eq("id", uploadId);

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
