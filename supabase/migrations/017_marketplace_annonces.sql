-- ============================================================
-- 017 — PRONO-ANNONCES : marketplace (façon Kleinanzeigen)
-- Nouvelles catégories biens & services + prix + envoi Afrique
-- + dédouanement. Idempotent : rejouable sans risque.
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 016)
-- ============================================================

-- ---------- 1) Catégories étendues ----------
-- Anciennes : rencontre, partenaire, ami, logement, service
-- Nouvelles : voitures, transport (envoi Afrique), electronique,
--             mode, maison, objets
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

-- ---------- 2) Prix (optionnel, en euros) ----------
alter table public.prono_annonces
  add column if not exists price_eur numeric(10,2);

-- ---------- 3) Envoi vers l'Afrique ----------
-- 'non'  : pas concerné (vente locale)
-- 'aide' : le vendeur aide à expédier vers l'Afrique
alter table public.prono_annonces
  add column if not exists shipping text not null default 'non';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'prono_annonces_shipping_check'
  ) then
    alter table public.prono_annonces
      add constraint prono_annonces_shipping_check check (shipping in ('non','aide'));
  end if;
end $$;

-- ---------- 4) Dédouanement ----------
-- 'aucun'   : pas concerné
-- 'vendeur' : le vendeur s'occupe du dédouanement
-- 'acheteur': l'acheteur fait le dédouanement lui-même
alter table public.prono_annonces
  add column if not exists customs text not null default 'aucun';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'prono_annonces_customs_check'
  ) then
    alter table public.prono_annonces
      add constraint prono_annonces_customs_check check (customs in ('aucun','vendeur','acheteur'));
  end if;
end $$;

-- ---------- 5) Index prix pour tri futur ----------
create index if not exists idx_prono_annonces_price on public.prono_annonces (price_eur);
