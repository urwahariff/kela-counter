import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithGoogle } from '../lib/auth.jsx';
import { BANANA_PATH, ICONS } from '../lib/kela.js';
import { BananaBg } from '../components/ui.jsx';

const INTENTS = {
  create: { kicker: 'TO START A REALM', next: '/create' },
  code: { kicker: 'TO JOIN WITH A CODE', next: '/join' },
  signin: { kicker: 'WELCOME BACK', next: '/' }
};

export default function Landing() {
  const [intent, setIntent] = useState(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    await signInWithGoogle(INTENTS[intent].next);
  }

  return (
    <div className="screen">
      <BananaBg />
      <div className="row between" style={{ position: 'relative', height: 52, background: '#000', padding: '0 16px' }}>
        <div className="tiny" style={{ color: 'var(--banana)', letterSpacing: 1 }}>KELA COUNTER</div>
        <button className="topchip" onClick={() => setIntent('signin')}>SIGN IN</button>
      </div>

      <div className="content" style={{ gap: 14 }}>
        <h1 style={{ position: 'relative', margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" style={{ position: 'absolute', top: 18, right: -40, width: 150, height: 150, transform: 'rotate(-40deg)', zIndex: 1 }}>
            <g transform="translate(0.9 0.9)"><path d={BANANA_PATH} fill="#000" /></g>
            <path d={BANANA_PATH} fill="#FFE135" stroke="#000" strokeWidth="0.9" strokeLinejoin="round" />
            <path d="M6 14.2c3.5 2.6 9 2.6 12.6-1.4" fill="none" stroke="#000" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M20.5 7.2l1.3-2.4" stroke="#000" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: 'var(--head)', fontSize: 'clamp(80px, 26vw, 104px)', lineHeight: 0.82, letterSpacing: -5, background: 'var(--banana)', border: '4px solid #000', boxShadow: '8px 8px 0 #000', padding: '6px 10px 2px', transform: 'rotate(-3deg)' }}>KELA</span>
          <span style={{ fontFamily: 'var(--head)', fontSize: 'clamp(40px, 13vw, 52px)', lineHeight: 0.9, letterSpacing: -2, marginTop: 10, marginLeft: 6 }}>COUNTER</span>
        </h1>

        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>Who's eating the most kele this week?</div>

        <div aria-hidden="true" className="ticker" style={{ margin: '0 -16px', borderTop: '3px solid #000' }}>
          AYAAN +2 // SHERY +3 PENDING // HUZAIFA +0.5 SELF // URWAH +1 // AYAAN +2
        </div>

        <div className="row gap14" style={{ flex: 1, minHeight: 300 }}>
          <div style={{ width: 170, height: 302, flexShrink: 0, border: '3px solid #000', background: 'var(--paper)', boxShadow: '6px 6px 0 #000', display: 'flex', flexDirection: 'column', transform: 'rotate(-4deg)' }} aria-hidden="true">
            <div className="row between" style={{ background: '#000', color: 'var(--banana)', padding: '4px 8px', fontSize: 8, fontWeight: 700 }}><span>KELA ALERT</span><span>WEEK 1</span></div>
            <div className="col gap6" style={{ flex: 1, padding: 8, minHeight: 0 }}>
              <div className="row gap6">
                <div className="avatar" style={{ width: 30, height: 30, borderWidth: 2, background: 'var(--pink)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.samosa.path} /></svg>
                </div>
                <div className="head" style={{ fontSize: 17 }}>AYAAN</div>
              </div>
              <div style={{ flex: 1, border: '2px solid #000', background: 'var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                <div style={{ background: 'var(--paper)', border: '2px solid #000', boxShadow: '3px 3px 0 #000', padding: 6, transform: 'rotate(2deg)' }}>
                  <div className="head" style={{ fontSize: 12, lineHeight: 1 }}>DIL PE MAT LE YAAR…</div>
                  <div className="head" style={{ fontSize: 13, lineHeight: 1, marginTop: 4, background: '#000', color: 'var(--banana)', padding: '1px 4px', display: 'inline-block' }}>OH, LE LIYA</div>
                </div>
              </div>
              <div className="row between" style={{ border: '2px solid #000', background: '#000', color: 'var(--banana)', padding: '4px 6px' }}>
                <div style={{ fontSize: 7, fontWeight: 700, lineHeight: 1.2 }}>TOTAL<br />KELE</div>
                <div className="head" style={{ fontSize: 24, lineHeight: 0.9 }}>23</div>
              </div>
            </div>
          </div>
          <div className="col gap12 grow">
            <div className="head" style={{ background: 'var(--banana)', border: '3px solid #000', padding: 8, fontSize: 16, lineHeight: 1, transform: 'rotate(3deg)' }}>+1<br /><span className="tiny" style={{ fontFamily: 'var(--mono)' }}>KACHA KELA</span></div>
            <div className="head" style={{ background: 'var(--orange)', border: '3px solid #000', padding: 8, fontSize: 16, lineHeight: 1, transform: 'rotate(-2deg)' }}>+2<br /><span className="tiny" style={{ fontFamily: 'var(--mono)' }}>DIL PE LE LIYA</span></div>
            <div className="head" style={{ background: '#000', color: 'var(--banana)', border: '3px solid #000', padding: 8, fontSize: 16, lineHeight: 1, transform: 'rotate(2deg)' }}>+3<br /><span className="tiny" style={{ fontFamily: 'var(--mono)' }}>BARRA KELA</span></div>
          </div>
        </div>

        <button className="btn" onClick={() => setIntent('create')}>Start a realm</button>
        <button className="btn white" style={{ minHeight: 54, fontSize: 17 }} onClick={() => setIntent('code')}>I have a code</button>
        <div className="row gap14 tiny" style={{ justifyContent: 'center', position: 'relative' }}>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
      </div>

      {intent && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setIntent(null)}>
          <div role="dialog" aria-label="Sign in" className="sheet">
            <div className="label">{INTENTS[intent].kicker}</div>
            <div className="h2" style={{ fontSize: 28 }}>Sign in first</div>
            <button className="btn white" style={{ boxShadow: '5px 5px 0 #000', fontSize: 16 }} onClick={go} disabled={busy}>
              {busy ? 'Opening Google…' : 'Continue with Google'}
            </button>
            <div className="tiny" style={{ lineHeight: 1.4 }}>We only use your Google name and email to set up your account. <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link></div>
            <button className="linkbtn" style={{ alignSelf: 'center' }} onClick={() => setIntent(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
