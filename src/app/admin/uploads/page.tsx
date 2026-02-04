import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminUploadList from "./upload_list";

type Item = {
  id: string;
  name: string;
  created_at: string;
  image_path: string;
  publicUrl: string;
};

export default async function AdminUploadsPage() {
  const authed = cookies().get("admin_authed")?.value === "1";
  if (!authed) {
    return <main style={{ padding: 20, fontFamily: "system-ui" }}>Not logged in.</main>;
  }

  const teamId = "d18014dc-bba2-4980-be27-bdd1fa45f58c";
  const { data, error } = await supabaseAdmin
    .from("uploads")
    .select("id, created_at, bucket, path, team_id, caption")
    .eq("bucket", "gym-photos")
    .or(`team_id.eq.${teamId},path.like.${teamId}/%`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error('Admin uploads query error:', error);
    return <main style={{ padding: 20, fontFamily: "system-ui" }}>{error.message}</main>;
  }

  if (!data || data.length === 0) {
    console.log('Admin uploads: No uploads found for team', teamId);
  }

  const items: Item[] = (data ?? []).map((row: any) => {
    const bucket = row.bucket || 'gym-photos';
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(row.path);
    return {
      id: row.id,
      name: "Apostles Member", // Since we don't have player join, use generic name
      created_at: row.created_at,
      image_path: row.path,
      publicUrl
    };
  });

  return (
    <main style={{ padding: 20, maxWidth: 960, margin: "0 auto", fontFamily: "system-ui" }}>
      <h2>Uploads</h2>
      <AdminUploadList initialItems={items} />
    </main>
  );
}
