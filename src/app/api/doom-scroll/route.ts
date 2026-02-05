import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest } from "next/server";

const TEAM_ID = "d18014dc-bba2-4980-be27-bdd1fa45f58c";

interface UploadRow {
  id: string;
  created_at: string;
  bucket: string;
  path: string;
  team_id: string;
  player_id: string | null;
  player_name: string | null;
  caption: string | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");
  const limit = before ? 10 : 10; // always 10, max 40 total

  // For doom-scroll, enforce max 40 items total
  if (before) {
    // Check if we already have 30 items (would become 40 with this batch)
    const existingCount = parseInt(searchParams.get("existingCount") || "0");
    if (existingCount >= 30) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
  }

  try {
    // Query uploads directly to get player_name
    const { data: uploads, error: queryError } = await supabaseAdmin
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
      .eq("team_id", TEAM_ID)
      .order("created_at", { ascending: false })
      .limit(50);

    if (queryError) {
      console.error('Uploads query error:', queryError);
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    const uploadCount = uploads?.length || 0;
    console.log(`Doom-scroll: Found ${uploadCount} uploads for team ${TEAM_ID}`);
    
    if (uploads && uploads.length > 0) {
      const firstPaths = uploads.slice(0, 3).map(u => u.path);
      console.log('First 3 paths:', firstPaths);
      
      const firstNames = uploads.slice(0, 3).map(u => u.player_name);
      console.log('First 3 player names:', firstNames);
    }

    // Convert uploads to response format
    const items = (uploads || []).map((upload: UploadRow) => {
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('gym-photos')
        .getPublicUrl(upload.path);
      
      return {
        id: upload.id,
        path: upload.path,
        publicUrl,
        createdAt: upload.created_at,
        name: upload.player_name || "Unknown player",
        caption: upload.caption
      };
    });

    // Apply pagination
    let finalItems = items;
    if (before) {
      const beforeIndex = items.findIndex((item: any) => item.createdAt === before);
      if (beforeIndex >= 0) {
        finalItems = items.slice(beforeIndex + 1, beforeIndex + 1 + limit);
      } else {
        finalItems = items.slice(0, limit);
      }
    } else {
      finalItems = items.slice(0, limit);
    }

    return new Response(JSON.stringify(finalItems), {
      status: 200,
      headers: { "content-type": "application/json" }
    });

  } catch (error) {
    console.error('Doom-scroll error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load uploads' }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
