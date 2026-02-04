import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");
  const teamId = "d18014dc-bba2-4980-be27-bdd1fa45f58c";
  const limit = before ? 50 : 50; // always 50

  let query = supabaseAdmin
    .from("uploads")
    .select("id, created_at, bucket, path, team_id, caption")
    .eq("bucket", "gym-photos")
    .like("path", `${teamId}/%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Admin uploads-more query error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  console.log(`Admin uploads-more: Found ${data?.length || 0} rows for team ${teamId}`);
  if (data && data.length > 0) {
    console.log('First row:', { bucket: data[0].bucket, path: data[0].path });
  }

  const items = (data ?? []).map((row: any) => {
    const bucket = row.bucket || 'gym-photos';
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(row.path);
    return {
      id: row.id,
      name: "Apostles Member", // Since we don't have player join, use generic name
      created_at: row.created_at,
      image_path: row.path,
      publicUrl,
      caption: row.caption || null
    };
  });

  return new Response(JSON.stringify(items), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
