"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { DEV_BYPASS, isDevMode, setDevUser, getActiveTeamId } from "@/lib/devAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
      {message && <p>{message}</p>}
    </div>
  );
}
