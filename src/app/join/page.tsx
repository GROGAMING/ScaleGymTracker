"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isDevMode, setActiveTeam } from "@/lib/devAuth";

export default function JoinPage() {
  const [joinCode, setJoinCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (isDevMode()) {
      // Dev mode: direct team lookup
      const { data: team, error: teamErr } = await supabase
        .from("teams")
        .select("id, name")
        .eq("join_code", joinCode.toUpperCase())
        .eq("join_code_active", true)
        .single();

      if (teamErr || !team) {
        setMessage("Invalid join code");
        return;
      }

      setActiveTeam(team.id, team.name);
      router.push("/");
    } else {
      // Normal mode: require full name and call API
      if (!fullName) {
        setMessage("Full name is required");
        return;
      }

      const res = await fetch("/api/join-team", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ joinCode, fullName }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/");
      } else {
        setMessage(data.error || "Failed to join");
      }
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto", fontFamily: "system-ui" }}>
      <h2>Join a Team</h2>
      <form onSubmit={handleSubmit}>
        {!isDevMode() && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required={!isDevMode()}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />
        )}
        <input
          type="text"
          placeholder="Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          required
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          {isDevMode() ? "Join Team" : "Join Team"}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
