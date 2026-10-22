-- =====================================================================
-- Kela Counter — RESET
-- Deletes everything setup.sql created (all realms, reports, profiles data)
-- so setup.sql can be run again cleanly. Your Google sign-in settings and
-- uploaded photos are kept.
-- Run this, then run setup.sql.
-- =====================================================================

-- Stop the scheduled jobs (ignored if pg_cron or the jobs aren't there)
do $$ begin
  perform cron.unschedule(jobname) from cron.job where jobname like 'kela-%';
exception when others then null;
end $$;

-- Photo rules (the photo bucket itself is kept)
drop policy if exists "avatars: upload own" on storage.objects;
drop policy if exists "avatars: update own" on storage.objects;
drop policy if exists "avatars: delete own" on storage.objects;

-- Tables (and everything attached to them)
drop table if exists public.weekly_results, public.cooldowns, public.confirmations,
  public.report_meta, public.reports, public.memberships, public.realms, public.profiles cascade;

-- Functions
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'pkt_week_start','is_member','is_admin','shares_realm','new_invite_code','create_realm',
      'realm_preview','join_realm','make_admin','remove_member','leave_realm','close_week',
      'report_kela','reports_this_hour','confirm_report','delete_report','expire_pending',
      'get_leaderboard','get_pending','last_week_sultan','my_realms','my_stats','my_history')
  loop
    execute 'drop function if exists ' || f.sig || ' cascade';
  end loop;
end $$;
