"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useActiveTeam } from "@/lib/useActiveTeam";
import { Player } from "@/types/player";

export default function UploadPage() {
  const router = useRouter();
  const { activeTeamId, loading: teamLoading } = useActiveTeam();
  const [users, setUsers] = useState<Player[]>([]);
  const [userId, setUserId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);


  useEffect(() => {
    if (!activeTeamId) return;
    (async () => {
      const { data, error } = await supabase.from("players").select("id,team_id,name").order("name").eq("team_id", activeTeamId);
      if (error) {
        console.error('Players query error:', error);
        setStatus(error.message);
      } else {
        setUsers((data ?? []) as Player[]);
      }
    })();
  }, [activeTeamId]);

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));

        const { width, height } = img;
        const longest = Math.max(width, height);
        const scale = longest > 600 ? 600 / longest : 1;
        canvas.width = width * scale;
        canvas.height = height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            const compressed = new File([blob], "capture.jpg", { type: "image/jpeg" });
            resolve(compressed);
          },
          "image/jpeg",
          0.7
        );
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function onSubmit(selectedFile?: File | null) {
    if (uploading || !activeTeamId) return;

    setStatus("");
    if (!userId) return setStatus("Select your name.");

    const f = selectedFile ?? file;
    if (!f) return setStatus("Take a photo.");

    setUploading(true);
    try {
      setStatus("Compressing photo...");
      const fileToUpload = await compressImage(f).catch(() => f); // fallback to original

      setStatus("Uploading...");
      const ext = (fileToUpload.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${activeTeamId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("gym-photos")
        .upload(path, fileToUpload, { 
          upsert: false, 
          contentType: fileToUpload.type,
          cacheControl: 'public, max-age=31536000, immutable'
        });

      if (upErr) return setStatus(upErr.message);

      // Try to insert into uploads table, but don't block if it fails
      try {
        // Get the selected player's name from the dropdown
        const selectedPlayer = users.find(u => u.id === userId);
        const playerName = selectedPlayer?.name || null;
        
        await supabase.from("uploads").insert({
          bucket: "gym-photos",
          path: path,
          team_id: activeTeamId,
          player_id: userId,
          player_name: playerName
        });
      } catch (dbError) {
        console.warn('Database insert failed (upload still succeeded):', dbError);
        // Don't fail the upload if DB insert fails
      }

      setFile(null);
      setStatus("Uploaded.");
      window.alert("Uploaded! Go to Leaderboard.");
      router.push("/leaderboard");
    } finally {
      setUploading(false);
    }
  }

  if (teamLoading) return <div>Loading...</div>;
  if (!activeTeamId) return <div>No team selected</div>;

  return (
    <main style={{ padding: 20, maxWidth: 520, margin: "0 auto", fontFamily: "system-ui" }}>
      <h2>Upload</h2>
      <label>Name</label>
      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ display: "block", width: "100%", padding: 10, margin: "8px 0 16px" }}
        disabled={false}
      >
        <option value="">Select</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>

      <label>Photo (camera)</label>
      <label
        htmlFor={userId ? "photo" : undefined}
        onClick={(e: MouseEvent<HTMLLabelElement>) => {
          if (!userId) {
            e.preventDefault();
            setStatus("Select your name.");
          }
        }}
        style={{
          display: "inline-block",
          padding: "10px 14px",
          margin: "8px 0 16px",
          border: "1px solid #ccc",
          borderRadius: 4,
          cursor: uploading || !userId ? "not-allowed" : "pointer",
          opacity: uploading || !userId ? 0.6 : 1
        }}
      >
        Take photo
      </label>
      <input
        id="photo"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          if (f && userId && !uploading) void onSubmit(f);
        }}
        style={{ display: "none" }}
        disabled={uploading}
      />

      <button onClick={() => onSubmit()} style={{ padding: "10px 14px" }} disabled={uploading}>
        Upload
      </button>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </main>
  );
}
