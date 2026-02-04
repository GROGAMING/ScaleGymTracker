import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest } from "next/server";

const TEAM_ID = "d18014dc-bba2-4980-be27-bdd1fa45f58c";

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
    // Query uploads with player join
    let query = supabaseAdmin
      .from("uploads")
      .select(`
        id, 
        created_at, 
        bucket, 
        path, 
        team_id, 
        player_id,
        caption,
        players!inner(name)
      `)
      .eq("bucket", "gym-photos")
      .eq("team_id", TEAM_ID)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: uploads, error: queryError } = await query;

    if (queryError) {
      console.error('Uploads query error:', queryError);
      // Fallback to storage listing if query fails
      return await getFromStorage();
    }

    const uploadCount = uploads?.length || 0;
    console.log(`Doom-scroll: Found ${uploadCount} uploads with player names for team ${TEAM_ID}`);
    
    if (uploads && uploads.length > 0) {
      const firstPaths = uploads.slice(0, 3).map(u => u.path);
      console.log('First 3 paths:', firstPaths);
      
      const firstNames = uploads.slice(0, 3).map(u => u.players?.name);
      console.log('First 3 player names:', firstNames);
    }

    // Convert uploads to response format
    const items = (uploads || []).map((upload: any) => {
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('gym-photos')
        .getPublicUrl(upload.path);
      
      return {
        id: upload.id,
        path: upload.path,
        publicUrl,
        createdAt: upload.created_at,
        name: upload.players?.name || "Unknown Player",
        caption: upload.caption
      };
    });

    // Apply pagination
    let finalItems = items;
    if (before) {
      const beforeIndex = items.findIndex(item => item.createdAt === before);
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
    console.error('Doom-scroll error, falling back to storage:', error);
    return await getFromStorage();
  }

  // Fallback function to get from storage
  async function getFromStorage() {
    try {
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('gym-photos')
        .list(TEAM_ID, { 
          limit: 50, 
          sortBy: { column: 'updated_at', order: 'desc' } 
        });

      if (listError) {
        console.error('Storage list error:', listError);
        return new Response(JSON.stringify({ error: listError.message }), {
          status: 500,
          headers: { "content-type": "application/json" }
        });
      }

      const fileCount = files?.length || 0;
      console.log(`Doom-scroll: Fallback - Found ${fileCount} files in storage for team ${TEAM_ID}`);
      
      const items = (files || []).map((file: any) => {
        const fullPath = `${TEAM_ID}/${file.name}`;
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('gym-photos')
          .getPublicUrl(fullPath);
        
        return {
          id: file.name,
          path: fullPath,
          publicUrl,
          createdAt: file.created_at,
          name: "Unknown Player",
          caption: null
        };
      });

      let finalItems = items.slice(0, limit);
      return new Response(JSON.stringify(finalItems), {
        status: 200,
        headers: { "content-type": "application/json" }
      });

    } catch (fallbackError) {
      console.error('Storage fallback error:', fallbackError);
      return new Response(JSON.stringify({ error: 'Failed to load from storage' }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }
  }
}
