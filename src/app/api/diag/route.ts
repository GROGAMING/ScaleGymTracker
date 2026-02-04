import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const TEAM_ID = "d18014dc-bba2-4980-be27-bdd1fa45f58c";

export async function GET(request: NextRequest) {
  let listCount = 0;
  
  try {
    // Test storage listing
    const { data: files, error } = await supabaseAdmin.storage
      .from('gym-photos')
      .list(TEAM_ID, { limit: 1 });
    
    if (!error && files) {
      listCount = files.length;
    }
  } catch (err) {
    console.error('Storage list error in diag:', err);
  }

  const diagnostics = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: 'gym-photos',
    prefix: TEAM_ID,
    listCount,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(diagnostics);
}
