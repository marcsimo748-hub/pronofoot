-- ============================================================
-- PRONOFOOT — Migration 001 : Schéma complet
-- Tables, index, RLS, triggers et fonctions métier.
-- Idempotent : peut être relancé sans risque.
-- ============================================================

-- ==================== PROFILS ====================
-- Prolonge auth.users (jamais de données sensibles ici : l'email reste dans Auth)
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  avatar_url   text,
  is_admin     boolean not null default false,
  total_points integer not null default 0,
  created_at   timestamptz not null default now()
);

-- Fonction utilitaire : l'utilisateur courant est-il admin ? (utilisée par les policies)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select pr.is_admin from public.profiles pr where pr.id = auth.uid()),
    false
  );
$$;

-- Création automatique du profil à l'inscription
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==================== MATCHS ====================
create table if not exists public.matches (
  id           uuid primary key default gen_random_uuid(),
  external_id  text unique,                    -- id d'origine (seed) ou fixture API-FOOTBALL
  league       text not null,                  -- champions | premier | laliga | seriea | ligue1 | bundesliga
  season       int,
  match_date   timestamptz not null,
  home_team    text not null,
  away_team    text not null,
  home_score   int,
  away_score   int,
  status       text not null default 'scheduled', -- scheduled|live|finished|missed|archived
  round        text,
  source       text not null default 'seed',   -- seed | api | manual
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_matches_league_date on public.matches (league, match_date);
create index if not exists idx_matches_status on public.matches (status);
create index if not exists idx_matches_date on public.matches (match_date desc);

-- ==================== PRONOSTICS ====================
create table if not exists public.predictions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  match_id      uuid not null references public.matches(id) on delete cascade,
  home_score    int not null check (home_score between 0 and 99),
  away_score    int not null check (away_score between 0 and 99),
  points_earned int not null default 0,
  calculated    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists idx_predictions_user on public.predictions (user_id);
create index if not exists idx_predictions_match on public.predictions (match_id);

-- Verrou métier : impossible de pronostiquer/modifier un score après le coup d'envoi
-- (le calcul des points reste possible : seuls les scores sont verrouillés)
create or replace function public.enforce_prediction_window()
returns trigger
language plpgsql
as $$
declare
  m public.matches;
  is_service boolean;
begin
  is_service := coalesce(
    (current_setting('request.jwt.claims', true))::json->>'role' = 'service_role',
    false
  );
  if is_service then
    return new; -- le serveur (settlement, correction admin) passe toujours
  end if;

  select * into m from public.matches where id = new.match_id;
  if m.id is null then
    raise exception 'Match introuvable';
  end if;
  if m.match_date <= now() or m.home_score is not null then
    raise exception 'Le pronostic est verrouillé : le match a déjà commencé.';
  end if;
  if tg_op = 'UPDATE' and new.home_score = old.home_score and new.away_score = old.away_score then
    return new; -- mise à jour neutre (ex : recalcul des points)
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prediction_window on public.predictions;
create trigger trg_prediction_window
  before insert or update on public.predictions
  for each row execute function public.enforce_prediction_window();

-- ==================== BONUS DE SAISON ====================
create table if not exists public.bonus_predictions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  category      text not null,   -- champion_premier, ucl_winner, top_scorer...
  answer        text not null,
  points_earned int not null default 0,
  settled       boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (user_id, category)
);

create index if not exists idx_bonus_user on public.bonus_predictions (user_id);

-- ==================== SCORES LIVE (cache API-FOOTBALL) ====================
create table if not exists public.live_scores (
  id          text primary key,           -- fixture id API ou id de test
  league      text,
  match_date  timestamptz,
  home_team   text not null,
  away_team   text not null,
  home_score  int,
  away_score  int,
  status      text,                       -- NS|1H|HT|2H|ET|FT
  elapsed     int,
  raw         jsonb,
  updated_at  timestamptz not null default now()
);

create index if not exists idx_live_status on public.live_scores (status);

-- ==================== NEWS (cache GNews / Google News RSS) ====================
create table if not exists public.news (
  id           text primary key,          -- md5(url)
  title        text not null,
  description text,
  url          text not null,
  image_url    text,
  source       text,
  published_at timestamptz,
  fetched_at   timestamptz not null default now()
);

create index if not exists idx_news_published on public.news (published_at desc);

-- ==================== MUSIQUE ====================
create table if not exists public.songs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  artist     text,
  cover_url  text,
  audio_url  text not null,             -- URL publique du Storage bucket `songs`
  duration   int,                       -- secondes
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.playlist_songs (
  playlist_id uuid references public.playlists(id) on delete cascade,
  song_id     uuid references public.songs(id) on delete cascade,
  position    int not null default 0,
  primary key (playlist_id, song_id)
);

-- ==================== HISTORIQUE CHAT IA ====================
create table if not exists public.chat_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_user on public.chat_history (user_id, created_at desc);

-- ==================== GROUPES D'AMIS ====================
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  owner_id    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id  uuid references public.groups(id) on delete cascade,
  user_id   uuid references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ==================== RÉGLAGES SITE (admin : thème, bannières, annonce...) ====================
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ==================== updated_at automatique ====================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_matches_updated on public.matches;
create trigger trg_matches_updated before update on public.matches
  for each row execute function public.set_updated_at();

drop trigger if exists trg_predictions_updated on public.predictions;
create trigger trg_predictions_updated before update on public.predictions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_live_updated on public.live_scores;
create trigger trg_live_updated before update on public.live_scores
  for each row execute function public.set_updated_at();

-- ============================================================
-- FONCTIONS MÉTIER (calcul automatique des points, classements)
-- ============================================================

-- Calcule les points de tous les pronostics d'un match dont le résultat est connu,
-- puis rafraîchit le total des joueurs concernés. Appelée dès qu'un résultat arrive.
create or replace function public.settle_match(p_match_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.matches;
  affected int := 0;
begin
  select * into m from public.matches where id = p_match_id;
  if m.id is null or m.home_score is null or m.away_score is null then
    return 0;
  end if;

  update public.predictions p
     set points_earned = case
           when p.home_score = m.home_score and p.away_score = m.away_score then 5
           when sign(p.home_score - p.away_score) = sign(m.home_score - m.away_score) then 3
           else 0
         end,
         calculated = true
   where p.match_id = p_match_id;
  get diagnostics affected = row_count;

  -- Rafraîchit les totaux uniquement des joueurs concernés
  update public.profiles pr
     set total_points =
         coalesce((select sum(points_earned) from public.predictions where user_id = pr.id and calculated), 0)
       + coalesce((select sum(points_earned) from public.bonus_predictions where user_id = pr.id and settled), 0)
   where pr.id in (select user_id from public.predictions where match_id = p_match_id);

  return affected;
end;
$$;

-- Enregistre un résultat de match + déclenche le calcul des points (tout-en-un)
create or replace function public.set_match_result(p_match_id uuid, p_home int, p_away int)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  nb int;
begin
  update public.matches
     set home_score = p_home, away_score = p_away, status = 'finished'
   where id = p_match_id;
  nb := public.settle_match(p_match_id);
  return nb;
end;
$$;

-- Clôture un bonus de saison : distribue les points aux bonnes réponses
create or replace function public.settle_bonus(p_category text, p_answer text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  nb int := 0;
begin
  update public.bonus_predictions b
     set points_earned = case when lower(trim(b.answer)) = lower(trim(p_answer)) then 1 else 0 end * (
           select points from (values
             ('champion_premier', 50), ('champion_laliga', 50), ('champion_seriea', 50),
             ('champion_ligue1', 50), ('champion_bundesliga', 50),
             ('cup_premier', 30), ('cup_laliga', 30), ('cup_seriea', 30),
             ('cup_ligue1', 30), ('cup_bundesliga', 30),
             ('ucl_winner', 75), ('ucl_finalist', 30), ('top_scorer', 25)
           ) as v(category, points) where v.category = p_category
         ),
         settled = true
   where b.category = p_category;
  get diagnostics nb = row_count;

  update public.profiles pr
     set total_points =
         coalesce((select sum(points_earned) from public.predictions where user_id = pr.id and calculated), 0)
       + coalesce((select sum(points_earned) from public.bonus_predictions where user_id = pr.id and settled), 0)
   where pr.id in (select user_id from public.bonus_predictions where category = p_category);

  return nb;
end;
$$;

-- Nettoyage automatique :
--  • matchs passés sans résultat → 'missed' (verrouillés, retirés de la liste à pronostiquer)
--  • 'missed' > 7 jours → 'archived'
--  • 'finished' > 30 jours → 'archived' (l'historique récent reste visible)
create or replace function public.cleanup_passed_matches()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.matches set status = 'missed'
   where status = 'scheduled' and match_date < now();

  update public.matches set status = 'archived'
   where status = 'missed' and match_date < now() - interval '7 days';

  update public.matches set status = 'archived'
   where status = 'finished' and match_date < now() - interval '30 days';
end;
$$;

-- Rejoindre un groupe privé via son code d'invitation
create or replace function public.join_group(p_code text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;
  select * into g from public.groups where upper(invite_code) = upper(trim(p_code));
  if g.id is null then
    raise exception 'Code de groupe invalide';
  end if;
  insert into public.group_members (group_id, user_id)
  values (g.id, auth.uid())
  on conflict do nothing;
  return g;
end;
$$;

-- Classement par championnat (points gagnés sur les matchs de cette ligue)
create or replace function public.get_league_standings(p_league text)
returns table (user_id uuid, username text, avatar_url text, points bigint, preds bigint)
language sql
stable
security definer
set search_path = public
as $$
  select pr.id, pr.username, pr.avatar_url,
         coalesce(sum(pd.points_earned), 0),
         count(pd.id)
    from public.profiles pr
    left join public.predictions pd on pd.user_id = pr.id and pd.calculated
    left join public.matches m on m.id = pd.match_id and m.league = p_league
   group by pr.id, pr.username, pr.avatar_url
  having count(pd.id) > 0 and coalesce(sum(case when m.league = p_league then pd.points_earned else 0 end), 0) > 0
   order by 4 desc, pr.username asc
   limit 100;
$$;

-- Classement mensuel (points gagnés sur les matchs du mois en cours)
create or replace function public.get_monthly_standings(p_month date)
returns table (user_id uuid, username text, avatar_url text, points bigint, preds bigint)
language sql
stable
security definer
set search_path = public
as $$
  select pr.id, pr.username, pr.avatar_url,
         coalesce(sum(pd.points_earned), 0),
         count(pd.id)
    from public.profiles pr
    join public.predictions pd on pd.user_id = pr.id and pd.calculated
    join public.matches m on m.id = pd.match_id
   where date_trunc('month', m.match_date) = p_month::timestamptz
   group by pr.id, pr.username, pr.avatar_url
   order by 4 desc, pr.username asc
   limit 100;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.matches           enable row level security;
alter table public.predictions       enable row level security;
alter table public.bonus_predictions enable row level security;
alter table public.live_scores       enable row level security;
alter table public.news              enable row level security;
alter table public.songs             enable row level security;
alter table public.playlists         enable row level security;
alter table public.playlist_songs    enable row level security;
alter table public.chat_history      enable row level security;
alter table public.groups            enable row level security;
alter table public.group_members     enable row level security;
alter table public.site_settings     enable row level security;

-- --- PROFILS : lisibles par tous (classements), modifiables par soi-même SANS auto-promotion admin ---
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = public.is_admin()); -- impossible de s'auto-promouvoir

-- --- MATCHS : lecture publique, écriture uniquement serveur (service_role) ---
drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches for select using (true);

-- --- PRONOSTICS : chacun voit et modifie LES SIENS ---
drop policy if exists predictions_select_own on public.predictions;
create policy predictions_select_own on public.predictions for select using (auth.uid() = user_id);

drop policy if exists predictions_insert_own on public.predictions;
create policy predictions_insert_own on public.predictions for insert with check (auth.uid() = user_id);

drop policy if exists predictions_update_own on public.predictions;
create policy predictions_update_own on public.predictions for update using (auth.uid() = user_id);

drop policy if exists predictions_delete_own on public.predictions;
create policy predictions_delete_own on public.predictions for delete using (auth.uid() = user_id);

-- --- BONUS : idem pronostics ---
drop policy if exists bonus_select_own on public.bonus_predictions;
create policy bonus_select_own on public.bonus_predictions for select using (auth.uid() = user_id);

drop policy if exists bonus_insert_own on public.bonus_predictions;
create policy bonus_insert_own on public.bonus_predictions for insert with check (auth.uid() = user_id);

drop policy if exists bonus_update_own on public.bonus_predictions;
create policy bonus_update_own on public.bonus_predictions for update using (auth.uid() = user_id);

-- --- CACHE SCORES LIVE / NEWS / MUSIQUE / RÉGLAGES : lecture publique, écriture serveur ---
drop policy if exists live_scores_select on public.live_scores;
create policy live_scores_select on public.live_scores for select using (true);

drop policy if exists news_select on public.news;
create policy news_select on public.news for select using (true);

drop policy if exists songs_select on public.songs;
create policy songs_select on public.songs for select using (true);

drop policy if exists playlists_select on public.playlists;
create policy playlists_select on public.playlists for select using (true);

drop policy if exists playlist_songs_select on public.playlist_songs;
create policy playlist_songs_select on public.playlist_songs for select using (true);

drop policy if exists site_settings_select on public.site_settings;
create policy site_settings_select on public.site_settings for select using (true);

-- --- CHAT IA : historique privé ---
drop policy if exists chat_select_own on public.chat_history;
create policy chat_select_own on public.chat_history for select using (auth.uid() = user_id);

drop policy if exists chat_insert_own on public.chat_history;
create policy chat_insert_own on public.chat_history for insert with check (auth.uid() = user_id);

drop policy if exists chat_delete_own on public.chat_history;
create policy chat_delete_own on public.chat_history for delete using (auth.uid() = user_id);

-- --- GROUPES : visibles des connectés, création libre, adhésion via code ---
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups for select to authenticated using (true);

drop policy if exists groups_insert_own on public.groups;
create policy groups_insert_own on public.groups for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists groups_delete_own on public.groups;
create policy groups_delete_own on public.groups for delete to authenticated using (owner_id = auth.uid());

drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members for select to authenticated using (true);

drop policy if exists group_members_insert_own on public.group_members;
create policy group_members_insert_own on public.group_members for insert to authenticated with check (user_id = auth.uid());

drop policy if exists group_members_delete_own on public.group_members;
create policy group_members_delete_own on public.group_members for delete to authenticated using (user_id = auth.uid());

-- ============================================================
-- STORAGE — buckets publics `songs` (MP3) et `media` (images)
-- Upload direct depuis le panneau admin (évite la limite 4.5 Mo de Vercel)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('songs', 'songs', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists storage_songs_read on storage.objects;
create policy storage_songs_read on storage.objects for select using (bucket_id in ('songs', 'media'));

drop policy if exists storage_songs_admin_write on storage.objects;
create policy storage_songs_admin_write on storage.objects for insert to authenticated
  with check ((bucket_id = 'songs' or bucket_id = 'media') and public.is_admin());

drop policy if exists storage_media_admin_delete on storage.objects;
create policy storage_media_admin_delete on storage.objects for delete to authenticated
  using ((bucket_id = 'songs' or bucket_id = 'media') and public.is_admin());

-- ============================================================
-- Réglages par défaut
-- ============================================================
insert into public.site_settings (key, value) values
  ('theme', '{"primary":"#10b981"}'),
  ('announcement', '{"active":false,"message":"","level":"info"}'),
  ('wallpapers', '{"login":"","home":""}'),
  ('leagues', '{"champions":{"banner_url":"","background_url":""},"premier":{"banner_url":"","background_url":""},"laliga":{"banner_url":"","background_url":""},"seriea":{"banner_url":"","background_url":""},"ligue1":{"banner_url":"","background_url":""},"bundesliga":{"banner_url":"","background_url":""}}'),
  ('sync_state', '{"last_scores_sync":0,"last_news_sync":0,"last_cleanup":0,"last_standings_sync":0,"last_fixtures_import":0,"requests_remaining":null,"requests_day":null}'),
  ('live_tester', '{"active":false}'),
  ('standings_cache', '{"updated_at":null,"leagues":{}}')
on conflict (key) do nothing;
