import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BananaBg, TopBar, useTitle } from '../components/ui.jsx';

export default function JoinCode() {
  useTitle('Join with a code');
  const [code, setCode] = useState('');
  const nav = useNavigate();
  const full = code.length === 6;

  return (
    <div className="screen">
      <BananaBg opacity={0.1} />
      <TopBar back="/" />
      <div className="content" style={{ gap: 18, paddingTop: 24 }}>
        <h1 className="h1" style={{ fontSize: 40, letterSpacing: -1.5 }}>Join UP and stop the kela eaters</h1>
        <form className="card shadow col gap10" style={{ padding: 16 }} onSubmit={(e) => { e.preventDefault(); if (full) nav(`/r/${code}`); }}>
          <label htmlFor="code" className="label">Enter realm code</label>
          <input id="code" className="input code" maxLength={6} autoComplete="off" placeholder="KELA42" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} />
          <div className="small">{full ? 'Ready. Tap Find realm.' : `${6 - code.length} more characters`}</div>
        </form>
        <div className="card dashed small" style={{ background: 'var(--paper)' }}>
          Got an invite link? Tapping it skips this step and opens the realm straight away.
        </div>
        <div className="spacer" />
        <button className="btn" disabled={!full} onClick={() => nav(`/r/${code}`)}>Find realm</button>
      </div>
    </div>
  );
}
