-- ============================================================
-- 018 — BOUTIQUES DES MEMBRES (/boutiques)
-- Chaque membre connecté crée SA boutique : page personnalisée
-- (nom, accroche, thème, logo, WhatsApp) qui affiche ses annonces
-- commerciales (articles & services). Idempotent, rejouable.
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 017)
-- ============================================================

create table if not exists public.prono_shops (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.profiles(id) on delete cascade,
  slug        text not null unique,
  name        text not null,
  tagline     text not null default '',
  description text not null default '',
  city        text not null default '',
  theme       text not null default 'nuit',
  logo_url    text not null default '',
  whatsapp    text not null default '',
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint prono_shops_slug_format  check (slug ~ '^[a-z0-9-]{3,40}$'),
  constraint prono_shops_name_len     check (char_length(name) >= 3 and char_length(name) <= 60),
  constraint prono_shops_theme_check  check (theme in ('nuit','emeraude','ocean','coucher','violet','or'))
);

create index if not exists idx_prono_shops_slug on public.prono_shops (slug);
create index if not exists idx_prono_shops_recent on public.prono_shops (created_at desc);

-- ---------- RLS ----------
alter table public.prono_shops enable row level security;

-- Lecture : boutiques actives visibles par tous ; la sienne toujours visible
drop policy if exists "prono_shops_select" on public.prono_shops;
create policy "prono_shops_select" on public.prono_shops
  for select using (status = 'active' or auth.uid() = user_id);

-- Création : 1 boutique par membre (unique sur user_id)
drop policy if exists "prono_shops_insert_own" on public.prono_shops;
create policy "prono_shops_insert_own" on public.prono_shops
  for insert to authenticated with check (auth.uid() = user_id);

-- Modification : uniquement le propriétaire
drop policy if exists "prono_shops_update_own" on public.prono_shops;
create policy "prono_shops_update_own" on public.prono_shops
  for update to authenticated using (auth.uid() = user_id);

-- Suppression : uniquement le propriétaire
drop policy if exists "prono_shops_delete_own" on public.prono_shops;
create policy "prono_shops_delete_own" on public.prono_shops
  for delete to authenticated using (auth.uid() = user_id);
