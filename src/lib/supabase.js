import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url, key) : null;

// Turn database errors into friendly messages
export function friendlyError(err) {
  const msg = (err && (err.message || String(err))) || 'Something went wrong';
  if (msg.startsWith('cooldown_until:')) {
    const until = new Date(msg.split('cooldown_until:')[1]);
    const mins = Math.max(1, Math.ceil((until - Date.now()) / 60000));
    return `Easy there. You're on cooldown for ${mins} more min.`;
  }
  const map = {
    not_signed_in: 'Sign in first.',
    no_profile: 'Make your profile first.',
    realm_not_found: 'No realm with that code.',
    not_a_member: "You're not in this realm.",
    not_admin: 'Only admins can do that.',
    only_admin: "You're the only admin. Make someone else admin before you leave.",
    use_leave: 'Use Leave realm to remove yourself.',
    cannot_confirm_own: "You can't confirm this one.",
    not_pending: 'This report is no longer pending.',
    eater_not_member: "That person isn't in this realm anymore.",
    use_self_report: 'Use "I ate a kela" to report yourself.'
  };
  const key = Object.keys(map).find((k) => msg.includes(k));
  return key ? map[key] : msg;
}

export function avatarUrl(path) {
  if (!path || !supabase) return null;
  const [file, query] = path.split('?');
  const { data } = supabase.storage.from('avatars').getPublicUrl(file);
  return query ? `${data.publicUrl}?${query}` : data.publicUrl;
}
