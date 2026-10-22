-- =====================================================================
-- Kela Counter v1 — full database setup
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Safe to run once on a fresh project.
-- Kele are stored in HALF units: 1 = 0.5 kele, 2 = 1 kela, 6 = 3 kele.
-- Weeks run Monday 00:00 to Sunday 23:59 Pakistan time (Asia/Karachi).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 16),
  color text not null check (color in ('#FFE135','#FF3EA5','#7CFF6B','#8EC5FF','#FF8A3D','#C9A7FF')),
  icon text not null check (icon in ('chai','kite','samosa','bat','jalebi','lassi','ball','paan')),
  photo_path text,
  photo_on_cards boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.realms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 18),
  color text not null check (color in ('#FFE135','#FF3EA5','#7CFF6B','#8EC5FF','#FF8A3D','#C9A7FF')),
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  realm_id uuid not null references public.realms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  is_admin boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (realm_id, user_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  realm_id uuid not null references public.realms (id) on delete cascade,
  eater_id uuid not null references public.profiles (id) on delete cascade,
  severity smallint not null check (severity between 1 and 3),
  is_self boolean not null default false,
  half_kele smallint not null check (half_kele between 1 and 6),
  status text not null check (status in ('pending','counted','deleted')),
  week_start date not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  deleted_by uuid references public.profiles (id)
);
create index reports_realm_week on public.reports (realm_id, week_start);
create index reports_eater on public.reports (eater_id);

-- Who reported (the "feeder"). Never readable by the app in v1.
create table public.report_meta (
  report_id uuid primary key references public.reports (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index report_meta_reporter on public.report_meta (reporter_id, created_at);

create table public.confirmations (
  report_id uuid not null references public.reports (id) on delete cascade,
  confirmer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, confirmer_id)
);

create table public.cooldowns (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  until timestamptz not null
);

create table public.weekly_results (
  realm_id uuid not null references public.realms (id) on delete cascade,
  week_start date not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  half_kele integer not null,
  rank integer not null,
  is_sultan boolean not null default false,
  primary key (realm_id, week_start, user_id)
);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

create or replace function public.pkt_week_start(ts timestamptz default now())
returns date language sql stable as $$
  select date_trunc('week', ts at time zone 'Asia/Karachi')::date
$$;

create or replace function public.is_member(p_realm uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships
                 where realm_id = p_realm and user_id = auth.uid() and left_at is null)
$$;

create or replace function public.is_admin(p_realm uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships
                 where realm_id = p_realm and user_id = auth.uid() and left_at is null and is_admin)
$$;

create or replace function public.shares_realm(p_other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships a join memberships b on a.realm_id = b.realm_id
                 where a.user_id = auth.uid() and b.user_id = p_other
                   and a.left_at is null and b.left_at is null)
$$;

-- 6-character invite codes without look-alikes (no O/0, I/1/L)
create or replace function public.new_invite_code()
returns text language plpgsql volatile as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.realms where invite_code = code);
  end loop;
  return code;
end $$;

-- ---------------------------------------------------------------------
-- Row-level security (reads). All writes go through the functions below.
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.realms enable row level security;
alter table public.memberships enable row level security;
alter table public.reports enable row level security;
alter table public.report_meta enable row level security;
alter table public.confirmations enable row level security;
alter table public.cooldowns enable row level security;
alter table public.weekly_results enable row level security;

create policy "profiles: read self and realm mates" on public.profiles
  for select to authenticated using (id = auth.uid() or public.shares_realm(id));
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "realms: members read" on public.realms
  for select to authenticated using (public.is_member(id));
create policy "memberships: members read" on public.memberships
  for select to authenticated using (public.is_member(realm_id));
create policy "reports: members read" on public.reports
  for select to authenticated using (public.is_member(realm_id));
create policy "confirmations: members read" on public.confirmations
  for select to authenticated using (
    exists (select 1 from public.reports r where r.id = report_id and public.is_member(r.realm_id)));
create policy "weekly results: members read" on public.weekly_results
  for select to authenticated using (public.is_member(realm_id));
-- report_meta and cooldowns: no policies = no direct access from the app.

-- ---------------------------------------------------------------------
-- Realm actions
-- ---------------------------------------------------------------------

create or replace function public.create_realm(p_name text, p_color text)
returns public.realms language plpgsql security definer set search_path = public as $$
declare r realms;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from profiles where id = auth.uid()) then raise exception 'no_profile'; end if;
  insert into realms (name, color, invite_code, created_by)
  values (trim(p_name), p_color, new_invite_code(), auth.uid()) returning * into r;
  insert into memberships (realm_id, user_id, is_admin) values (r.id, auth.uid(), true);
  return r;
end $$;

-- Realm details shown before joining (works signed out, needs the code)
create or replace function public.realm_preview(p_code text)
returns json language sql stable security definer set search_path = public as $$
  with r as (select * from realms where invite_code = upper(trim(p_code))),
  wk as (
    select rp.eater_id, sum(rp.half_kele) h, max(coalesce(rp.resolved_at, rp.created_at)) t
    from reports rp join r on rp.realm_id = r.id
    where rp.status = 'counted' and rp.week_start = pkt_week_start()
    group by rp.eater_id order by h desc, t asc limit 1)
  select case when not exists (select 1 from r) then null else json_build_object(
    'id', r.id, 'name', r.name, 'color', r.color, 'code', r.invite_code,
    'created_by', (select name from profiles where id = r.created_by),
    'weeks_old', greatest(1, ((current_date - r.created_at::date) / 7) + 1),
    'kele_half', (select coalesce(sum(half_kele), 0) from reports where realm_id = r.id and status = 'counted'),
    'member_count', (select count(*) from memberships where realm_id = r.id and left_at is null),
    'sultan', (select json_build_object('name', p.name, 'half', wk.h) from wk join profiles p on p.id = wk.eater_id),
    'members', (select coalesce(json_agg(json_build_object('name', p.name, 'color', p.color, 'icon', p.icon) order by m.joined_at), '[]'::json)
                from memberships m join profiles p on p.id = m.user_id
                where m.realm_id = r.id and m.left_at is null),
    'is_member', exists (select 1 from memberships where realm_id = r.id and user_id = auth.uid() and left_at is null)
  ) end from r
$$;

create or replace function public.join_realm(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_realm uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from profiles where id = auth.uid()) then raise exception 'no_profile'; end if;
  select id into v_realm from realms where invite_code = upper(trim(p_code));
  if v_realm is null then raise exception 'realm_not_found'; end if;
  insert into memberships (realm_id, user_id) values (v_realm, auth.uid())
  on conflict (realm_id, user_id) do update set left_at = null, joined_at = now(), is_admin = false
    where memberships.left_at is not null;
  return v_realm;
end $$;

create or replace function public.make_admin(p_realm uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin(p_realm) then raise exception 'not_admin'; end if;
  update memberships set is_admin = true where realm_id = p_realm and user_id = p_user and left_at is null;
  if not found then raise exception 'not_a_member'; end if;
end $$;

create or replace function public.remove_member(p_realm uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin(p_realm) then raise exception 'not_admin'; end if;
  if p_user = auth.uid() then raise exception 'use_leave'; end if;
  update memberships set left_at = now(), is_admin = false
  where realm_id = p_realm and user_id = p_user and left_at is null;
end $$;

create or replace function public.leave_realm(p_realm uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_member(p_realm) then raise exception 'not_a_member'; end if;
  if is_admin(p_realm)
     and (select count(*) from memberships where realm_id = p_realm and is_admin and left_at is null) = 1
     and exists (select 1 from memberships where realm_id = p_realm and left_at is null and user_id <> auth.uid()) then
    raise exception 'only_admin';
  end if;
  update memberships set left_at = now(), is_admin = false
  where realm_id = p_realm and user_id = auth.uid();
end $$;

-- ---------------------------------------------------------------------
-- Weekly close (Sultan crowning). Re-runnable for any week.
-- Ties: shared rank; the crown goes to whoever reached the total first.
-- ---------------------------------------------------------------------

create or replace function public.close_week(p_week date, p_realm uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from weekly_results where week_start = p_week and (p_realm is null or realm_id = p_realm);
  insert into weekly_results (realm_id, week_start, user_id, half_kele, rank, is_sultan)
  select realm_id, p_week, eater_id, h,
         rank() over (partition by realm_id order by h desc),
         row_number() over (partition by realm_id order by h desc, t asc) = 1
  from (select realm_id, eater_id, sum(half_kele)::int h, max(coalesce(resolved_at, created_at)) t
        from reports
        where status = 'counted' and week_start = p_week and (p_realm is null or realm_id = p_realm)
        group by realm_id, eater_id) s;
end $$;

-- ---------------------------------------------------------------------
-- Reporting
-- ---------------------------------------------------------------------

create or replace function public.report_kela(p_realm uuid, p_eater uuid, p_severity int, p_self boolean default false)
returns public.reports language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_until timestamptz;
  v_count int;
  r reports;
begin
  if me is null then raise exception 'not_signed_in'; end if;
  if not is_member(p_realm) then raise exception 'not_a_member'; end if;
  if p_severity not between 1 and 3 then raise exception 'bad_severity'; end if;
  if p_self and p_eater <> me then raise exception 'self_must_be_you'; end if;
  if not p_self and p_eater = me then raise exception 'use_self_report'; end if;
  if not exists (select 1 from memberships where realm_id = p_realm and user_id = p_eater and left_at is null) then
    raise exception 'eater_not_member';
  end if;

  select until into v_until from cooldowns where user_id = me;
  if v_until is not null and v_until > now() then
    raise exception 'cooldown_until:%', to_char(v_until at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  end if;
  select count(*) into v_count from report_meta where reporter_id = me and created_at > now() - interval '60 minutes';
  if v_count >= 3 then
    insert into cooldowns (user_id, until) values (me, now() + interval '15 minutes')
    on conflict (user_id) do update set until = excluded.until
    returning until into v_until;
    raise exception 'cooldown_until:%', to_char(v_until at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  end if;

  insert into reports (realm_id, eater_id, severity, is_self, half_kele, status, week_start, resolved_at)
  values (
    p_realm, p_eater, p_severity, p_self,
    case when p_self then p_severity else p_severity * 2 end,
    case when not p_self and p_severity = 3 then 'pending' else 'counted' end,
    pkt_week_start(),
    case when not p_self and p_severity = 3 then null else now() end
  ) returning * into r;
  insert into report_meta (report_id, reporter_id) values (r.id, me);
  return r;
end $$;

create or replace function public.reports_this_hour()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'count', (select count(*) from report_meta where reporter_id = auth.uid() and created_at > now() - interval '60 minutes'),
    'cooldown_until', (select until from cooldowns where user_id = auth.uid() and until > now()))
$$;

create or replace function public.confirm_report(p_report uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r reports;
begin
  select * into r from reports where id = p_report for update;
  if r.id is null or r.status <> 'pending' then raise exception 'not_pending'; end if;
  if not is_member(r.realm_id) then raise exception 'not_a_member'; end if;
  if r.eater_id = auth.uid() then raise exception 'cannot_confirm_own'; end if;
  if exists (select 1 from report_meta where report_id = p_report and reporter_id = auth.uid()) then
    raise exception 'cannot_confirm_own';
  end if;
  insert into confirmations (report_id, confirmer_id) values (p_report, auth.uid()) on conflict do nothing;
  update reports set status = 'counted', resolved_at = now() where id = p_report;
  if r.week_start < pkt_week_start() then perform close_week(r.week_start, r.realm_id); end if;
end $$;

create or replace function public.delete_report(p_report uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r reports;
begin
  select * into r from reports where id = p_report;
  if r.id is null then raise exception 'not_found'; end if;
  if not is_admin(r.realm_id) then raise exception 'not_admin'; end if;
  update reports set status = 'deleted', deleted_by = auth.uid(), resolved_at = now() where id = p_report;
  if r.week_start < pkt_week_start() then perform close_week(r.week_start, r.realm_id); end if;
end $$;

-- Unconfirmed Barra kele drop to +2 after 24 hours
create or replace function public.expire_pending()
returns void language plpgsql security definer set search_path = public as $$
declare rec record;
begin
  for rec in
    update reports set half_kele = 4, status = 'counted', resolved_at = now()
    where status = 'pending' and created_at < now() - interval '24 hours'
    returning realm_id, week_start
  loop
    if rec.week_start < pkt_week_start() then perform close_week(rec.week_start, rec.realm_id); end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Read functions used by the app screens
-- ---------------------------------------------------------------------

-- Weekly leaderboard for one realm (every active member, including 0 kele)
create or replace function public.get_leaderboard(p_realm uuid)
returns table (user_id uuid, name text, color text, icon text, photo_path text, photo_on_cards boolean, is_admin boolean,
               is_creator boolean, week_half int, all_time_half int, mature boolean, rank int)
language sql stable security definer set search_path = public as $$
  with base as (
    select m.user_id, p.name, p.color, p.icon, p.photo_path, p.photo_on_cards, m.is_admin,
           (rl.created_by = m.user_id) is_creator,
           coalesce((select sum(half_kele) from reports r where r.realm_id = p_realm and r.eater_id = m.user_id
                     and r.status = 'counted' and r.week_start = pkt_week_start()), 0)::int week_half,
           coalesce((select sum(half_kele) from reports r where r.realm_id = p_realm and r.eater_id = m.user_id
                     and r.status = 'counted'), 0)::int all_time_half,
           exists (select 1 from reports r where r.eater_id = m.user_id and r.is_self and r.status = 'counted') mature,
           (select max(coalesce(resolved_at, created_at)) from reports r where r.realm_id = p_realm
              and r.eater_id = m.user_id and r.status = 'counted' and r.week_start = pkt_week_start()) reached_at
    from memberships m join profiles p on p.id = m.user_id join realms rl on rl.id = m.realm_id
    where m.realm_id = p_realm and m.left_at is null and is_member(p_realm))
  select user_id, name, color, icon, photo_path, photo_on_cards, is_admin, is_creator, week_half, all_time_half, mature,
         (rank() over (order by week_half desc))::int
  from base order by week_half desc, reached_at asc nulls last, name
$$;

create or replace function public.get_pending(p_realm uuid)
returns table (report_id uuid, eater_id uuid, eater_name text, eater_color text, eater_icon text,
               severity int, created_at timestamptz, expires_at timestamptz, can_confirm boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.eater_id, p.name, p.color, p.icon, r.severity, r.created_at, r.created_at + interval '24 hours',
         (r.eater_id <> auth.uid() and not exists (select 1 from report_meta mm where mm.report_id = r.id and mm.reporter_id = auth.uid()))
  from reports r join profiles p on p.id = r.eater_id
  where r.realm_id = p_realm and r.status = 'pending' and is_member(p_realm)
  order by r.created_at
$$;

create or replace function public.last_week_sultan(p_realm uuid)
returns text language sql stable security definer set search_path = public as $$
  select p.name from weekly_results w join profiles p on p.id = w.user_id
  where w.realm_id = p_realm and w.week_start = pkt_week_start() - 7 and w.is_sultan and is_member(p_realm)
$$;

-- Home: one row per realm I'm in
create or replace function public.my_realms()
returns table (realm_id uuid, name text, color text, invite_code text, member_count int, my_rank int,
               my_week_half int, leader_name text, leader_half int, i_lead boolean, pending_for_me int,
               member_colors text[])
language sql stable security definer set search_path = public as $$
  select rl.id, rl.name, rl.color, rl.invite_code,
    (select count(*) from memberships x where x.realm_id = rl.id and x.left_at is null)::int,
    (select lb.rank from get_leaderboard(rl.id) lb where lb.user_id = auth.uid()),
    (select lb.week_half from get_leaderboard(rl.id) lb where lb.user_id = auth.uid()),
    (select lb.name from get_leaderboard(rl.id) lb where lb.week_half > 0 limit 1),
    (select lb.week_half from get_leaderboard(rl.id) lb where lb.week_half > 0 limit 1),
    coalesce((select lb.user_id = auth.uid() from get_leaderboard(rl.id) lb where lb.week_half > 0 limit 1), false),
    (select count(*) from get_pending(rl.id) gp where gp.can_confirm)::int,
    array(select p.color from memberships x join profiles p on p.id = x.user_id
          where x.realm_id = rl.id and x.left_at is null order by x.joined_at limit 5)
  from memberships m join realms rl on rl.id = m.realm_id
  where m.user_id = auth.uid() and m.left_at is null
  order by m.joined_at
$$;

create or replace function public.my_stats()
returns json language sql stable security definer set search_path = public as $$
  with wk as (
    select r.realm_id, sum(r.half_kele)::int h from reports r
    where r.eater_id = auth.uid() and r.status = 'counted' and r.week_start = pkt_week_start()
    group by r.realm_id order by h desc limit 1)
  select json_build_object(
    'week_best_half', coalesce((select h from wk), 0),
    'week_best_realm', (select rl.name from wk join realms rl on rl.id = wk.realm_id),
    'all_time_half', (select coalesce(sum(half_kele), 0) from reports where eater_id = auth.uid() and status = 'counted'),
    'last_kela_at', (select max(coalesce(resolved_at, created_at)) from reports where eater_id = auth.uid() and status = 'counted'),
    'joined_at', (select created_at from profiles where id = auth.uid()),
    'realm_count', (select count(*) from memberships where user_id = auth.uid() and left_at is null),
    'leading_count', (select count(*) from my_realms() where i_lead),
    'mature', exists (select 1 from reports where eater_id = auth.uid() and is_self and status = 'counted'),
    'sultan_badge', exists (select 1 from weekly_results where user_id = auth.uid() and is_sultan))
$$;

create or replace function public.my_history()
returns table (report_id uuid, severity int, is_self boolean, half_kele int, realm_name text,
               created_at timestamptz, this_week boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.severity, r.is_self, r.half_kele, rl.name, r.created_at, r.week_start = pkt_week_start()
  from reports r join realms rl on rl.id = r.realm_id
  where r.eater_id = auth.uid() and r.status = 'counted'
  order by r.created_at desc limit 200
$$;

-- ---------------------------------------------------------------------
-- Permissions for the app's two roles
-- ---------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on function public.close_week(date, uuid) from public, anon, authenticated;
revoke all on function public.expire_pending() from public, anon, authenticated;
revoke all on function public.new_invite_code() from public, anon, authenticated;
grant execute on function public.realm_preview(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Live updates for the leaderboard
-- ---------------------------------------------------------------------

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.reports, public.memberships;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Photo storage: public bucket, 1 MB images, each user writes only their own file
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

-- Photo uploads overwrite (upsert), which needs to read the existing file first
create policy "avatars: read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name = auth.uid()::text || '.webp');
create policy "avatars: update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text || '.webp');
create policy "avatars: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text || '.webp');

-- ---------------------------------------------------------------------
-- Scheduled jobs (pg_cron runs in UTC)
-- ---------------------------------------------------------------------

create extension if not exists pg_cron;

select cron.schedule('kela-expire-pending', '*/15 * * * *', $$select public.expire_pending()$$);
-- Sunday 19:00 UTC = Monday 00:00 PKT: close the week that just ended
select cron.schedule('kela-weekly-close', '0 19 * * 0', $$select public.close_week(public.pkt_week_start(now()) - 7)$$);
