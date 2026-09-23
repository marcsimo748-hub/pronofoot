-- ============================================================
-- 015 — PRONO_SECRETS : policy explicite « backend uniquement »
-- Linter : « RLS Enabled No Policy » sur public.prono_secrets
-- ============================================================
-- La table prono_secrets stocke des SECRETS de configuration :
--   • api_sports_key     (API-Football)
--   • football_data_key  (football-data.org)
--   • rapidapi_key       (Indeed via JSearch / RapidAPI)
--   • groq_api_key / gemini_api_key (assistant IA)
--
-- RÈGLE : cette table n'est JAMAIS accessible aux rôles clients
-- (anon = visiteurs, authenticated = membres connectés).
-- Seul le backend la lit/l'écrit, avec la clé service_role
-- (qui contourne RLS et n'est jamais exposée au navigateur).
--
-- ÉTAT AVANT (vérifié en production le 19/09/2026) :
--   ✓ RLS activé (migration 012)
--   ✓ Aucune policy → RLS refuse tout par défaut (deny-all)
--   ✓ REVOKE ALL de anon/authenticated appliqué — un appel REST
--     anon reçoit déjà « permission denied » (HTTP 401, code 42501)
--   ✗ Le linter signale la table car il ne vérifie que l'EXISTENCE
--     d'une policy, pas les privilèges réellement révoqués.
--
-- CETTE MIGRATION :
--   1. ré-affirme le REVOKE (idempotent, protège les env. neufs) ;
--   2. ajoute une policy RESTRICTIVE qui refuse EXPLICITEMENT tout
--      accès de anon/authenticated. Le linter voit désormais une
--      policy, et si un GRANT revenait un jour par erreur, la
--      policy continuerait de tout refuser (défense en profondeur :
--      privilèges révoqués + RLS sans policy permissive + deny explicite).
--
--   RLS reste activé. Aucun accès n'est ouvert. Le service_role est
--   inchangé (bypass RLS + privilèges conservés).
--
-- ⟲ ROLLBACK (retour à l'état 012) :
--   drop policy if exists prono_secrets_deny_clients
--     on public.prono_secrets;
--   (le REVOKE reste la protection principale — ne pas le retirer)
-- ============================================================

-- 1) Aucun privilège SQL pour les rôles clients (idempotent)
revoke all on public.prono_secrets from anon, authenticated;

-- 2) Policy restrictive : refus total pour les visiteurs et les membres
drop policy if exists prono_secrets_deny_clients
  on public.prono_secrets;

create policy prono_secrets_deny_clients
  on public.prono_secrets
  as restrictive
  for all                              -- select/insert/update/delete
  to anon, authenticated               -- jamais service_role
  using (false)                        -- aucune lecture possible
  with check (false);                  -- aucune écriture possible

-- 3) Rafraîchit le cache de schéma de PostgREST (cosmétique)
notify pgrst, 'reload schema';

-- ============================================================
-- VÉRIFICATION (à lancer dans l'éditeur SQL Supabase) :
--
--   select * from pg_policies where tablename = 'prono_secrets';
--   → 1 ligne : prono_secrets_deny_clients (RESTRICTIVE, FOR ALL,
--     to anon|authenticated, using false, with check false)
--
--   select grantee, privilege_type
--     from information_schema.role_table_grants
--    where table_schema = 'public' and table_name = 'prono_secrets'
--    order by grantee, privilege_type;
--   → AUCUNE ligne pour anon ni authenticated (uniquement
--     service_role, supabase_admin, postgres…)
-- ============================================================
