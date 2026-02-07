"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function JoinPage() {
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/join-team", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ joinCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Joined team successfully!");
      // Redirect to app
      window.location.href = "/";
    } else {
      setMessage(data.error || "Failed to join");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto", fontFamily: "system-ui" }}>
      <h2>Join a Team</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          required
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Join Team
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
