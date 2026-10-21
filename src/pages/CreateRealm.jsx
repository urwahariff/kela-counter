import { useState } from 'react';
import { Link } from 'react-router-dom';
import { friendlyError, supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { COLORS } from '../lib/kela.js';
import { ErrorBox, TopBar } from '../components/ui.jsx';

export function inviteLink(code) {
  return `${window.location.origin}/r/${code}`;
}

export function shareOnWhatsApp(realmName, code) {
  const text = `Join "${realmName}" on Kela Counter and stop the kela eaters: ${inviteLink(code)} (code ${code})`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

export function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={`chipbtn ${done ? 'done' : ''}`} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* clipboard blocked */ }
    }}>{done ? 'COPIED' : 'COPY'}</button>
  );
}

export default function CreateRealm() {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8EC5FF');
  const [realm, setRealm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ok = name.trim().length > 0;

  async function create() {
    setBusy(true); setErr('');
    const { data, error } = await supabase.rpc('create_realm', { p_name: name.trim(), p_color: color });
    setBusy(false);
    if (error) return setErr(friendlyError(error));
    setRealm(data);
  }

  if (realm) {
    return (
      <div className="screen" style={{ background: 'var(--banana)' }}>
        <TopBar />
        <div className="content" style={{ background: 'var(--banana)' }}>
          <div className="head" style={{ fontSize: 44, lineHeight: 0.9, letterSpacing: -1.5, transform: 'rotate(-2deg)' }}>REALM<br />CREATED!</div>
          <div className="card shadow col gap6" style={{ background: realm.color, padding: 14 }}>
            <div className="head upper" style={{ fontSize: 26, lineHeight: 1 }}>{realm.name}</div>
            <div className="small">Now bring your friends in.</div>
          </div>
          <div className="card col gap8">
            <div className="small" style={{ letterSpacing: 1 }}>INVITE LINK</div>
            <div className="row gap8">
              <div className="small grow minw0" style={{ height: 44, border: '2px solid #000', background: 'var(--paper)', padding: '0 10px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{inviteLink(realm.invite_code).replace(/^https?:\/\//, '')}</div>
              <CopyButton text={inviteLink(realm.invite_code)} />
            </div>
            <div className="small" style={{ letterSpacing: 1, marginTop: 4 }}>OR SHARE THE CODE</div>
            <div className="row gap8">
              <div className="head grow" style={{ fontSize: 34, letterSpacing: 6, lineHeight: 1 }}>{realm.invite_code}</div>
              <CopyButton text={realm.invite_code} />
            </div>
          </div>
          <div className="spacer" />
          <button className="btn green" onClick={() => shareOnWhatsApp(realm.name, realm.invite_code)}>Share on WhatsApp</button>
          <Link className="btn black" to={`/realm/${realm.id}`}>Go to realm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar back="/" />
      <div className="content" style={{ gap: 18 }}>
        <h1 className="h1" style={{ fontSize: 36 }}>Start your<br />own realm</h1>
        <div className="card shadow col gap6" style={{ position: 'relative', background: color, padding: 16 }}>
          <div className="sticker">PREVIEW</div>
          <div className="small">CREATED BY {profile?.name?.toUpperCase()}</div>
          <div className="head upper" style={{ fontSize: 30, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ok ? name.trim() : 'Realm name'}</div>
          <div className="small">1 MEMBER // 0 KELE SO FAR</div>
        </div>
        <div className="col gap8">
          <label htmlFor="realmName" className="label">01 / Realm name</label>
          <input id="realmName" className="input" maxLength={18} autoComplete="off" placeholder="e.g. Office Ops, Cousins" value={name} onChange={(e) => setName(e.target.value.slice(0, 18))} />
        </div>
        <div className="col gap8">
          <div className="label" id="realmColor">02 / Realm colour</div>
          <div className="grid6" role="group" aria-labelledby="realmColor">
            {COLORS.map((c) => (
              <button key={c.hex} type="button" aria-label={c.label} aria-pressed={color === c.hex} className={`swatch ${color === c.hex ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => setColor(c.hex)} />
            ))}
          </div>
        </div>
        <div className="card dashed tiny col gap6" style={{ lineHeight: 1.4 }}>
          <div className="small" style={{ letterSpacing: 1 }}>HOUSE RULES (SAME FOR EVERY REALM)</div>
          <div>// Leaderboard resets Monday 12:00 AM PKT</div>
          <div>// Barra kela needs 1 confirmation</div>
          <div>// More than 3 reports an hour = 15 min cooldown</div>
          <div>// Self-reports count half and earn Mature</div>
        </div>
        <ErrorBox>{err}</ErrorBox>
        <div className="spacer" />
        <button className="btn" disabled={!ok || busy} onClick={create}>{busy ? 'Creating…' : ok ? 'Create realm' : 'Name your realm'}</button>
      </div>
    </div>
  );
}
