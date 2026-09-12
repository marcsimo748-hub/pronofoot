-- ============================================================
-- 013 : MÉMOIRE DE L'ASSISTANT IA (Mission 12 — IA 2.0)
-- ⚠️ Exécuter après 012 dans le SQL Editor
-- ============================================================

-- Chaque membre a sa propre mémoire : l'IA retient ce qu'elle
-- apprend sur lui (équipe préférée, ville, travail...) et
-- réutilise ces infos aux conversations suivantes.
create table if not exists public.prono_ai_memory (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_prono_ai_memory_user
  on public.prono_ai_memory (user_id, created_at desc);

alter table public.prono_ai_memory enable row level security;

-- Chacun lit / écrit / supprime uniquement SA mémoire
drop policy if exists "select_own" on public.prono_ai_memory;
create policy "select_own" on public.prono_ai_memory
  for select using (auth.uid() = user_id);

drop policy if exists "insert_own" on public.prono_ai_memory;
create policy "insert_own" on public.prono_ai_memory
  for insert with check (auth.uid() = user_id);

drop policy if exists "delete_own" on public.prono_ai_memory;
create policy "delete_own" on public.prono_ai_memory
  for delete using (auth.uid() = user_id);
