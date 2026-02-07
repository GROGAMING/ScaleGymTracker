"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState, useEffect, ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useActiveTeam } from "@/lib/useActiveTeam";
import ReportQuota from "@/components/ReportQuota";
import { Player } from "@/types/player";

function dublinMondayWeekStartISO(d: Date): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));

  const utcMidnight = new Date(Date.UTC(year, month - 1, day));
  const dow = utcMidnight.getUTCDay();
  const mondayOffset = (dow + 6) % 7;
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - mondayOffset);
  return utcMidnight.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminReportPage() {
  const { activeTeamId, loading: teamLoading } = useActiveTeam();
  const [dateInWeek, setDateInWeek] = useState(todayISO());

  const weekStart = useMemo(() => dublinMondayWeekStartISO(new Date(dateInWeek)), [dateInWeek]);

  const [weekly, setWeekly] = useState<{ name: string; count: number }[]>([]);
  const [overall, setOverall] = useState<{ name: string; count: number }[]>([]);
  const [users, setUsers] = useState<Player[]>([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    if (!activeTeamId) return;
    setStatus("");
    const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
    const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekEndIso = weekEndDate.toISOString();

    const [w, o, u] = await Promise.all([
      supabase.from('uploads').select('player_name').gte('created_at', weekStart + 'T00:00:00.000Z').lt('created_at', weekEndIso).eq('team_id', activeTeamId),
      supabase.from('uploads').select('player_name').eq('team_id', activeTeamId),
      supabase.from("players").select("id,team_id,name").order("name").eq('team_id', activeTeamId)
    ]);

    if (w.error) {
      console.error('Weekly uploads error:', w.error);
      return setStatus(w.error?.message || "Weekly query failed");
    }
    if (o.error) {
      console.error('Overall uploads error:', o.error);
      return setStatus(o.error?.message || "Overall query failed");
    }
    if (u.error) {
      console.error('Players query error:', u.error);
      return setStatus(u.error?.message || "Players query failed");
    }

    const groupCounts = (data: { player_name: string | null }[]) => {
      const map = new Map<string, number>();
      data.forEach(row => {
        const name = row.player_name || "Unknown player";
        map.set(name, (map.get(name) || 0) + 1);
      });
      return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const weeklyData = groupCounts(w.data ?? []);
    const overallData = groupCounts(o.data ?? []);
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
  };

  useEffect(() => {
    if (activeTeamId) {
      load();
    }
  }, [activeTeamId, weekStart]);

  const weeklyMap = new Map(weekly.map((r: { name: string; count: number }) => [r.name, r.count]));
  const met = users.map((u: { name: string }) => u.name).filter((n: string) => (weeklyMap.get(n) ?? 0) >= 2);
  const notMet = users.map((u: { name: string }) => u.name).filter((n: string) => (weeklyMap.get(n) ?? 0) < 2);

  const handleWeekChange = (v: string) => {
    setDateInWeek(v);
  };

  if (teamLoading) return <div>Loading team...</div>;
  if (!activeTeamId) return <div>No active team</div>;

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
      <h2>Weekly Report</h2>

      <label>Pick any date in the week</label>
      <input
        type="date"
        value={dateInWeek}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleWeekChange(e.target.value)}
        style={{ display: "block", width: "100%", padding: 10, margin: "8px 0 16px" }}
      />

      <p>Week start: <b>{weekStart}</b></p>

      <button
        onClick={() => window.print()}
        style={{ display: "inline-block", padding: "10px 14px", border: "1px solid #ddd", cursor: "pointer" }}
      >
        Print / Save as PDF
      </button>

      {status && <p style={{ color: "red" }}>{status}</p>}

      <div style={{ marginTop: 24 }}>
        <ReportQuota weekly={weekly} overall={overall} users={users} />

        <h3>This week leaderboard</h3>
        <ol>
          {weekly.length === 0 ? (
            <li>No users found.</li>
          ) : (
            weekly.map((r: { name: string; count: number }) => <li key={r.name}>{r.name}: {r.count}</li>)
          )}
        </ol>

        <h3>Overall leaderboard</h3>
        <ol>
          {overall.length === 0 ? (
            <li>No users found.</li>
          ) : (
            overall.map((r: { name: string; count: number }) => <li key={r.name}>{r.name}: {r.count}</li>)
          )}
        </ol>
      </div>

      <style jsx>{`
        @media print {
          button {
            display: none;
          }
          input[type="date"] {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
