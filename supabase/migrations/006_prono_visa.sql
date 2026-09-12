-- ============================================================
-- 006 — MODULE 3 PRONOVISA (/prono-visa)
-- Historique des simulations du calculateur de chances de visa.
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 005)
-- ============================================================

create table if not exists public.prono_visa_checks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  visa_type  text not null default '',       -- ausbildung | studium | chancenkarte | travail | tourisme
  answers    jsonb not null default '{}',    -- réponses du questionnaire
  score      int not null default 0,         -- 0-100 (estimation, pas une décision)
  created_at timestamptz not null default now()
);

create index if not exists idx_prono_visa_checks_user on public.prono_visa_checks (user_id, created_at desc);

-- RLS : chaque joueur ne voit que SES simulations
alter table public.prono_visa_checks enable row level security;

drop policy if exists "prono_visa_select_own" on public.prono_visa_checks;
create policy "prono_visa_select_own" on public.prono_visa_checks
  for select using (auth.uid() = user_id);
drop policy if exists "prono_visa_insert_own" on public.prono_visa_checks;
create policy "prono_visa_insert_own" on public.prono_visa_checks
  for insert with check (auth.uid() = user_id);
drop policy if exists "prono_visa_delete_own" on public.prono_visa_checks;
create policy "prono_visa_delete_own" on public.prono_visa_checks
  for delete using (auth.uid() = user_id);
