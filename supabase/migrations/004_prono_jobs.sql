-- ============================================================
-- 004 — MODULE PRONOJOB : agrégateur d'offres d'emploi (/prono-job)
-- Sources : Arbeitnow (DE/EU, sans clé), Remotive (remote, sans clé),
--           Adzuna (clés gratuites optionnelles), JSearch/RapidAPI (optionnel)
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001, 002, 003)
-- ============================================================

-- ---------- Offres d'emploi (cache rempli par le cron /api/cron/jobs) ----------
create table if not exists public.prono_jobs (
  id                uuid primary key default gen_random_uuid(),
  source            text not null,                       -- arbeitnow | remotive | adzuna | jsearch
  source_id         text not null,
  title             text not null,
  company           text not null default '',
  city              text,
  country           text,
  contract_type     text not null default 'other',       -- full-time | part-time | contract | internship | freelance | other
  remote            boolean not null default false,
  description_short text,                                -- extrait court (légal : pas de copie intégrale)
  url               text not null,                       -- lien vers l'offre ORIGINALE
  salary_min        numeric,
  salary_max        numeric,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists idx_prono_jobs_published on public.prono_jobs (published_at desc);
create index if not exists idx_prono_jobs_city      on public.prono_jobs (city);
create index if not exists idx_prono_jobs_country   on public.prono_jobs (country);
create index if not exists idx_prono_jobs_remote    on public.prono_jobs (remote);

-- ---------- Préférences emploi (alimentent le PronoScore) ----------
create table if not exists public.prono_job_prefs (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  keywords      text not null default '',      -- mots-clés métier, ex: "chauffeur, cuisine, logistique"
  city          text not null default '',      -- ville souhaitée
  remote_only   boolean not null default false,
  german_level  text not null default 'none',  -- none | A1 | A2 | B1 | B2 | C1 | C2
  english_level text not null default 'none',
  contract      text not null default '',      -- "" = tous les contrats
  updated_at    timestamptz not null default now()
);

-- ---------- Candidatures ("Postuler depuis Pronofoot") ----------
create table if not exists public.prono_applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  job_id     uuid not null references public.prono_jobs(id) on delete cascade,
  status     text not null default 'sent',     -- sent | viewed | interview | rejected
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists idx_prono_applications_user on public.prono_applications (user_id, created_at desc);

-- ============================================================
-- RLS : les offres sont publiques, prefs & candidatures privées
-- ============================================================
alter table public.prono_jobs         enable row level security;
alter table public.prono_job_prefs    enable row level security;
alter table public.prono_applications enable row level security;

-- Offres : lisibles par tous (page publique), écriture via service_role (cron uniquement)
drop policy if exists "prono_jobs_select_public" on public.prono_jobs;
create policy "prono_jobs_select_public" on public.prono_jobs
  for select using (true);

-- Préférences : chacun lit et modifie les siennes
drop policy if exists "prono_job_prefs_select_own" on public.prono_job_prefs;
create policy "prono_job_prefs_select_own" on public.prono_job_prefs
  for select using (auth.uid() = user_id);
drop policy if exists "prono_job_prefs_insert_own" on public.prono_job_prefs;
create policy "prono_job_prefs_insert_own" on public.prono_job_prefs
  for insert with check (auth.uid() = user_id);
drop policy if exists "prono_job_prefs_update_own" on public.prono_job_prefs;
create policy "prono_job_prefs_update_own" on public.prono_job_prefs
  for update using (auth.uid() = user_id);

-- Candidatures : propriétaire uniquement
drop policy if exists "prono_applications_select_own" on public.prono_applications;
create policy "prono_applications_select_own" on public.prono_applications
  for select using (auth.uid() = user_id);
drop policy if exists "prono_applications_insert_own" on public.prono_applications;
create policy "prono_applications_insert_own" on public.prono_applications
  for insert with check (auth.uid() = user_id);
drop policy if exists "prono_applications_delete_own" on public.prono_applications;
create policy "prono_applications_delete_own" on public.prono_applications
  for delete using (auth.uid() = user_id);
