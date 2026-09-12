-- ============================================================
-- 007 — MODULE 4 PRONO-HOUSING (/prono-housing)
-- Lettres de motivation logement (Anschreiben) sauvegardées.
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 006)
-- ============================================================

create table if not exists public.prono_housing_letters (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  data       jsonb not null default '{}',   -- champs du formulaire Anschreiben
  letter_de  text not null default '',      -- version allemande (éditable)
  letter_fr  text not null default '',      -- version française (éditable)
  updated_at timestamptz not null default now()
);

-- RLS : chaque joueur ne voit et ne modifie que SA lettre
alter table public.prono_housing_letters enable row level security;

drop policy if exists "prono_housing_letters_select_own" on public.prono_housing_letters;
create policy "prono_housing_letters_select_own" on public.prono_housing_letters
  for select using (auth.uid() = user_id);
drop policy if exists "prono_housing_letters_insert_own" on public.prono_housing_letters;
create policy "prono_housing_letters_insert_own" on public.prono_housing_letters
  for insert with check (auth.uid() = user_id);
drop policy if exists "prono_housing_letters_update_own" on public.prono_housing_letters;
create policy "prono_housing_letters_update_own" on public.prono_housing_letters
  for update using (auth.uid() = user_id);
drop policy if exists "prono_housing_letters_delete_own" on public.prono_housing_letters;
create policy "prono_housing_letters_delete_own" on public.prono_housing_letters
  for delete using (auth.uid() = user_id);
