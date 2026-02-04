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
    // List files directly from storage
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
    console.log(`Doom-scroll: Found ${fileCount} files in storage for team ${TEAM_ID}`);
    
    if (files && files.length > 0) {
      const firstPaths = files.slice(0, 3).map(f => `${TEAM_ID}/${f.name}`);
      console.log('First 3 full paths:', firstPaths);
      
      const firstUrls = firstPaths.map(path => 
        supabaseAdmin.storage.from('gym-photos').getPublicUrl(path).data.publicUrl
      );
      console.log('First 3 URLs:', firstUrls);
    }

    // Convert storage files to response format
    const items = (files || []).map((file: any) => {
      const fullPath = `${TEAM_ID}/${file.name}`;
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('gym-photos')
        .getPublicUrl(fullPath);
      
      return {
        id: file.name, // Use filename as ID
        path: fullPath,
        publicUrl,
        createdAt: file.created_at,
        name: "Apostles Member",
        caption: null
      };
    });

    // Apply pagination if needed
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
    console.error('Doom-scroll storage error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load from storage' }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
