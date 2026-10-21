// Draws the 9:16 Kela Alert card onto a canvas at 1080x1920.
// Layout is authored at 288x512 and scaled by 3.75.
import { BANANA_PATH, ICONS, MEMES } from './kela.js';

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

export async function saveAndShare(canvas, fileName = 'kela-card.png') {
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Kela Alert' }); return 'shared'; } catch { /* cancelled: fall through to download */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
