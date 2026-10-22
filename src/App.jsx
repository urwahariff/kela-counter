import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { configured } from './lib/supabase.js';
import { AuthProvider, RequireProfile, takeNext, useAuth } from './lib/auth.jsx';
import { Loading } from './components/ui.jsx';
import Landing from './pages/Landing.jsx';
import Home from './pages/Home.jsx';

// Every other screen is downloaded only when it's opened
const JoinCode = lazy(() => import('./pages/JoinCode.jsx'));
const RealmInvite = lazy(() => import('./pages/RealmInvite.jsx'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup.jsx'));
const CreateRealm = lazy(() => import('./pages/CreateRealm.jsx'));
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'));
const Report = lazy(() => import('./pages/Report.jsx'));
const MyProfile = lazy(() => import('./pages/MyProfile.jsx'));
const Privacy = lazy(() => import('./pages/Legal.jsx').then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Legal.jsx').then((m) => ({ default: m.Terms })));

function AuthReturn() {
  const { ready, session, profile } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!ready) return;
    const next = takeNext() || '/';
    if (!session) nav('/', { replace: true });
    else if (!profile && !next.startsWith('/r/')) nav(`/setup?next=${encodeURIComponent(next)}`, { replace: true });
    else nav(next, { replace: true });
  }, [ready, session, profile, nav]);
  return <Loading label="Signing you in…" />;
}

function Root() {
  const { ready, session } = useAuth();
  if (!ready) return <Loading />;
  return session ? <RequireProfile><Home /></RequireProfile> : <Landing />;
}

function NotConfigured() {
  return (
    <div className="screen pad">
      <h1 className="h1">Almost there</h1>
      <p className="body">
        The app can't find its Supabase keys. Add <code>VITE_SUPABASE_URL</code> and{' '}
        <code>VITE_SUPABASE_ANON_KEY</code> (see the README), then reload.
      </p>
    </div>
  );
}

export default function App() {
  if (!configured) return <NotConfigured />;
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/auth" element={<AuthReturn />} />
        <Route path="/r/:code" element={<RealmInvite />} />
        <Route path="/join" element={<JoinCode />} />
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="/create" element={<RequireProfile><CreateRealm /></RequireProfile>} />
        <Route path="/realm/:id" element={<RequireProfile><Leaderboard /></RequireProfile>} />
        <Route path="/realm/:id/report" element={<RequireProfile><Report /></RequireProfile>} />
        <Route path="/me" element={<RequireProfile><MyProfile /></RequireProfile>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<Root />} />
      </Routes>
      </Suspense>
    </AuthProvider>
  );
}
