import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { friendlyError, supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { daysToReset, kele, BANANA_PATH } from '../lib/kela.js';
import { Avatar, BottomNav, ErrorBox, Loading, TopBar, useEscape, useTitle } from '../components/ui.jsx';

export default function Home() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [realms, setRealms] = useState(null);
  const [err, setErr] = useState('');
  const [picker, setPicker] = useState(false);
  const closePicker = useCallback(() => setPicker(false), []);
  useEscape(picker, closePicker);
  useTitle('Your realms');

  useEffect(() => {
    supabase.rpc('my_realms').then(({ data, error }) => {
      if (error) setErr(friendlyError(error));
      setRealms(data || []);
    });
  }, []);

  if (!realms) return <Loading />;
  const pending = realms.reduce((n, r) => n + (r.pending_for_me || 0), 0);
  const avatar = <Link to="/me" aria-label="My profile"><Avatar person={profile} size={36} border={2} iconSize={20} /></Link>;

  function onKela() {
    if (realms.length === 1) nav(`/realm/${realms[0].realm_id}/report`);
    else setPicker(true);
  }

  if (realms.length === 0) {
    return (
      <div className="screen wide">
        <TopBar right={avatar} nav={{ active: 'realms', kelaDisabled: true }} />
        <div className="content withnav">
          <h1 className="h1">Your<br />realms</h1>
          <ErrorBox>{err}</ErrorBox>
          <div className="card dashed col emptyrealms" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center', minHeight: 300 }}>
            <svg aria-hidden="true" width="140" height="140" viewBox="0 0 24 24" style={{ transform: 'rotate(-20deg)' }}>
              <g transform="translate(0.9 0.9)"><path d={BANANA_PATH} fill="#000" /></g>
              <path d={BANANA_PATH} fill="#FFE135" stroke="#000" strokeWidth="0.9" strokeLinejoin="round" />
            </svg>
            <div className="h2" style={{ fontSize: 30 }}>No realms yet</div>
            <div className="small" style={{ maxWidth: 250 }}>Nobody to roast. Start one for your group, or join with a code.</div>
          </div>
          <div className="homeactions">
            <Link className="btn" to="/create">Start a realm</Link>
            <Link className="btn white" to="/join">Join with a code</Link>
          </div>
        </div>
        <BottomNav active="realms" kelaDisabled />
      </div>
    );
  }

  return (
    <div className="screen wide">
      <TopBar right={avatar} nav={{ active: 'realms', onKela }} />
      <div className="content withnav" style={{ gap: 14 }}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <h1 className="h1">Your<br />realms</h1>
          <div className="tiny" style={{ textAlign: 'right', lineHeight: 1.4 }}>RESET MONDAY<br />{daysToReset()} DAYS LEFT</div>
        </div>

        <ErrorBox>{err}</ErrorBox>

        {pending > 0 && (
          <div className="row between gap8" style={{ background: 'var(--pink)', border: '3px solid #000', padding: '8px 10px' }}>
            <div className="small">{pending} {pending === 1 ? 'KELA NEEDS' : 'KELE NEED'} YOUR CONFIRMATION</div>
            <Link to={`/realm/${realms.find((r) => r.pending_for_me > 0).realm_id}`} className="tiny" style={{ background: '#000', color: 'var(--banana)', padding: '4px 8px', textDecoration: 'none' }}>REVIEW</Link>
          </div>
        )}

        <div className="realmgrid">
        {realms.map((r) => (
          <Link key={r.realm_id} to={`/realm/${r.realm_id}`} className="col gap10 realmcard" style={{ position: 'relative', border: '3px solid #000', background: r.color, boxShadow: '5px 5px 0 #000', padding: 12, textDecoration: 'none', color: '#000' }}>
            {r.i_lead && <div className="sticker">YOU'RE THE SULTAN</div>}
            <div className="row between gap8">
              <div className="head upper" style={{ fontSize: 22, lineHeight: 1 }}>{r.name}</div>
              {r.pending_for_me > 0 && <div className="tag pink">{r.pending_for_me} PENDING</div>}
            </div>
            <div className="row between gap8">
              <div className="row">
                {(r.member_colors || []).map((c, i) => <div key={i} style={{ width: 28, height: 28, marginRight: -6, border: '2px solid #000', background: c }} />)}
                <div className="tiny" style={{ marginLeft: 12 }}>{r.member_count} MEMBERS</div>
              </div>
              <div className="row gap6" style={{ alignItems: 'baseline' }}>
                <div className="tiny">YOU</div>
                <div className="head" style={{ fontSize: 22, lineHeight: 1 }}>#{r.my_rank}</div>
              </div>
            </div>
            <div className="row between tiny" style={{ borderTop: '2px solid #000', paddingTop: 8 }}>
              <span>{r.leader_name ? `LEADER: ${r.leader_name.toUpperCase()} (${kele(r.leader_half)})` : 'QUIET THIS WEEK'}</span>
              <span>YOU: {kele(r.my_week_half)} KELE</span>
            </div>
          </Link>
        ))}
        </div>

        <div className="homeactions">
          <Link className="btn white sm" style={{ boxShadow: 'none', minHeight: 52 }} to="/join">Join a realm</Link>
          <Link className="btn dashed sm" style={{ minHeight: 52, fontSize: 14 }} to="/create">+ Create one</Link>
        </div>
      </div>

      <BottomNav active="realms" onKela={onKela} />

      {picker && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setPicker(false)}>
          <div role="dialog" aria-label="Pick a realm" className="sheet">
            <div className="h2" style={{ fontSize: 26 }}>Which realm?</div>
            <div className="small">Who ate the kela, and where?</div>
            {realms.map((r) => (
              <Link key={r.realm_id} to={`/realm/${r.realm_id}/report`} className="row between" style={{ height: 56, border: '3px solid #000', background: '#fff', boxShadow: '4px 4px 0 #000', padding: '0 14px', textDecoration: 'none' }}>
                <span className="head upper" style={{ fontSize: 17 }}>{r.name}</span>
                <span className="tiny">{r.member_count} MEMBERS</span>
              </Link>
            ))}
            <button className="btn black sm" onClick={() => setPicker(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
