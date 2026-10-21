import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { friendlyError, supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { daysToReset, hoursLeft, HISTORY_LABELS, kele, splitKele, weekNumber } from '../lib/kela.js';
import { Avatar, BottomNav, ErrorBox, Loading, TopBar } from '../components/ui.jsx';
import { CopyButton, inviteLink, shareOnWhatsApp } from './CreateRealm.jsx';

function Big({ half, size = 26, frac = 14 }) {
  const s = splitKele(half);
  return <span className="score" style={{ fontSize: size }}>{s.whole}<span style={{ fontSize: frac }}>{s.frac}</span></span>;
}

export default function Leaderboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [realm, setRealm] = useState(null);
  const [rows, setRows] = useState(null);
  const [pending, setPending] = useState([]);
  const [lastSultan, setLastSultan] = useState(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [settings, setSettings] = useState(false);
  const [leaveStep, setLeaveStep] = useState('idle');

  const load = useCallback(async () => {
    const [r, lb, p, ls] = await Promise.all([
      supabase.from('realms').select('*').eq('id', id).maybeSingle(),
      supabase.rpc('get_leaderboard', { p_realm: id }),
      supabase.rpc('get_pending', { p_realm: id }),
      supabase.rpc('last_week_sultan', { p_realm: id })
    ]);
    if (!r.data) { setRealm(false); return; }
    setRealm(r.data); setRows(lb.data || []); setPending(p.data || []); setLastSultan(ls.data || null);
  }, [id]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`realm-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `realm_id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `realm_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load]);

  if (realm === false) {
    return (
      <div className="screen">
        <TopBar back="/" />
        <div className="content"><h1 className="h1">Realm not found</h1><p className="body">You may have left or been removed.</p><Link className="btn" to="/">Back to your realms</Link></div>
      </div>
    );
  }
  if (!realm || !rows) return <Loading />;

  const me = rows.find((r) => r.user_id === user.id);
  const iAmAdmin = Boolean(me?.is_admin);
  const adminCount = rows.filter((r) => r.is_admin).length;
  const top = rows[0] && rows[0].week_half > 0 ? rows[0] : null;
  const rest = top ? rows.slice(1) : rows;
  const max = top ? top.week_half : 1;

  async function act(fn, args, okMsg) {
    setErr(''); setNote('');
    const { error } = await supabase.rpc(fn, args);
    if (error) setErr(friendlyError(error)); else { if (okMsg) setNote(okMsg); load(); }
  }

  async function leave() {
    const { error } = await supabase.rpc('leave_realm', { p_realm: id });
    if (error) { setErr(friendlyError(error)); setLeaveStep('idle'); return; }
    nav('/', { replace: true });
  }

  return (
    <div className="screen">
      <TopBar back="/" kicker="REALM" title={realm.name}
        right={<div className="row gap8">
          <div className="topchip">WEEK {weekNumber()}</div>
          <button className="iconbtn yellow" aria-label="Realm settings" onClick={() => { setSettings(true); setLeaveStep('idle'); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" aria-hidden="true"><path d="M3 10h4v4H3zM10 10h4v4h-4zM17 10h4v4h-4z" /></svg>
          </button>
        </div>} />
      <div className="ticker">RESET: MONDAY 12:00 AM PKT // {daysToReset()} DAYS LEFT // RESET: MONDAY 12:00 AM PKT</div>

      <div className="content withnav">
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <h1 className="h1">Weekly<br />kele</h1>
          <div className="tiny" style={{ textAlign: 'right', lineHeight: 1.4 }}>LAST WEEK'S<br />SULTAN: {lastSultan ? lastSultan.toUpperCase() : '—'}</div>
        </div>

        <ErrorBox>{err}</ErrorBox>
        {note && <div role="status" className="okbox">{note}</div>}

        {top ? (
          <div className="card yellow shadow row gap14" style={{ position: 'relative', padding: 16 }}>
            <div className="sticker" style={{ fontSize: 13, padding: '4px 10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFE135" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true"><path d="M3 18h18l-1.5-10-4.5 4-3-7-3 7-4.5-4z" /></svg>
              KELA SULTAN
            </div>
            <Avatar person={top} size={72} iconSize={40} />
            <div className="col gap6 grow minw0">
              <div className="row gap6">
                <div className="small">#1</div>
                {top.is_admin && <div className="tag black">ADMIN</div>}
                {top.mature && <div className="tag">MATURE</div>}
              </div>
              <div className="head upper" style={{ fontSize: 28, lineHeight: 1 }}>{top.name}</div>
              <div className="tiny">ALL TIME: {kele(top.all_time_half)} KELE</div>
            </div>
            <div className="col" style={{ alignItems: 'flex-end' }}>
              <Big half={top.week_half} size={48} frac={22} />
              <div className="tiny">KELE</div>
            </div>
          </div>
        ) : (
          <div className="card dashed row gap14" style={{ position: 'relative', padding: 16 }}>
            <div className="sticker" style={{ fontSize: 13 }}>KELA SULTAN</div>
            <div className="avatar" style={{ width: 64, height: 64, borderStyle: 'dashed', background: 'var(--paper)' }}><span className="head" style={{ fontSize: 32 }}>?</span></div>
            <div className="col gap6">
              <div className="head" style={{ fontSize: 24, lineHeight: 1 }}>VACANT</div>
              <div className="small">First to eat a kela takes the crown.</div>
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="rows">
            {rest.map((r) => (
              <div key={r.user_id} className="lbrow">
                <div className="rank">#{r.rank}</div>
                <Avatar person={r} size={44} />
                <div className="col gap6 grow minw0">
                  <div className="row gap6">
                    <div className="upper" style={{ fontWeight: 700, fontSize: 14 }}>{r.name}{r.user_id === user.id ? ' (you)' : ''}</div>
                    {r.is_admin && <div className="tag black">ADMIN</div>}
                    {r.mature && <div className="tag">MATURE</div>}
                  </div>
                  <div className="bar"><div style={{ width: `${Math.round((r.week_half / max) * 100)}%` }} /></div>
                  <div className="tiny quiet">ALL TIME: {kele(r.all_time_half)} KELE</div>
                </div>
                <div style={{ width: 52, textAlign: 'right' }}><Big half={r.week_half} /></div>
              </div>
            ))}
          </div>
        )}

        {rows.length === 1 && (
          <div className="card shadow col gap10" style={{ background: 'var(--blue)', padding: 14 }}>
            <div className="h2" style={{ fontSize: 22 }}>It's just you here</div>
            <div className="small">A leaderboard of one is no fun. Bring your friends in.</div>
            <div className="row gap8">
              <div className="head grow" style={{ height: 44, border: '2px solid #000', background: 'var(--paper)', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 22, letterSpacing: 5 }}>{realm.invite_code}</div>
              <CopyButton text={inviteLink(realm.invite_code)} />
            </div>
            <button className="btn green sm" style={{ boxShadow: 'none', minHeight: 50, fontSize: 16 }} onClick={() => shareOnWhatsApp(realm.name, realm.invite_code)}>Share invite on WhatsApp</button>
          </div>
        )}

        {pending.length > 0 && (
          <div className="col gap8">
            <div className="label">Pending confirmation</div>
            {pending.map((p) => (
              <div key={p.report_id} className="card dashed row gap12">
                <Avatar person={{ color: p.eater_color, icon: p.eater_icon }} size={44} />
                <div className="col gap6 grow minw0">
                  <div className="upper" style={{ fontWeight: 700, fontSize: 13 }}>{p.eater_name} // {HISTORY_LABELS[p.severity]}</div>
                  <div style={{ fontSize: 11 }}>+3 kele pending // {hoursLeft(p.expires_at)} hours left</div>
                </div>
                {p.can_confirm && <button className="btn pink sm" style={{ fontSize: 13, padding: '0 12px' }} onClick={() => act('confirm_report', { p_report: p.report_id }, `CONFIRMED! ${p.eater_name.toUpperCase()} +3 KELE.`)}>Confirm</button>}
                {iAmAdmin && (
                  <button className="chipbtn" style={{ width: 44, height: 44, padding: 0 }} aria-label="Delete this report (admin)" onClick={() => act('delete_report', { p_report: p.report_id }, 'REPORT DELETED BY ADMIN.')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="realms" kelaTo={`/realm/${id}/report`} />

      {settings && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setSettings(false)}>
          <div role="dialog" aria-label="Realm settings" className="sheet paper" style={{ gap: 14 }}>
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div className="col gap6"><div className="label">Realm settings</div><div className="h2" style={{ fontSize: 28 }}>{realm.name}</div></div>
              <button className="chipbtn head" style={{ width: 40, fontSize: 18 }} aria-label="Close settings" onClick={() => setSettings(false)}>X</button>
            </div>

            <div className="row gap10" style={{ border: '3px solid #000', background: 'var(--banana)', padding: '10px 12px' }}>
              <div className="col grow"><div className="tiny" style={{ letterSpacing: 1 }}>INVITE CODE</div><div className="head" style={{ fontSize: 24, letterSpacing: 5, lineHeight: 1 }}>{realm.invite_code}</div></div>
              <CopyButton text={inviteLink(realm.invite_code)} />
            </div>
            <button className="btn green sm" style={{ boxShadow: 'none' }} onClick={() => shareOnWhatsApp(realm.name, realm.invite_code)}>Share invite on WhatsApp</button>

            <div className="col gap8">
              <div className="small" style={{ letterSpacing: 1 }}>MEMBERS ({rows.length})</div>
              <div className="rows">
                {rows.map((m) => {
                  const isMe = m.user_id === user.id;
                  return (
                    <div key={m.user_id} className="row gap10" style={{ padding: '8px 10px' }}>
                      <Avatar person={m} size={34} border={2} iconSize={18} />
                      <div className="col grow minw0">
                        <div className="upper" style={{ fontSize: 12, fontWeight: 700 }}>{m.name}{isMe ? ' (you)' : ''}</div>
                        <div className="quiet" style={{ fontSize: 9, fontWeight: 700 }}>{m.is_creator && m.is_admin ? 'CREATOR // ADMIN' : m.is_admin ? 'ADMIN' : 'MEMBER'}</div>
                      </div>
                      {iAmAdmin && !isMe && !m.is_admin && (
                        <button className="chipbtn" style={{ height: 34, fontSize: 9, borderWidth: 2, background: 'var(--banana)' }} onClick={() => act('make_admin', { p_realm: id, p_user: m.user_id }, `${m.name.toUpperCase()} IS NOW AN ADMIN.`)}>MAKE ADMIN</button>
                      )}
                      {iAmAdmin && !isMe && (
                        <button className="chipbtn" style={{ height: 34, fontSize: 9, borderWidth: 2 }} onClick={() => act('remove_member', { p_realm: id, p_user: m.user_id }, `${m.name.toUpperCase()} WAS REMOVED.`)}>REMOVE</button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="tiny quiet" style={{ lineHeight: 1.4 }}>Admins can delete any report, remove members and make other admins. The creator starts as admin.</div>
            </div>

            {leaveStep === 'idle' && (
              <button className="btn pink sm" style={{ boxShadow: 'none', minHeight: 52 }} onClick={() => setLeaveStep(iAmAdmin && adminCount === 1 && rows.length > 1 ? 'blocked' : 'confirm')}>Leave realm</button>
            )}
            {leaveStep === 'blocked' && (
              <div role="alert" className="col gap8" style={{ border: '3px solid #000', background: 'var(--pink)', padding: 12 }}>
                <div className="head" style={{ fontSize: 16 }}>YOU'RE THE ONLY ADMIN</div>
                <div className="small">Make someone else admin before you leave, so the realm isn't left without one.</div>
                <button className="chipbtn" style={{ alignSelf: 'flex-start' }} onClick={() => setLeaveStep('idle')}>GOT IT</button>
              </div>
            )}
            {leaveStep === 'confirm' && (
              <div className="card col gap10">
                <div className="head" style={{ fontSize: 18 }}>LEAVE THE REALM?</div>
                <div className="small">You'll drop off this leaderboard. You can rejoin later with the code.</div>
                <div className="grid2">
                  <button className="btn sm" style={{ boxShadow: 'none' }} onClick={() => setLeaveStep('idle')}>Stay</button>
                  <button className="btn black sm" style={{ color: 'var(--pink)', boxShadow: 'none' }} onClick={leave}>Leave</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
