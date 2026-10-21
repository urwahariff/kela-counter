// Shared game constants and helpers

export const COLORS = [
  { hex: '#FFE135', label: 'Banana yellow' },
  { hex: '#FF3EA5', label: 'Hot pink' },
  { hex: '#7CFF6B', label: 'Electric green' },
  { hex: '#8EC5FF', label: 'Sky blue' },
  { hex: '#FF8A3D', label: 'Orange' },
  { hex: '#C9A7FF', label: 'Lilac' }
];

export const ICONS = {
  chai: { label: 'Chai', path: 'M6 9h12l-1.5 11h-9zM6.8 13.5h10.4M10 2.5c-.8 1 .8 2-.2 3.5M14 2.5c-.8 1 .8 2-.2 3.5' },
  kite: { label: 'Kite', path: 'M12 2l7 8-7 8-7-8zM12 2v16M5 10h14M12 18c-1.5 1.2 1.5 2-.5 4' },
  samosa: { label: 'Samosa', path: 'M12 3.5L21 20H3zM4.6 17.2h14.8M9.5 13.5h.01M12 10h.01M14.5 13.5h.01' },
  bat: { label: 'Bat', path: 'M15 3l6 6-9.5 9.5a2 2 0 0 1-2.8 0l-1.2-1.2a2 2 0 0 1 0-2.8zM7.5 16.5L3 21M4 5a2 2 0 1 0 4 0 2 2 0 1 0-4 0' },
  jalebi: { label: 'Jalebi', path: 'M12 12a1.5 1.5 0 1 1 1.5 1.5A3 3 0 0 1 10.5 10.5a4.5 4.5 0 0 1 4.5-4.5 6 6 0 0 1 6 6 7.5 7.5 0 0 1-7.5 7.5A9 9 0 0 1 4.5 10.5' },
  lassi: { label: 'Lassi', path: 'M7 4h10l-1.5 17h-7zM7.6 10h8.8M14 4l2-2.5' },
  ball: { label: 'Ball', path: 'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M7 4.5c2.5 4.5 2.5 10.5 0 15M17 4.5c-2.5 4.5-2.5 10.5 0 15' },
  paan: { label: 'Paan', path: 'M12 21C5 17 3 11 5 6c3-2 5-1 7 1 2-2 4-3 7-1 2 5 0 11-7 15zM12 7v14' }
};

export const BANANA_PATH = 'M3 12c3 7 14 8 19-5-1.2-.2-2.2 0-3 .8C16 13.5 9.5 15 5 11.2 4.2 11 3.5 11.3 3 12z';

export const SEVERITIES = [
  { level: 1, label: 'Kacha Kela?', short: 'Small' },
  { level: 2, label: 'Dil pe le liya?', short: 'Medium' },
  { level: 3, label: 'BARRA KELA NA KARO??????', short: 'Barra kela' }
];

export const HISTORY_LABELS = { 1: 'Kacha kela', 2: 'Dil pe le liya', 3: 'Barra kela' };

export const MEMES = {
  1: ['Over that?', 'Really?'],
  2: ['Dil pe mat le yaar…', 'Oh, le liya'],
  3: ['Swallowed the', 'whole bunch'],
  self: ['At least', "you're honest"]
};

// half units -> "5.5", "2"
export function kele(half) {
  const n = (half || 0) / 2;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
export function splitKele(half) {
  const n = (half || 0) / 2;
  return { whole: String(Math.floor(n)), frac: n % 1 ? '.5' : '' };
}
export function keleStamp(half) {
  const n = (half || 0) / 2;
  return `+${kele(half)} ${n === 1 || n === 0.5 ? 'KELA' : 'KELE'}`;
}

// Pakistan time helpers (UTC+5, no daylight saving)
const PKT = 5 * 3600 * 1000;
export function pktWeekStart(date = new Date()) {
  const p = new Date(date.getTime() + PKT);
  const day = (p.getUTCDay() + 6) % 7; // Monday = 0
  const start = Date.UTC(p.getUTCFullYear(), p.getUTCMonth(), p.getUTCDate() - day);
  return new Date(start - PKT); // Monday 00:00 PKT, as a real instant
}
export function weekNumber(date = new Date()) {
  const p = new Date(date.getTime() + PKT);
  const d = new Date(Date.UTC(p.getUTCFullYear(), p.getUTCMonth(), p.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
export function daysToReset(date = new Date()) {
  const next = pktWeekStart(date).getTime() + 7 * 86400000;
  return Math.max(1, Math.ceil((next - date.getTime()) / 86400000));
}
export function dayLabel(iso) {
  const p = new Date(new Date(iso).getTime() + PKT);
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][p.getUTCDay()];
}
export function hoursLeft(iso) {
  return Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 3600000));
}
