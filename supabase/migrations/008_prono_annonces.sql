-- ============================================================
-- 008 — MODULE 5 PRONO-ANNONCES (/prono-annonces)
-- Petites annonces communautaires + signalements + photos (Storage).
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 007)
-- ============================================================

-- ---------- Annonces ----------
create table if not exists public.prono_annonces (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  category          text not null check (category in ('rencontre','partenaire','ami','logement','service')),
  title             text not null,
  description       text not null default '',
  city              text not null default '',
  country           text not null default '',
  photos            jsonb not null default '[]',     -- URLs publiques du Storage
  contact_preference text not null default 'whatsapp', -- whatsapp | email
  contact_value     text not null default '',
  status            text not null default 'active',  -- active | hidden | removed
  reports_count     int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_prono_annonces_recent   on public.prono_annonces (created_at desc);
create index if not exists idx_prono_annonces_category on public.prono_annonces (category);
create index if not exists idx_prono_annonces_city     on public.prono_annonces (city);

-- ---------- Signalements ----------
create table if not exists public.prono_annonce_reports (
  id         uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.prono_annonces(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  reason     text not null,
  created_at timestamptz not null default now(),
  unique (annonce_id, user_id)
);

create index if not exists idx_prono_annonce_reports on public.prono_annonce_reports (annonce_id);

-- ============================================================
-- RLS : annonces actives publiques ; propriétaire et admin gèrent tout
-- ============================================================
alter table public.prono_annonces        enable row level security;
alter table public.prono_annonce_reports enable row level security;

-- Lecture : annonces actives pour tous + les siennes (même masquées) + tout pour l'admin
drop policy if exists "prono_annonces_select" on public.prono_annonces;
create policy "prono_annonces_select" on public.prono_annonces
  for select using (
    status = 'active'
    or auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Création : connecté, pour soi-même
drop policy if exists "prono_annonces_insert_own" on public.prono_annonces;
create policy "prono_annonces_insert_own" on public.prono_annonces
  for insert to authenticated with check (auth.uid() = user_id);

-- Modification (masquer / afficher) : propriétaire ou admin
drop policy if exists "prono_annonces_update_own" on public.prono_annonces;
create policy "prono_annonces_update_own" on public.prono_annonces
  for update using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Suppression : propriétaire ou admin
drop policy if exists "prono_annonces_delete_own" on public.prono_annonces;
create policy "prono_annonces_delete_own" on public.prono_annonces
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Signalements : insertion par les connectés, lecture par l'admin uniquement
drop policy if exists "prono_annonce_reports_insert" on public.prono_annonce_reports;
create policy "prono_annonce_reports_insert" on public.prono_annonce_reports
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "prono_annonce_reports_select_admin" on public.prono_annonce_reports;
create policy "prono_annonce_reports_select_admin" on public.prono_annonce_reports
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ============================================================
-- STORAGE : bucket public pour les photos des annonces
-- ============================================================
insert into storage.buckets (id, name, public)
values ('prono-annonces', 'prono-annonces', true)
on conflict (id) do nothing;

-- Photos lisibles par tous (annonces publiques)
drop policy if exists "prono_annonces_storage_read" on storage.objects;
create policy "prono_annonces_storage_read" on storage.objects
  for select using (bucket_id = 'prono-annonces');

-- Upload : chaque joueur connecté, uniquement dans SON dossier
drop policy if exists "prono_annonces_storage_insert" on storage.objects;
create policy "prono_annonces_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'prono-annonces' and (storage.foldername(name))[1] = auth.uid()::text);

-- Suppression : uniquement dans son dossier
drop policy if exists "prono_annonces_storage_delete" on storage.objects;
create policy "prono_annonces_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'prono-annonces' and (storage.foldername(name))[1] = auth.uid()::text);
