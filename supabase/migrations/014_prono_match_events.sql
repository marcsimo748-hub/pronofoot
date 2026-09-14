-- ============================================================
-- 014 : ÉVÉNEMENTS DE MATCH (buteurs, cartons, penalties)
-- ⚠️ Exécuter après 013 dans le SQL Editor
-- ============================================================

-- Un événement = un but, un carton, un penalty ou un remplacement,
-- synchronisé depuis API-Football (quotas protégés côté serveur).
create table if not exists public.prono_match_events (
  id          uuid primary key default gen_random_uuid(),
  fixture_id  text not null,
  team        text not null,
  player      text not null,
  type        text not null check (type in ('Goal', 'Card', 'Var', 'Sub', 'Penalty')),
  detail      text,
  minute      integer,
  created_at  timestamptz not null default now(),
  unique (fixture_id, team, player, type, detail, minute)
);

create index if not exists idx_prono_match_events_fixture
  on public.prono_match_events (fixture_id, minute);

alter table public.prono_match_events enable row level security;

-- Lecture publique : les événements enrichissent les scores live
drop policy if exists "select_all" on public.prono_match_events;
create policy "select_all" on public.prono_match_events
  for select using (true);

-- Écriture : uniquement le serveur (service role, synchro API-Football)
-- Aucune policy insert/update/delete pour les visiteurs et membres.
