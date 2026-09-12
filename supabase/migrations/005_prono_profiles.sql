-- ============================================================
-- 005 — MODULE 2 PRONOPROFIL & PRONOCV (/prono-profil)
-- Un compte = plusieurs profils selon le besoin (Emploi, Logement,
-- Visa, Rencontre) + générateur de CV (3 templates, export PDF).
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 004)
-- ============================================================

create table if not exists public.prono_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  intention       text not null check (intention in ('emploi','logement','visa','rencontre')),

  -- ----- Champs communs -----
  full_name       text not null default '',
  phone           text not null default '',
  city            text not null default '',
  country         text not null default '',
  birth_year      int,
  bio             text not null default '',

  -- ----- Profil EMPLOI (alimente aussi le PronoScore de PronoJob) -----
  job_title       text not null default '',       -- poste / métier visé
  skills          text not null default '',       -- compétences séparées par des virgules
  experiences     jsonb not null default '[]',    -- [{ role, company, period, description }]
  educations      jsonb not null default '[]',    -- [{ degree, school, year }]
  german_level    text not null default 'none',   -- none | A1 | A2 | B1 | B2 | C1 | C2
  english_level   text not null default 'none',
  other_languages text not null default '',
  linkedin_url    text not null default '',

  -- ----- Profil VISA -----
  target_country  text not null default '',       -- pays visé
  visa_type       text not null default '',       -- Ausbildung | Studium | Chancenkarte | ...
  blocked_note    text not null default '',       -- situation / questions

  -- ----- Profil LOGEMENT -----
  housing_city    text not null default '',
  housing_type    text not null default '',       -- wg | appartement | studio | chambre
  budget_max      numeric,

  -- ----- Profil RENCONTRE -----
  age_range       text not null default '',
  looking_for     text not null default '',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, intention)                     -- 1 profil par intention et par compte
);

create index if not exists idx_prono_profiles_user on public.prono_profiles (user_id);

-- ============================================================
-- RLS : chaque joueur ne voit et ne modifie que SES profils
-- ============================================================
alter table public.prono_profiles enable row level security;

drop policy if exists "prono_profiles_select_own" on public.prono_profiles;
create policy "prono_profiles_select_own" on public.prono_profiles
  for select using (auth.uid() = user_id);
drop policy if exists "prono_profiles_insert_own" on public.prono_profiles;
create policy "prono_profiles_insert_own" on public.prono_profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "prono_profiles_update_own" on public.prono_profiles;
create policy "prono_profiles_update_own" on public.prono_profiles
  for update using (auth.uid() = user_id);
drop policy if exists "prono_profiles_delete_own" on public.prono_profiles;
create policy "prono_profiles_delete_own" on public.prono_profiles
  for delete using (auth.uid() = user_id);
