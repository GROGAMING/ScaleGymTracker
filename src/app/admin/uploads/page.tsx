"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useActiveTeam } from "@/lib/useActiveTeam";
import AdminUploadList from "./upload_list";

type Item = {
  id: string;
  name: string;
  created_at: string;
  path: string;
  publicUrl: string;
};

export default function AdminUploadsPage() {
  const { activeTeamId, loading } = useActiveTeam();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTeamId) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("uploads")
        .select(`
          id,
          created_at,
          bucket,
          path,
          team_id,
          player_id,
          player_name,
          caption
        `)
        .eq("bucket", "gym-photos")
        .eq("team_id", activeTeamId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        setError(error.message);
      } else {
        const itemsData = (data ?? []).map((row: any) => {
          const bucket = row.bucket || 'gym-photos';
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(row.path);
          return {
            id: row.id,
            name: row.player_name || "Unknown player",
            created_at: row.created_at,
            path: row.path,
            publicUrl
          };
        });
        setItems(itemsData);
      }
    };
    load();
  }, [activeTeamId]);

  if (loading) return <main style={{ padding: 20, fontFamily: "system-ui" }}>Loading...</main>;
  if (!activeTeamId) return <main style={{ padding: 20, fontFamily: "system-ui" }}>No team selected.</main>;
  if (error) return <main style={{ padding: 20, fontFamily: "system-ui" }}>{error}</main>;

  return (
    <main style={{ padding: 20, maxWidth: 960, margin: "0 auto", fontFamily: "system-ui" }}>
      <h2>Uploads</h2>
      <AdminUploadList initialItems={items} />
    </main>
  );
}
