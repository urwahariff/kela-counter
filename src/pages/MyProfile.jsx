import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { dayLabel, HISTORY_LABELS, keleStamp, splitKele } from '../lib/kela.js';
import { Avatar, Banana, BottomNav, Loading, TopBar, useTitle } from '../components/ui.jsx';

function Stat({ half, number, label, dark }) {
  const s = half !== undefined ? splitKele(half) : { whole: String(number), frac: '' };
  return (
    <div className="col gap6" style={{ border: '3px solid #000', background: dark ? '#000' : '#fff', color: dark ? 'var(--banana)' : '#000', padding: '10px 8px' }}>
      <span className="score" style={{ fontSize: 36 }}>{s.whole}<span style={{ fontSize: 18 }}>{s.frac}</span></span>
      <div style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'pre-line' }}>{label}</div>
    </div>
  );
}

export default function MyProfile() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState('week');
  useTitle('My profile');

  useEffect(() => {
    Promise.all([supabase.rpc('my_stats'), supabase.rpc('my_history')]).then(([s, h]) => {
      setStats(s.data || {}); setHistory(h.data || []);
    });
  }, []);

  if (!stats) return <Loading />;
  const since = stats.last_kela_at || stats.joined_at;
  const daysFree = since ? Math.floor((Date.now() - new Date(since)) / 86400000) : 0;
  const list = range === 'week' ? history.filter((h) => h.this_week) : history;

  return (
    <div className="screen mid">
      <TopBar right={<Link to="/setup" className="topchip">EDIT</Link>} nav={{ active: 'me' }} />
      <div className="content withnav" style={{ gap: 14 }}>
       <div className="profgrid">
        <div className="col" style={{ gap: 14, minWidth: 0 }}>
        <div className="card yellow shadow row gap14" style={{ padding: 14 }}>
          <div style={{ transform: 'rotate(-3deg)' }}><Avatar person={profile} size={80} iconSize={48} /></div>
          <div className="col gap6 grow minw0">
            <h1 className="h1" style={{ fontSize: 32, letterSpacing: 0 }}>{profile.name}</h1>
            <div className="small">IN {stats.realm_count} {stats.realm_count === 1 ? 'REALM' : 'REALMS'} // LEADING {stats.leading_count}</div>
            {stats.mature && <div className="tag" style={{ alignSelf: 'flex-start', fontSize: 10 }}>MATURE</div>}
          </div>
        </div>

        <div className="grid3">
          <Stat dark half={stats.week_best_half} label={`THIS WEEK\n${stats.week_best_realm ? `TOP: ${stats.week_best_realm.toUpperCase()}` : 'ALL CLEAN'}`} />
          <Stat half={stats.all_time_half} label={'ALL TIME\nALL REALMS'} />
          <Stat number={daysFree} label={'DAYS\nKELA-FREE'} />
        </div>

        <div className="col gap8">
          <div className="label">Badges</div>
          <div className="grid2">
            <div className="col" style={{ border: stats.mature ? '3px solid #000' : '3px dashed #000', background: stats.mature ? 'var(--green)' : 'var(--off)', color: stats.mature ? '#000' : 'var(--quiet)', padding: '8px 10px', gap: 2, transform: stats.mature ? 'rotate(-1deg)' : 'none' }}>
              <div className="head" style={{ fontSize: 15 }}>MATURE</div>
              <div className="tiny">{stats.mature ? 'Owned up to a kela' : 'Self-report once to unlock'}</div>
            </div>
            <div className="col" style={{ border: stats.sultan_badge ? '3px solid #000' : '3px dashed #000', background: stats.sultan_badge ? 'var(--banana)' : 'var(--off)', color: stats.sultan_badge ? '#000' : 'var(--quiet)', padding: '8px 10px', gap: 2 }}>
              <div className="head" style={{ fontSize: 15 }}>KELA SULTAN</div>
              <div className="tiny">{stats.sultan_badge ? 'Topped a week. Respect?' : 'Top a week to unlock'}</div>
            </div>
          </div>
        </div>
        </div>

        <div className="col gap8" style={{ minWidth: 0 }}>
          <div className="row between">
            <div className="label">Kela history</div>
            <div className="row" role="group" aria-label="History range">
              {[['week', 'THIS WEEK'], ['all', 'ALL TIME']].map(([k, l]) => (
                <button key={k} aria-pressed={range === k} onClick={() => setRange(k)} style={{ height: 32, padding: '0 10px', marginLeft: -3, border: '3px solid #000', background: range === k ? '#000' : '#fff', color: range === k ? 'var(--banana)' : '#000', fontSize: 10, fontWeight: 700 }}>{l}</button>
              ))}
            </div>
          </div>
          <div className="rows">
            {list.length === 0 && <div className="small" style={{ padding: 12 }}>No kele here. Suspiciously clean.</div>}
            {list.map((h) => (
              <div key={h.report_id} className="row gap10" style={{ padding: '9px 10px' }}>
                <div className="row" style={{ width: 52, gap: 1 }} aria-hidden="true">
                  {[1, 2, 3].map((n) => <Banana key={n} size={16} opacity={n <= h.severity ? 1 : 0.2} />)}
                </div>
                <div className="col grow minw0" style={{ gap: 2 }}>
                  <div className="row gap6">
                    <div className="upper" style={{ fontWeight: 700, fontSize: 12 }}>{HISTORY_LABELS[h.severity]}</div>
                    {h.is_self && <div className="tag" style={{ fontSize: 8 }}>SELF</div>}
                  </div>
                  <div className="tiny quiet">{dayLabel(h.created_at)} // {h.realm_name.toUpperCase()}</div>
                </div>
                <div className="head" style={{ fontSize: 16, whiteSpace: 'nowrap' }}>{keleStamp(h.half_kele).split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
       </div>

        <button className="linkbtn" onClick={signOut}>Sign out</button>
      </div>
      <BottomNav active="me" kelaTo="/" />
    </div>
  );
}
