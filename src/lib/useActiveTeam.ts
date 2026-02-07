import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useActiveTeam() {
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('active_team_id')
        .eq('user_id', session.user.id)
        .single();
      setActiveTeamId(data?.active_team_id || null);
      setLoading(false);
    };
    getProfile();
  }, []);

  return { activeTeamId, loading };
}
