-- ============================================================
-- 009 — MODULE 6 PRONO-VOYAGE (/prono-voyage)
-- Covoiturage de la communauté + signalements.
-- (Les billets bus/train/avion sont des LIENS officiels, aucune table.)
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 008)
-- ============================================================

-- ---------- Trajets covoiturage ----------
create table if not exists public.prono_voyage_trips (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  origin_city       text not null,
  dest_city         text not null,
  trip_date         date not null,
  seats             int not null default 3 check (seats between 1 and 8),
  price_eur         numeric(6,2) not null default 0 check (price_eur >= 0 and price_eur <= 999),
  note              text not null default '',
  contact_preference text not null default 'whatsapp', -- whatsapp | email
  contact_value     text not null default '',
  status            text not null default 'active',    -- active | hidden | removed
  reports_count     int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_prono_voyage_trips_date   on public.prono_voyage_trips (trip_date desc);
create index if not exists idx_prono_voyage_trips_recent on public.prono_voyage_trips (created_at desc);
create index if not exists idx_prono_voyage_trips_origin on public.prono_voyage_trips (origin_city);
create index if not exists idx_prono_voyage_trips_dest   on public.prono_voyage_trips (dest_city);

-- ---------- Signalements ----------
create table if not exists public.prono_voyage_trip_reports (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.prono_voyage_trips(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  reason     text not null,
  created_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create index if not exists idx_prono_voyage_trip_reports on public.prono_voyage_trip_reports (trip_id);

-- ============================================================
-- RLS : trajets actifs publics ; propriétaire et admin gèrent tout
-- ============================================================
alter table public.prono_voyage_trips       enable row level security;
alter table public.prono_voyage_trip_reports enable row level security;

drop policy if exists "prono_voyage_trips_select" on public.prono_voyage_trips;
create policy "prono_voyage_trips_select" on public.prono_voyage_trips
  for select using (
    status = 'active'
    or auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "prono_voyage_trips_insert_own" on public.prono_voyage_trips;
create policy "prono_voyage_trips_insert_own" on public.prono_voyage_trips
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "prono_voyage_trips_update_own" on public.prono_voyage_trips;
create policy "prono_voyage_trips_update_own" on public.prono_voyage_trips
  for update using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "prono_voyage_trips_delete_own" on public.prono_voyage_trips;
create policy "prono_voyage_trips_delete_own" on public.prono_voyage_trips
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "prono_voyage_trip_reports_insert" on public.prono_voyage_trip_reports;
create policy "prono_voyage_trip_reports_insert" on public.prono_voyage_trip_reports
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "prono_voyage_trip_reports_select_admin" on public.prono_voyage_trip_reports;
create policy "prono_voyage_trip_reports_select_admin" on public.prono_voyage_trip_reports
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
