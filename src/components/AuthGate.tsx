"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isDevMode } from "@/lib/devAuth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAccess = async () => {
      // Allow dev mode
      if (isDevMode()) {
        setAllowed(true);
        setLoading(false);
        return;
      }

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      const publicPaths = ['/login', '/join', '/onboarding', '/auth'];
      const isPublic = publicPaths.some(path => pathname.startsWith(path));

      if (isPublic) {
        setAllowed(true);
      } else if (!session) {
        router.replace('/login');
        return;
      } else {
        // Check if user has team (simplified, could check profiles here)
        setAllowed(true);
      }

      setLoading(false);
    };

    checkAccess();
  }, [router, pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!allowed) {
    return <div>Redirecting...</div>;
  }

  return <>{children}</>;
}
