import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isDevMode, getActiveTeamId } from '@/lib/devAuth';

export function useActiveTeam() {
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTeamId = async () => {
      if (isDevMode()) {
        setActiveTeamId(getActiveTeamId());
        setLoading(false);
        return;
      }

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
    getTeamId();
  }, []);

  return { activeTeamId, loading };
}
