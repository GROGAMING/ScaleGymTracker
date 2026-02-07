// Dev mode helpers for testing without email auth
// Guarded by NEXT_PUBLIC_DEV_BYPASS=true

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';

export const isDevMode = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('dev_mode') === '1';
};

export const getDevUserId = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dev_user_id');
};

export const getDevRole = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dev_role');
};

export const getActiveTeamId = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('active_team_id');
};

export const getTeamName = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('team_name');
};

export const setDevUser = (role: 'admin' | 'member' = 'admin') => {
  if (typeof window === 'undefined') return;
  const userId = crypto.randomUUID();
  localStorage.setItem('dev_mode', '1');
  localStorage.setItem('dev_user_id', userId);
  localStorage.setItem('dev_role', role);
};

export const setActiveTeam = (teamId: string, teamName: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('active_team_id', teamId);
  localStorage.setItem('team_name', teamName);
};

export const clearDevMode = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dev_mode');
  localStorage.removeItem('dev_user_id');
  localStorage.removeItem('dev_role');
  localStorage.removeItem('active_team_id');
  localStorage.removeItem('team_name');
};

export const isAdmin = () => {
  return getDevRole() === 'admin';
};

export { DEV_BYPASS };
