import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { friendlyError, supabase } from '../lib/supabase.js';
import { signInWithGoogle, useAuth } from '../lib/auth.jsx';
import { kele } from '../lib/kela.js';
import { BananaBg, ErrorBox, IconSvg, Loading, TopBar, useTitle } from '../components/ui.jsx';

export default function RealmInvite() {
  useTitle('Join a realm');
  const { code } = useParams();
  const { ready, session, profile } = useAuth();
  const nav = useNavigate();
  const [realm, setRealm] = useState(undefined);
  const [joinedId, setJoinedId] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc('realm_preview', { p_code: code }).then(({ data, error }) => {
      if (error) setErr(friendlyError(error));
      setRealm(data || null);
    });
  }, [code, session]);

  async function join() {
    setErr('');
    if (!session) return signInWithGoogle(`/r/${code}`);
    if (!profile) return nav(`/setup?next=${encodeURIComponent(`/r/${code}`)}`);
    setBusy(true);
    const { data, error } = await supabase.rpc('join_realm', { p_code: code });
    setBusy(false);
    if (error) return setErr(friendlyError(error));
    setJoinedId(data);
  }

  if (realm === undefined || !ready) return <Loading />;

  if (!realm) {
    return (
      <div className="screen">
        <TopBar back="/join" />
        <div className="content">
          <h1 className="h1">No realm found</h1>
          <p className="body">Nothing matches the code <b>{code}</b>. Check it with whoever sent it.</p>
          <Link className="btn white" to="/join">Try another code</Link>
        </div>
      </div>
    );
  }

  if (joinedId) {
    return (
      <div className="screen" style={{ background: 'var(--banana)' }}>
        <TopBar />
        <div className="content" style={{ justifyContent: 'center', gap: 22, background: 'var(--banana)' }}>
          <div className="head" style={{ fontSize: 56, lineHeight: 0.9, letterSpacing: -2, transform: 'rotate(-3deg)' }}>WELCOME<br />TO THE<br />REALM!</div>
          <div className="card shadow col gap6" style={{ padding: 16 }}>
            <div className="label">Your counter</div>
            <div className="row gap8" style={{ alignItems: 'baseline' }}><span className="head" style={{ fontSize: 56, lineHeight: 0.9 }}>0</span><span className="head" style={{ fontSize: 18 }}>KELE</span></div>
            <div className="small">Clean so far. Let's see how long that lasts.</div>
          </div>
          <Link className="btn black" to={`/realm/${joinedId}`}>Open {realm.name}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <BananaBg opacity={0.1} />
      <TopBar back="/join" />
      <div className="content" style={{ gap: 12 }}>
        <div className="card yellow shadow col gap6" style={{ position: 'relative', padding: 14 }}>
          <div className="sticker pink">aur khao kele</div>
          <div className="small">YOU'RE INVITED // CODE {realm.code}</div>
          <h1 className="h1" style={{ fontSize: 34, letterSpacing: 0 }}>{realm.name}</h1>
          <div className="small">CREATED BY {String(realm.created_by || '').toUpperCase()}</div>
        </div>

        <div className="grid3" style={{ gap: 8 }}>
          <div className="col" style={{ border: '3px solid #000', background: '#000', color: 'var(--banana)', padding: 8, gap: 2 }}>
            <div className="head" style={{ fontSize: 28, lineHeight: 0.95 }}>{kele(realm.kele_half)}</div><div className="tiny" style={{ fontSize: 9 }}>KELE EATEN</div>
          </div>
          <div className="card col" style={{ padding: 8, gap: 2 }}>
            <div className="head" style={{ fontSize: 28, lineHeight: 0.95 }}>{realm.member_count}</div><div className="tiny" style={{ fontSize: 9 }}>MEMBERS</div>
          </div>
          <div className="card col" style={{ padding: 8, gap: 2 }}>
            <div className="head" style={{ fontSize: 28, lineHeight: 0.95 }}>{realm.weeks_old}</div><div className="tiny" style={{ fontSize: 9 }}>WEEKS OLD</div>
          </div>
        </div>

        <div className="card row gap10" style={{ padding: '10px 12px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true"><path d="M3 18h18l-1.5-10-4.5 4-3-7-3 7-4.5-4z" /></svg>
          <div className="small grow">CURRENT KELA SULTAN</div>
          <div className="head" style={{ fontSize: 16 }}>{realm.sultan ? `${realm.sultan.name.toUpperCase()} // ${kele(realm.sultan.half)}` : 'VACANT'}</div>
        </div>

        <div className="col gap6">
          <div className="small" style={{ letterSpacing: 1 }}>WHO'S IN</div>
          <div className="grid2" style={{ gap: 8 }}>
            {realm.members.map((m, i) => (
              <div key={i} className="card row gap8" style={{ padding: 6 }}>
                <div className="avatar" style={{ width: 32, height: 32, borderWidth: 2, background: m.color }}><IconSvg icon={m.icon} size={18} /></div>
                <div className="upper" style={{ fontSize: 12, fontWeight: 700 }}>{m.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card dashed tiny col gap6" style={{ background: 'var(--paper)', lineHeight: 1.4 }}>
          <div className="small" style={{ letterSpacing: 1 }}>HOUSE RULES</div>
          <div>// Leaderboard resets Monday 12:00 AM PKT</div>
          <div>// Barra kela needs 1 confirmation</div>
          <div>// More than 3 reports an hour = 15 min cooldown</div>
        </div>

        <ErrorBox>{err}</ErrorBox>
        <div className="spacer" />
        {realm.is_member ? (
          <Link className="btn" to={`/realm/${realm.id}`}>Open realm</Link>
        ) : (
          <button className="btn" onClick={join} disabled={busy}>{busy ? 'Joining…' : session ? 'Join up' : 'Sign in & join up'}</button>
        )}
      </div>
    </div>
  );
}
