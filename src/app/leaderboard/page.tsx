"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { mondayWeekStartISO } from "@/lib/week";
import { useActiveTeam } from "@/lib/useActiveTeam";
import { Player } from "@/types/player";
import MetQuotaTick from "@/components/MetQuotaTick";

type Row = { name: string; count: number };

function groupCounts(data: { player_name: string | null }[]): Row[] {
  const map = new Map<string, number>();
  data.forEach(row => {
    const name = row.player_name || "Unknown player";
    map.set(name, (map.get(name) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default function LeaderboardPage() {
  const { activeTeamId, loading: teamLoading } = useActiveTeam();
  const weekStart = useMemo(() => mondayWeekStartISO(new Date()), []);
  const [weekly, setWeekly] = useState<Row[]>([]);
  const [overall, setOverall] = useState<Row[]>([]);
  const [users, setUsers] = useState<Player[]>([]);
  const [status, setStatus] = useState("");


  useEffect(() => {
    if (!activeTeamId) return;
    (async () => {
      setStatus("");

      const [weeklyUploads, overallUploads, u] = await Promise.all([
        supabase.from("uploads").select("player_name").gte("created_at", weekStart).eq("team_id", activeTeamId),
        supabase.from("uploads").select("player_name").eq("team_id", activeTeamId),
        supabase.from("players").select("id,team_id,name").order("name").eq("team_id", activeTeamId)
      ]);

      if (weeklyUploads.error || overallUploads.error || u.error) {
        const err = weeklyUploads.error || overallUploads.error || u.error;
        console.error('Query error:', err);
        return setStatus(err?.message ?? "Unknown error");
      }

      const weeklyData = groupCounts(weeklyUploads.data || []);
      const overallData = groupCounts(overallUploads.data || []);
      const allUsers = (u.data ?? []) as Player[];
      
      setUsers(allUsers);
      
      // Merge weekly data with all users (show 0 for users with no sessions)
      const weeklyMap = new Map(weeklyData.map(r => [r.name, r.count]));
      const weeklyWithAll = allUsers.map(user => ({
        name: user.name,
        count: weeklyMap.get(user.name) ?? 0
      })).sort((a, b) => b.count - a.count);
      
      // Merge overall data with all users (show 0 for users with no sessions)
      const overallMap = new Map(overallData.map(r => [r.name, r.count]));
      const overallWithAll = allUsers.map(user => ({
        name: user.name,
        count: overallMap.get(user.name) ?? 0
      })).sort((a, b) => b.count - a.count);
      
      setWeekly(weeklyWithAll);
      setOverall(overallWithAll);
    })();
  }, [weekStart, activeTeamId]);

  if (teamLoading) return <div>Loading...</div>;
  if (!activeTeamId) return <div>No team selected</div>;

  return (
    <main style={{ padding: 20, maxWidth: 520, margin: "0 auto", fontFamily: "system-ui" }}>
      <h2>Leaderboards</h2>

      <h3>This week (starting {weekStart})</h3>
      <ol>
        {weekly.map((r) => (
          <li key={r.name}>
            {r.name}: {r.count}
            <MetQuotaTick weeklyCount={r.count} />
          </li>
        ))}
      </ol>

      <h3>Overall</h3>
      <ol>
        {overall.map((r) => (
          <li key={r.name}>{r.name}: {r.count}</li>
        ))}
      </ol>

      {status && <p>{status}</p>}
    </main>
  );
}
