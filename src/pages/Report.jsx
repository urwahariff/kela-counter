import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { avatarUrl, friendlyError, supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { keleStamp, kele, SEVERITIES, realmWeek } from '../lib/kela.js';
import { drawShareCard, saveAndShare } from '../lib/shareCard.js';
import { Banana, ErrorBox, IconSvg, Loading, TopBar } from '../components/ui.jsx';

function SeverityPicker({ value, onChange, half = false, id }) {
  const lv = value ? SEVERITIES[value - 1] : null;
  const pts = value ? keleStamp(half ? value : value * 2) : '?';
  return (
    <div className="col gap8">
      <div className="row between gap8">
        <div className="head upper" style={{ fontSize: 15, lineHeight: 1.05 }}>{lv ? lv.label : 'Slide to set severity'}</div>
        <div className="head" style={{ fontSize: 20, background: '#000', color: 'var(--banana)', padding: '0 8px', whiteSpace: 'nowrap' }}>{pts}</div>
      </div>
      <input id={id} type="range" min="1" max="3" step="1" value={value || 2} aria-label="Severity"
        onChange={(e) => onChange(Number(e.target.value))} onClick={(e) => onChange(Number(e.target.value))} />
      <div className="row between tiny"><span>SMALL</span><span>MEDIUM</span><span>BARRA KELA</span></div>
    </div>
  );
}

export default function Report() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [realm, setRealm] = useState(null);
  const [members, setMembers] = useState(null);
  const [eater, setEater] = useState(null);
  const [sev, setSev] = useState(null);
  const [selfOpen, setSelfOpen] = useState(false);
  const [selfSev, setSelfSev] = useState(null);
  const [hour, setHour] = useState({ count: 0, cooldown_until: null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null); // the card data once reported
  const [saved, setSaved] = useState('');
  const canvasRef = useRef(null);

  const load = useCallback(async () => {
    const [r, lb, h] = await Promise.all([
      supabase.from('realms').select('*').eq('id', id).maybeSingle(),
      supabase.rpc('get_leaderboard', { p_realm: id }),
      supabase.rpc('reports_this_hour')
    ]);
    setRealm(r.data); setMembers(lb.data || []); if (h.data) setHour(h.data);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (done && canvasRef.current) drawShareCard(canvasRef.current, done);
  }, [done]);

  if (!realm || !members) return <Loading />;
  const others = members.filter((m) => m.user_id !== user.id);
  const meRow = members.find((m) => m.user_id === user.id);

  async function submit(isSelf) {
    setBusy(true); setErr('');
    const target = isSelf ? meRow : members.find((m) => m.user_id === eater);
    const severity = isSelf ? selfSev : sev;
    const { data, error } = await supabase.rpc('report_kela', { p_realm: id, p_eater: target.user_id, p_severity: severity, p_self: isSelf });
    setBusy(false);
    if (error) { setErr(friendlyError(error)); setSelfOpen(false); load(); return; }
    const counted = data.status === 'counted';
    setSelfOpen(false);
    setDone({
      eaterName: target.name, color: target.color, icon: target.icon,
      photoUrl: target.photo_path && target.photo_on_cards ? avatarUrl(target.photo_path) : null,
      week: realmWeek(realm.created_at), label: SEVERITIES[severity - 1].label,
      stamp: counted ? keleStamp(data.half_kele) : 'PENDING',
      totalKele: kele(target.all_time_half + (counted ? data.half_kele : 0)),
      realmName: realm.name, severity, isSelf
    });
    setHour((h) => ({ ...h, count: (h.count || 0) + 1 }));
  }

  function reset() { setDone(null); setEater(null); setSev(null); setSelfSev(null); setSaved(''); load(); }

  const cooling = hour.cooldown_until && new Date(hour.cooldown_until) > new Date();
  const counter = (
    <div className="tiny" style={{ background: cooling ? 'var(--pink)' : 'var(--green)', border: '2px solid var(--paper)', padding: '4px 8px', whiteSpace: 'nowrap' }}>
      {cooling ? 'COOLDOWN' : `${Math.min(hour.count || 0, 3)}/3 THIS HOUR`}
    </div>
  );
  const realmStrip = (
    <div className="strip">REPORTING IN: {realm.name.toUpperCase()}</div>
  );

  if (done) {
    return (
      <div className="screen" style={{ background: 'var(--banana)' }}>
        <TopBar back={`/realm/${id}`} right={counter} />
        {realmStrip}
        <div className="content" style={{ alignItems: 'center', gap: 12, background: 'var(--banana)' }}>
          <div className="head" style={{ fontSize: 26, letterSpacing: -1, transform: 'rotate(-2deg)' }}>KELA REPORTED!</div>
          <canvas ref={canvasRef} style={{ width: 288, maxWidth: '100%', aspectRatio: '9 / 16', boxShadow: '6px 6px 0 #000' }} aria-label={`Kela alert card for ${done.eaterName}`} />
          {done.stamp === 'PENDING' && <div className="small" style={{ textAlign: 'center' }}>Barra kela needs 1 confirmation from the realm. If no one confirms in 24 hours, it drops to +2 kele.</div>}
          {saved && <div role="status" className="okbox" style={{ alignSelf: 'stretch', textAlign: 'center' }}>{saved}</div>}
          <button className="btn pink" style={{ alignSelf: 'stretch' }} onClick={async () => {
            const how = await saveAndShare(canvasRef.current, `kela-${done.eaterName.toLowerCase()}.png`);
            setSaved(how === 'shared' ? 'SHARED!' : 'SAVED: 1080 × 1920 PNG');
          }}>Save &amp; Share</button>
          <button className="btn black sm" style={{ alignSelf: 'stretch', boxShadow: 'none' }} onClick={reset}>Report another</button>
        </div>
      </div>
    );
  }

  const can = eater && sev && !busy && !cooling;
  return (
    <div className="screen">
      <TopBar back={`/realm/${id}`} right={counter} />
      {realmStrip}
      <div className="content" style={{ gap: 22 }}>
        <h1 className="h1">Who ate a kela?</h1>

        <div className="col gap10">
          <div className="label">Choose the kela eater</div>
          {others.length === 0 ? (
            <div className="card dashed small">No one else is here yet. Invite your friends from the leaderboard's settings.</div>
          ) : (
            <div className="grid3" style={{ gap: 12 }}>
              {others.map((m) => {
                const on = eater === m.user_id;
                return (
                  <button key={m.user_id} type="button" aria-pressed={on} className={`tile ${on ? 'on' : ''}`} style={{ height: 96, background: m.color, color: on ? m.color : '#000' }} onClick={() => setEater(m.user_id)}>
                    {m.photo_path && !on
                      ? <div className="avatar" style={{ width: 40, height: 40, borderWidth: 2, background: m.color }}><img src={avatarUrl(m.photo_path)} alt="" className="duotone" /></div>
                      : <IconSvg icon={m.icon} size={36} color="currentColor" />}
                    <span className="upper" style={{ fontSize: 11, fontWeight: 700 }}>{m.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          <button type="button" className="btn dashed" style={{ minHeight: 48 }} onClick={() => { setSelfSev(null); setSelfOpen(true); }}>
            <Banana /> I ate a kela
          </button>
        </div>

        <div className="card" style={{ boxShadow: '4px 4px 0 #000', padding: '10px 12px 12px' }}>
          <div className="row gap6" aria-hidden="true" style={{ marginBottom: 6 }}>
            {[1, 2, 3].map((n) => <Banana key={n} opacity={sev && n <= sev ? 1 : 0.2} />)}
          </div>
          <SeverityPicker id="sev" value={sev} onChange={setSev} />
          {sev === 3 && <div className="small" style={{ marginTop: 8, background: 'var(--pink)', border: '2px solid #000', padding: '6px 8px' }}>Needs 1 confirmation from the realm. If no one confirms in 24 hours, it drops to +2 kele.</div>}
        </div>

        <ErrorBox>{err}</ErrorBox>
        <div className="spacer" />
        <button className="btn" style={{ minHeight: 64, fontSize: 22 }} disabled={!can} onClick={() => submit(false)}>{busy ? 'Reporting…' : 'Report the kela'}</button>
      </div>

      {selfOpen && (
        <div className="overlay center" onClick={(e) => e.target === e.currentTarget && setSelfOpen(false)}>
          <div role="dialog" aria-label="Self report confirmation" style={{ position: 'relative', width: '100%', maxWidth: 360, border: '3px solid #000', background: 'var(--banana)', boxShadow: '8px 8px 0 #000', padding: '140px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <img src="/soch-lo.png" alt="" aria-hidden="true" style={{ position: 'absolute', top: -110, left: -18, width: 200, height: 235, objectFit: 'contain', transform: 'rotate(-4deg)' }} />
            <div className="head upper" style={{ position: 'absolute', top: 18, right: -12, width: 170, background: '#000', color: 'var(--banana)', border: '3px solid #000', boxShadow: '5px 5px 0 var(--pink)', padding: 10, transform: 'rotate(3deg)', fontSize: 21, lineHeight: 0.95 }}>Mein kehta hun soch lo</div>
            <div className="row between" style={{ marginTop: 14 }}>
              <div className="label" style={{ fontSize: 11 }}>Self report</div>
              <div className="head" style={{ background: 'var(--pink)', border: '2px solid #000', padding: '3px 8px', fontSize: 12, transform: 'rotate(-3deg)' }}>+ MATURE BADGE</div>
            </div>
            <div className="card" style={{ padding: '10px 12px 12px' }}>
              <SeverityPicker value={selfSev} onChange={setSelfSev} half />
            </div>
            <div className="small">Owning up counts half. No confirmation needed.</div>
            <div className="grid2">
              <button className="btn white sm" style={{ minHeight: 52 }} onClick={() => setSelfOpen(false)}>Back</button>
              <button className="btn black sm" style={{ minHeight: 52, fontSize: 15 }} disabled={!selfSev || busy || cooling} onClick={() => submit(true)}>Yes, I ate it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
