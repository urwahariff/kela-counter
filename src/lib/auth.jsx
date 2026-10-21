import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase.js';
import { Loading } from '../components/ui.jsx';

const AuthCtx = createContext(null);
const NEXT_KEY = 'kela_next';

export function rememberNext(path) {
  try { localStorage.setItem(NEXT_KEY, path); } catch { /* storage blocked */ }
}
export function takeNext() {
  try {
    const v = localStorage.getItem(NEXT_KEY);
    localStorage.removeItem(NEXT_KEY);
    return v;
  } catch { return null; }
}

export async function signInWithGoogle(nextPath) {
  if (nextPath) rememberNext(nextPath);
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth` }
  });
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [profile, setProfile] = useState(undefined);

  const loadProfile = useCallback(async (s) => {
    if (!s) { setProfile(null); return null; }
    const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle();
    setProfile(data || null);
    return data || null;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadProfile(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = {
    session,
    user: session?.user || null,
    profile,
    ready: session !== undefined && (session === null || profile !== undefined),
    refreshProfile: () => loadProfile(session),
    signOut: () => supabase.auth.signOut()
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

// Signed in AND has a profile, otherwise send them where they need to go
export function RequireProfile({ children }) {
  const { ready, session, profile } = useAuth();
  const loc = useLocation();
  if (!ready) return <Loading />;
  if (!session) {
    rememberNext(loc.pathname);
    return <Navigate to="/" replace />;
  }
  if (!profile) return <Navigate to={`/setup?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}
