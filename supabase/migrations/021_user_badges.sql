-- ============================================================
-- PRONOFOOT — Migration 021 : Badges & trophées utilisateur
-- ============================================================
-- Table user_badges : lie un utilisateur à un badge décerné.
-- Idempotente : peut être relancée sans risque (IF NOT EXISTS).
-- ============================================================

-- Table principale : badges obtenus par un utilisateur
create table if not exists public.user_badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  badge_code  text not null,
  awarded_at  timestamptz not null default now(),
  -- Un badge ne peut être décerné qu'une seule fois par utilisateur
  unique (user_id, badge_code)
);

create index if not exists user_badges_user_idx on public.user_badges (user_id);
create index if not exists user_badges_badge_idx on public.user_badges (badge_code);

-- ============================================================
-- RPC : award_badge — idempotente, retourne true si nouveau
-- ============================================================
create or replace function public.award_badge(p_user_id uuid, p_badge_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted boolean := false;
begin
  insert into public.user_badges (user_id, badge_code)
  values (p_user_id, p_badge_code)
  on conflict (user_id, badge_code) do nothing;
  get diagnostics v_inserted = row_count;
  -- row_count en INSERT ... ON CONFLICT DO NOTHING renvoie 1 si nouveau, 0 sinon
  -- (Postgres >= 9.5 : row_count reflète effectivement l'insertion)
  return v_inserted > 0;
end;
$$;

-- La fonction est appelée côté serveur (service role) uniquement,
-- donc pas de grant direct aux utilisateurs anonymes/authenticated.

-- ============================================================
-- Vue : stats agrégées pour le calcul des badges
-- ============================================================
create or replace view public.v_user_badge_stats
with (security_invoker = on)
as
select
  pr.id as user_id,
  pr.username,
  pr.total_points,
  -- Total pronos
  coalesce((select count(*) from public.predictions pd where pd.user_id = pr.id), 0)::int as total_predictions,
  -- Scores exacts
  coalesce((select count(*) from public.predictions pd where pd.user_id = pr.id and pd.points = 5), 0)::int as exact_scores,
  -- Bonnes issues (3 pts)
  coalesce((select count(*) from public.predictions pd where pd.user_id = pr.id and pd.points = 3), 0)::int as correct_outcomes,
  -- Plus longue série de bons pronos consécutifs
  coalesce((
    with recursive streaks as (
      select
        m.match_date,
        pd.points,
        case when pd.points >= 3 then 1 else 0 end as is_good,
        1 as run_length,
        m.match_date as start_date
      from public.predictions pd
      join public.matches m on m.id = pd.match_id
      where pd.user_id = pr.id and pd.points is not null
      order by m.match_date asc
      limit 1
    ),
    chain(s, last_date, last_run, max_run) as (
      select 1, match_date, is_good, is_good from streaks
      union all
      select c.s + 1, m.match_date, case when pd.points >= 3 then c.last_run + 1 else 0 end,
             greatest(c.max_run, case when pd.points >= 3 then c.last_run + 1 else 0 end)
      from chain c
      join public.predictions pd on pd.user_id = pr.id
      join public.matches m on m.id = pd.match_id
      where m.match_date > c.last_date
    )
    select max(max_run) from chain
  ), 0)::int as longest_streak,
  -- Pronos Cameroun / CAN (équipes camerounaises uniquement, code équipe à durcir plus tard)
  coalesce((select count(*) from public.predictions pd
            join public.matches m on m.id = pd.match_id
            where pd.user_id = pr.id
              and (lower(m.home_team) like '%cameroun%' or lower(m.away_team) like '%cameroun%'
                   or lower(m.home_team) like '%cameroon%' or lower(m.away_team) like '%cameroon%'
                   or m.league in ('CAN', 'AFCON'))), 0)::int as cameroon_pronos,
  -- Jours actifs distincts
  coalesce((
    select count(distinct date_trunc('day', m.match_date))
    from public.predictions pd
    join public.matches m on m.id = pd.match_id
    where pd.user_id = pr.id
  ), 0)::int as active_days
from public.profiles pr;

-- grant select sur la vue aux utilisateurs authentifiés
grant select on public.v_user_badge_stats to authenticated, anon;

-- ============================================================
-- RLS sur user_badges : un user ne lit que SES badges
-- (lecture publique du profil = OK, mais on reste restrictif par défaut)
-- ============================================================
alter table public.user_badges enable row level security;

drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own"
on public.user_badges
for select
to authenticated
using (user_id = auth.uid());

-- La lecture publique du profil joueur passe par une vue dédiée (ci-dessous)
-- qui expose uniquement user_id + badge_code + awarded_at (pas d'info sensible).

create or replace view public.v_user_public_badges
with (security_invoker = on)
as
select user_id, badge_code, awarded_at
from public.user_badges;

grant select on public.v_user_public_badges to authenticated, anon;

-- ============================================================
-- Attribution automatique du badge 'debutant' à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, is_admin)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      'joueur_' || substr(new.id::text, 1, 8)
    ),
    new.raw_user_meta_data->>'avatar_url',
    false
  )
  on conflict (id) do nothing;

  -- Badge de bienvenue
  perform public.award_badge(new.id, 'debutant');

  return new;
end;
$$;
