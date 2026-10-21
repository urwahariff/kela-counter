import { Link, useNavigate } from 'react-router-dom';
import { BANANA_PATH, ICONS } from '../lib/kela.js';
import { avatarUrl } from '../lib/supabase.js';

export function IconSvg({ icon, size = 24, color = '#000' }) {
  const d = ICONS[icon]?.path || ICONS.chai.path;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Banana({ size = 18, opacity = 1, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ opacity, ...style }}>
      <path d={BANANA_PATH} fill="#FFE135" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20.5 7.2l1.3-2.4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Square avatar: duotone photo if present, else the icon on the person's colour
export function Avatar({ person, size = 44, border = 3, iconSize }) {
  const url = person?.photo_path ? avatarUrl(person.photo_path) : null;
  return (
    <div className="avatar" style={{ width: size, height: size, borderWidth: border, background: person?.color || '#FFE135' }}>
      {url ? (
        <img src={url} alt="" className="duotone" />
      ) : (
        <IconSvg icon={person?.icon} size={iconSize || Math.round(size * 0.55)} />
      )}
    </div>
  );
}

export function TopBar({ title, kicker, back, right }) {
  const nav = useNavigate();
  return (
    <header className="topbar">
      <div className="row gap10 minw0">
        {back && (
          <button className="iconbtn" aria-label="Back" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFDF5" strokeWidth="2.6" strokeLinecap="square"><path d="M15 4l-8 8 8 8" /></svg>
          </button>
        )}
        <div className="col minw0">
          {kicker && <div className="topbar-kicker">{kicker}</div>}
          <div className="topbar-title">{title || 'KELA COUNTER'}</div>
        </div>
      </div>
      {right}
    </header>
  );
}

export function BottomNav({ active, kelaTo, onKela, kelaDisabled }) {
  return (
    <nav className="bottomnav" aria-label="Main">
      <Link to="/" className={active === 'realms' ? 'on' : ''} aria-current={active === 'realms' ? 'page' : undefined}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" /></svg>
        REALMS
      </Link>
      <div className="navmid">
        {kelaDisabled ? (
          <span className="kelabtn disabled" aria-disabled="true">+ KELA!</span>
        ) : kelaTo ? (
          <Link to={kelaTo} className="kelabtn">+ KELA!</Link>
        ) : (
          <button className="kelabtn" onClick={onKela}>+ KELA!</button>
        )}
      </div>
      <Link to="/me" className={active === 'me' ? 'on' : ''} aria-current={active === 'me' ? 'page' : undefined}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true"><path d="M8 8a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
        PROFILE
      </Link>
    </nav>
  );
}

export function BananaBg({ opacity = 0.12 }) {
  return (
    <svg className="bananabg" aria-hidden="true" style={{ opacity }}>
      <defs>
        <pattern id="bbg" width="72" height="72" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
          <g transform="translate(6 8) scale(1.2)"><path d={BANANA_PATH} fill="#FFE135" stroke="#000" strokeWidth="1.4" strokeLinejoin="round" /></g>
          <g transform="translate(68 40) rotate(150)"><path d={BANANA_PATH} fill="#FFE135" stroke="#000" strokeWidth="1.4" strokeLinejoin="round" /></g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bbg)" />
    </svg>
  );
}

export function Loading({ label = 'Loading kele…' }) {
  return <div className="loading"><Banana size={48} /><span>{label}</span></div>;
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return <div role="alert" className="errorbox">{children}</div>;
}

export function Score({ half, big = 26, small = 14 }) {
  const n = (half || 0) / 2;
  return (
    <span className="score" style={{ fontSize: big }}>
      {Math.floor(n)}
      {n % 1 ? <span style={{ fontSize: small }}>.5</span> : null}
    </span>
  );
}
