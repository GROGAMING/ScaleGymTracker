import { supabase } from "./supabaseClient";
import { Player } from "@/types/player";

export async function getPlayers(teamId?: string): Promise<Player[]> {
  let query = supabase.from("players").select("id,team_id,name").order("name");
  
  if (teamId) {
    query = query.eq("team_id", teamId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Players query error:', error);
    throw error;
  }
  
  return (data ?? []) as Player[];
}
