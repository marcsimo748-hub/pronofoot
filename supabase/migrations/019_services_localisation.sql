-- ============================================================
-- 019 — SERVICES DE PROXIMITÉ & LOCALISATION PRÉCISE
-- Nouvelles catégories de services (coiffure, déménagement/Umzug,
-- DJ, chauffeur, garde d'enfants) + quartier & code postal
-- sur les annonces et les boutiques. Idempotent, rejouable.
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 018)
-- ============================================================

-- ---------- 1) Catégories de services ----------
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'prono_annonces_category_check'
      and conrelid = 'public.prono_annonces'::regclass
  ) then
    alter table public.prono_annonces drop constraint prono_annonces_category_check;
  end if;
end $$;

alter table public.prono_annonces
  add constraint prono_annonces_category_check
  check (category in (
    'rencontre','partenaire','ami','logement','service',
    'voitures','transport','electronique','mode','maison','objets',
    'coiffure','demenagement','dj','chauffeur','gardenfant'
  ));

-- ---------- 2) Localisation précise (annonces) ----------
alter table public.prono_annonces add column if not exists quartier text not null default '';
alter table public.prono_annonces add column if not exists postal  text not null default '';

-- ---------- 3) Localisation précise (boutiques) ----------
alter table public.prono_shops add column if not exists quartier text not null default '';
alter table public.prono_shops  add column if not exists postal  text not null default '';

create index if not exists idx_prono_annonces_postal on public.prono_annonces (postal);
