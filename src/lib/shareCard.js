// Draws the 9:16 Kela Alert card onto a canvas at 1080x1920.
// Layout is authored at 288x512 and scaled by 3.75.
import { BANANA_PATH, ICONS, MEMES, kele } from './kela.js';

const W = 288, H = 512, SCALE = 3.75;
const INK = '#000', PAPER = '#FFFDF5', BANANA = '#FFE135', PINK = '#FF3EA5', GREEN = '#7CFF6B';
const HEAD = '"Archivo Black", sans-serif';
const MONO = '"Space Mono", monospace';

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawBanana(ctx, x, y, size, rot, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(size / 24, size / 24);
  ctx.translate(-12, -12);
  const p = new Path2D(BANANA_PATH);
  ctx.fillStyle = BANANA; ctx.fill(p);
  ctx.lineWidth = 1.4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(p);
  ctx.restore();
}

function box(ctx, x, y, w, h, fill, line = 3) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.strokeRect(x + line / 2, y + line / 2, w - line, h - line);
}

function text(ctx, str, x, y, { font = HEAD, size = 12, color = INK, align = 'left', weight = '' } = {}) {
  ctx.font = `${weight} ${size}px ${font}`.trim();
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function fitSize(ctx, str, font, maxSize, maxWidth) {
  let s = maxSize;
  do { ctx.font = `${s}px ${font}`; if (ctx.measureText(str).width <= maxWidth) return s; s -= 1; } while (s > 8);
  return s;
}

/**
 * data: { eaterName, color, icon, photoUrl, week, label, stamp, totalKele, realmName, severity, isSelf }
 */
export async function drawShareCard(canvas, data) {
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  try { await Promise.all([document.fonts.load(`20px ${HEAD}`), document.fonts.load(`700 12px ${MONO}`)]); } catch { /* fonts optional */ }
  const photo = await loadImage(data.photoUrl);

  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  // Background + faint banana pattern
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) {
    drawBanana(ctx, c * 56 + (r % 2) * 28, r * 56 + 10, 22, r % 2 ? 150 : -18, 0.14);
  }
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(1.5, 1.5, W - 3, H - 3);

  // Header strip
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 24);
  text(ctx, 'KELA ALERT', 12, 16, { font: MONO, size: 10, color: BANANA, weight: '700' });
  text(ctx, `WEEK ${data.week}`, W - 12, 16, { font: MONO, size: 10, color: BANANA, weight: '700', align: 'right' });

  // Eater row
  box(ctx, 12, 36, 52, 52, data.color || BANANA);
  if (photo) {
    ctx.save(); ctx.beginPath(); ctx.rect(15, 39, 46, 46); ctx.clip();
    ctx.filter = 'grayscale(1) contrast(1.35)';
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(photo, 15, 39, 46, 46);
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(23, 47); ctx.scale(30 / 24, 30 / 24);
    ctx.lineWidth = 2.2; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke(new Path2D(ICONS[data.icon]?.path || ICONS.chai.path));
    ctx.restore();
  }
  const name = (data.eaterName || '').toUpperCase();
  text(ctx, name, 74, 66, { size: fitSize(ctx, name, HEAD, 26, W - 86) });
  text(ctx, 'ATE A KELA', 74, 82, { font: MONO, size: 11, weight: '700' });

  // Meme panel (slightly rotated)
  const [top, bottom] = data.isSelf ? MEMES.self : MEMES[data.severity];
  ctx.save();
  ctx.translate(W / 2, 205); ctx.rotate((-1 * Math.PI) / 180); ctx.translate(-W / 2, -205);
  box(ctx, 12, 100, W - 24, 210, PINK);
  drawBanana(ctx, 34, 122, 40, -20);
  drawBanana(ctx, W - 40, 288, 52, 25);
  ctx.save(); ctx.translate(W / 2, 205); ctx.rotate((2 * Math.PI) / 180);
  const t1 = top.toUpperCase(), t2 = bottom.toUpperCase();
  const s1 = fitSize(ctx, t1, HEAD, 22, 190), s2 = fitSize(ctx, t2, HEAD, 24, 180);
  ctx.font = `${s2}px ${HEAD}`; const w2 = ctx.measureText(t2).width;
  ctx.font = `${s1}px ${HEAD}`; const w1 = ctx.measureText(t1).width;
  const bw = Math.max(w1, w2 + 12) + 24, bh = s1 + s2 + 34;
  ctx.fillStyle = INK; ctx.fillRect(-bw / 2 + 5, -bh / 2 + 5, bw, bh);
  box(ctx, -bw / 2, -bh / 2, bw, bh, PAPER);
  text(ctx, t1, -bw / 2 + 12, -bh / 2 + 10 + s1, { size: s1 });
  ctx.fillStyle = INK; ctx.fillRect(-bw / 2 + 12, -bh / 2 + 18 + s1, w2 + 12, s2 + 6);
  text(ctx, t2, -bw / 2 + 18, -bh / 2 + 18 + s1 + s2, { size: s2, color: BANANA });
  ctx.restore();
  ctx.restore();

  // Severity label + stamp
  const label = (data.label || '').replace(/\n/g, ' ').toUpperCase();
  text(ctx, label, 12, 344, { size: fitSize(ctx, label, HEAD, 13, 160) });
  ctx.save(); ctx.translate(W - 60, 338); ctx.rotate((3 * Math.PI) / 180);
  ctx.font = `20px ${HEAD}`; const sw = ctx.measureText(data.stamp).width + 16;
  ctx.fillStyle = INK; ctx.fillRect(-sw / 2, -16, sw, 28);
  text(ctx, data.stamp, 0, 5, { size: 20, color: BANANA, align: 'center' });
  ctx.restore();

  // Total block
  box(ctx, 12, 366, W - 24, 70, INK);
  text(ctx, 'TOTAL KELE', 24, 396, { font: MONO, size: 10, color: BANANA, weight: '700' });
  text(ctx, `(ALL TIME, ${String(data.realmName || '').toUpperCase().slice(0, 14)})`, 24, 410, { font: MONO, size: 8, color: BANANA, weight: '700' });
  text(ctx, String(data.totalKele), W - 24, 420, { size: 40, color: BANANA, align: 'right' });

  // Footer
  ctx.fillStyle = INK; ctx.fillRect(0, H - 34, W, 3);
  text(ctx, 'KELA COUNTER', 12, H - 14, { font: MONO, size: 10, weight: '700' });
  text(ctx, String(data.realmName || '').toUpperCase().slice(0, 18), W - 12, H - 14, { font: MONO, size: 10, weight: '700', align: 'right' });

  // Mature sticker for self-reports
  if (data.isSelf) {
    ctx.save(); ctx.translate(W - 46, 46); ctx.rotate((6 * Math.PI) / 180);
    box(ctx, -38, -14, 76, 28, GREEN);
    text(ctx, 'MATURE', 0, 6, { size: 13, align: 'center' });
    ctx.restore();
  }
}

function drawIcon(ctx, icon, x, y, size, line = 2.2) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24);
  ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(ICONS[icon]?.path || ICONS.chai.path));
  ctx.restore();
}

// Square avatar like the app: duotone photo if allowed, else the icon on the person's colour
function drawAvatar(ctx, p, photo, x, y, size, line = 2) {
  box(ctx, x, y, size, size, p.color || BANANA, line);
  if (photo) {
    ctx.save(); ctx.beginPath(); ctx.rect(x + line, y + line, size - line * 2, size - line * 2); ctx.clip();
    ctx.filter = 'grayscale(1) contrast(1.35)';
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(photo, x + line, y + line, size - line * 2, size - line * 2);
    ctx.restore();
  } else {
    const s = size * 0.62;
    drawIcon(ctx, p.icon, x + (size - s) / 2, y + (size - s) / 2, s, size > 40 ? 2.2 : 2.4);
  }
}

function drawCrown(ctx, x, y, w) {
  const h = w * 0.62;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, h); ctx.lineTo(0, h * 0.25); ctx.lineTo(w * 0.27, h * 0.58); ctx.lineTo(w * 0.5, 0);
  ctx.lineTo(w * 0.73, h * 0.58); ctx.lineTo(w, h * 0.25); ctx.lineTo(w, h); ctx.closePath();
  ctx.fillStyle = BANANA; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

/**
 * Weekly leaderboard card, 1080x1920.
 * data: { realmName, week, daysLeft, lastSultan, rows: [{ name, color, icon, photoUrl, weekHalf, rank, isMe }] }
 */
export async function drawLeaderboardCard(canvas, data) {
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  try { await Promise.all([document.fonts.load(`20px ${HEAD}`), document.fonts.load(`700 12px ${MONO}`)]); } catch { /* fonts optional */ }
  const rows = data.rows || [];
  const top = rows[0] && rows[0].weekHalf > 0 ? rows[0] : null;
  const rest = (top ? rows.slice(1) : rows);
  const MAX_ROWS = top ? 6 : 7; // leaves room for "+N more" and the last-week sticker
  const shown = rest.slice(0, MAX_ROWS);
  const photos = await Promise.all([top, ...shown].map((p) => (p ? loadImage(p.photoUrl) : null)));

  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) {
    drawBanana(ctx, c * 56 + (r % 2) * 28, r * 56 + 10, 22, r % 2 ? 150 : -18, 0.14);
  }
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(1.5, 1.5, W - 3, H - 3);

  // Header strip
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 24);
  text(ctx, 'KELA LEADERBOARD', 12, 16, { font: MONO, size: 10, color: BANANA, weight: '700' });
  text(ctx, `WEEK ${data.week}`, W - 12, 16, { font: MONO, size: 10, color: BANANA, weight: '700', align: 'right' });

  // Realm name + subline
  const realm = String(data.realmName || '').toUpperCase();
  text(ctx, realm, 12, 58, { size: fitSize(ctx, realm, HEAD, 30, W - 24) });
  const days = data.daysLeft === 1 ? '1 DAY' : `${data.daysLeft} DAYS`;
  text(ctx, `WEEKLY KELE // RESETS IN ${days}`, 12, 74, { font: MONO, size: 9, weight: '700' });

  // Sultan block
  let y = 88;
  ctx.save();
  ctx.translate(W / 2, y + 44); ctx.rotate((-1.2 * Math.PI) / 180); ctx.translate(-W / 2, -(y + 44));
  ctx.fillStyle = INK; ctx.fillRect(17, y + 5, W - 29, 88);
  if (top) {
    box(ctx, 12, y, W - 29, 88, PINK);
    drawAvatar(ctx, top, photos[0], 24, y + 16, 56, 3);
    drawCrown(ctx, 30, y + 2, 26);
    const nm = String(top.name || '').toUpperCase();
    text(ctx, 'KELA SULTAN', 92, y + 28, { font: MONO, size: 9, weight: '700' });
    text(ctx, nm, 92, y + 54, { size: fitSize(ctx, nm, HEAD, 22, 110) });
    text(ctx, '#1', 92, y + 72, { font: MONO, size: 9, weight: '700' });
    const sc = kele(top.weekHalf);
    text(ctx, sc, W - 32, y + 58, { size: fitSize(ctx, sc, HEAD, 38, 70), align: 'right' });
    text(ctx, 'KELE', W - 32, y + 74, { font: MONO, size: 9, weight: '700', align: 'right' });
  } else {
    box(ctx, 12, y, W - 29, 88, PAPER);
    ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeRect(24, y + 16, 56, 56); ctx.setLineDash([]);
    text(ctx, '?', 52, y + 56, { size: 26, align: 'center' });
    text(ctx, 'KELA SULTAN', 92, y + 34, { font: MONO, size: 9, weight: '700' });
    text(ctx, 'VACANT', 92, y + 60, { size: 22 });
  }
  ctx.restore();

  // Other rows
  y = 196;
  const ROW = 32;
  const maxHalf = Math.max(1, ...rows.map((r) => r.weekHalf || 0));
  shown.forEach((r, i) => {
    const ry = y + i * (ROW + 4);
    box(ctx, 12, ry, W - 24, ROW, r.isMe ? BANANA : '#fff', 2);
    text(ctx, `#${r.rank}`, 20, ry + 21, { size: 12 });
    drawAvatar(ctx, r, photos[i + 1], 48, ry + 5, 22, 2);
    const nm = String(r.name || '').toUpperCase() + (r.isMe ? ' (YOU)' : '');
    text(ctx, nm, 78, ry + 15, { font: MONO, size: fitSize(ctx, nm, MONO, 10, 130), weight: '700' });
    const bw = 130 * ((r.weekHalf || 0) / maxHalf);
    ctx.fillStyle = '#E8E3D2'; ctx.fillRect(78, ry + 20, 130, 5);
    ctx.fillStyle = INK; ctx.fillRect(78, ry + 20, bw, 5);
    text(ctx, kele(r.weekHalf), W - 22, ry + 22, { size: 16, align: 'right' });
  });
  const more = rest.length - shown.length;
  const listEnd = y + shown.length * (ROW + 4);
  if (more > 0) text(ctx, `+ ${more} MORE IN THE REALM`, W / 2, listEnd + 12, { font: MONO, size: 9, weight: '700', align: 'center' });
  if (!rows.length) text(ctx, 'NO ONE HERE YET', W / 2, y + 20, { font: MONO, size: 10, weight: '700', align: 'center' });

  // Last week's sultan sticker
  if (data.lastSultan) {
    const lw = `LAST WEEK'S SULTAN: ${String(data.lastSultan).toUpperCase()}`;
    ctx.save(); ctx.translate(W / 2, H - 56); ctx.rotate((2 * Math.PI) / 180);
    ctx.font = `700 9px ${MONO}`; const sw = Math.min(W - 40, ctx.measureText(lw).width + 18);
    ctx.fillStyle = INK; ctx.fillRect(-sw / 2, -11, sw, 20);
    text(ctx, lw, 0, 3, { font: MONO, size: fitSize(ctx, lw, MONO, 9, sw - 14), color: BANANA, weight: '700', align: 'center' });
    ctx.restore();
  }

  // Footer
  ctx.fillStyle = INK; ctx.fillRect(0, H - 34, W, 3);
  text(ctx, 'KELA COUNTER', 12, H - 14, { font: MONO, size: 10, weight: '700' });
  text(ctx, 'WHO ATE A KELA TODAY?', W - 12, H - 14, { font: MONO, size: 10, weight: '700', align: 'right' });
}

export async function saveAndShare(canvas, fileName = 'kela-card.png', title = 'Kela Alert') {
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return 'shared'; } catch { /* cancelled: fall through to download */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
