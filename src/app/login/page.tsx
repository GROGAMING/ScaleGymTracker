"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { DEV_BYPASS, isDevMode, setDevUser, getActiveTeamId } from "@/lib/devAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createdTeamId, setCreatedTeamId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session || isDevMode()) {
        if (getActiveTeamId()) {
          router.push("/");
        } else {
          router.push("/join");
        }
      }
    };
    checkSession();
  }, [router]);

  const handleSkipLogin = () => {
    console.log("SKIP CLICKED");
    console.log("origin", window.location.origin);
    document.cookie = "dev_mode=1; path=/; samesite=lax";
    document.cookie = "active_team_id=d18014dc-bba2-4980-be27-bdd1fa45f58c; path=/; samesite=lax";
    window.location.assign("/");
  };

  const handleCreateTeam = async () => {
    try {
      const res = await fetch('/api/admin/create-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName })
      });
      const data = await res.json();
      if (res.ok) {
        setJoinCode(data.joinCode);
        setCreatedTeamId(data.teamId);
        if (isDevMode()) {
          localStorage.setItem('active_team_id', data.teamId);
          router.replace('/');
        }
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage('Error creating team');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link.");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto", fontFamily: "system-ui" }}>
      <h2>Login / Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Send Magic Link
        </button>
      </form>
      <button
        onClick={handleSkipLogin}
        style={{ width: "100%", padding: 10, marginTop: 10, backgroundColor: "#f0f0f0" }}
      >
        Skip login (TESTING)
      </button>
      <hr />
      <h3>Create Team</h3>
      <input
        type="text"
        placeholder="Team Name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />
      <button onClick={handleCreateTeam} style={{ width: "100%", padding: 10 }}>Create Team</button>
      {joinCode && (
        <div>
          <p>Join Code: {joinCode} <button onClick={() => navigator.clipboard.writeText(joinCode)}>Copy</button></p>
          <p>Team ID: {createdTeamId}</p>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}
