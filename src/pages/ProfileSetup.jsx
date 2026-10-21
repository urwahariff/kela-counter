import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { avatarUrl, friendlyError, supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { COLORS, ICONS } from '../lib/kela.js';
import { ErrorBox, IconSvg, Loading, TopBar } from '../components/ui.jsx';

// Square-crop and compress a photo to a 400x400 WebP on the phone
async function compressPhoto(file) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 400;
  canvas.getContext('2d').drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 400, 400);
  return new Promise((res) => canvas.toBlob(res, 'image/webp', 0.82));
}

export default function ProfileSetup() {
  const { ready, session, profile, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const nav = useNavigate();
  const editing = Boolean(profile);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#FFE135');
  const [icon, setIcon] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [onCards, setOnCards] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name); setColor(profile.color); setIcon(profile.icon); setOnCards(profile.photo_on_cards);
      if (profile.photo_path) setPhotoPreview(avatarUrl(profile.photo_path));
    } else if (session?.user) {
      const g = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
      setName(g.split(' ')[0].slice(0, 16));
    }
  }, [profile, session]);

  if (!ready) return <Loading />;
  if (!session) return <Navigate to="/" replace />;

  const hasPhoto = Boolean(photoPreview) && !removePhoto;
  const nameOk = name.trim().length > 0;
  const can = nameOk && icon && !busy;

  async function pickPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const blob = await compressPhoto(f);
      setPhotoBlob(blob); setPhotoPreview(URL.createObjectURL(blob)); setRemovePhoto(false);
    } catch { setErr("Couldn't read that photo. Try another one."); }
  }

  async function save() {
    setBusy(true); setErr('');
    const uid = session.user.id;
    let photo_path = profile?.photo_path || null;
    try {
      if (photoBlob) {
        const { error } = await supabase.storage.from('avatars').upload(`${uid}.webp`, photoBlob, { upsert: true, contentType: 'image/webp' });
        if (error) throw error;
        photo_path = `${uid}.webp?v=${Date.now()}`;
      } else if (removePhoto && photo_path) {
        await supabase.storage.from('avatars').remove([`${uid}.webp`]);
        photo_path = null;
      }
      const row = { id: uid, name: name.trim(), color, icon, photo_path, photo_on_cards: onCards };
      const { error } = editing
        ? await supabase.from('profiles').update(row).eq('id', uid)
        : await supabase.from('profiles').insert(row);
      if (error) throw error;
      await refreshProfile();
      nav(editing ? '/me' : next, { replace: true });
    } catch (e) {
      setErr(friendlyError(e)); setBusy(false);
    }
  }

  return (
    <div className="screen">
      <TopBar back={editing ? '/me' : undefined} right={<div className="topchip">{editing ? 'EDIT' : 'STEP 2 OF 2'}</div>} />
      <div className="content" style={{ gap: 14 }}>
        <h1 className="h1" style={{ fontSize: 30 }}>{editing ? 'Edit your profile' : 'Make your profile'}</h1>

        <div className="card shadow row gap14" style={{ position: 'relative', background: color, padding: 14 }}>
          <div className="sticker">PREVIEW</div>
          <div className="avatar" style={{ width: 68, height: 68, background: hasPhoto ? color : 'var(--paper)' }}>
            {hasPhoto ? <img src={photoPreview} alt="" className="duotone" /> : icon ? <IconSvg icon={icon} size={40} /> : <span className="head" style={{ fontSize: 30 }}>?</span>}
          </div>
          <div className="col gap6 minw0">
            <div className="head upper" style={{ fontSize: 26, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameOk ? name.trim() : 'Your name'}</div>
            <div className="small">0 KELE // CLEAN RECORD</div>
          </div>
        </div>

        <div className="col gap8">
          <label htmlFor="nick" className="label">01 / Your name</label>
          <input id="nick" className="input" maxLength={16} autoComplete="off" placeholder="What do your friends call you?" value={name} onChange={(e) => setName(e.target.value.slice(0, 16))} />
        </div>

        <div className="col gap8">
          <div className="label" id="colorLabel">02 / Your colour</div>
          <div className="grid6" role="group" aria-labelledby="colorLabel">
            {COLORS.map((c) => (
              <button key={c.hex} type="button" aria-label={c.label} aria-pressed={color === c.hex} className={`swatch ${color === c.hex ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => setColor(c.hex)} />
            ))}
          </div>
        </div>

        <div className="col gap8">
          <div className="label" id="iconLabel">03 / Pick your icon</div>
          <div className="grid4" role="group" aria-labelledby="iconLabel">
            {Object.entries(ICONS).map(([id, ic]) => (
              <button key={id} type="button" aria-pressed={icon === id} className={`tile ${icon === id ? 'on' : ''}`} style={{ height: 60, background: '#fff', color: icon === id ? color : '#000' }} onClick={() => setIcon(id)}>
                <IconSvg icon={id} size={28} color="currentColor" />
                <span style={{ fontSize: 9, fontWeight: 700 }}>{ic.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col gap8">
          <div className="label">04 / Add a photo (optional)</div>
          <div className="row gap10">
            <label className="btn sm grow" style={{ background: hasPhoto ? 'var(--paper)' : 'var(--blue)', cursor: 'pointer' }}>
              {hasPhoto ? 'Change photo' : 'Upload photo'}
              <input type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
            </label>
            {hasPhoto && <button type="button" className="btn sm white" onClick={() => { setRemovePhoto(true); setPhotoBlob(null); }}>Remove</button>}
          </div>
          {hasPhoto ? (
            <label className="row gap8 small" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={onCards} onChange={(e) => setOnCards(e.target.checked)} style={{ width: 20, height: 20, accentColor: '#000' }} />
              Show my photo on share cards
            </label>
          ) : (
            <div className="tiny quiet">No photo? Your icon is used everywhere.</div>
          )}
        </div>

        <ErrorBox>{err}</ErrorBox>
        <button className="btn" disabled={!can} onClick={save}>
          {busy ? 'Saving…' : !nameOk ? 'Add your name' : !icon ? 'Pick an icon' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}
