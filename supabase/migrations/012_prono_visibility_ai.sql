-- ============================================================
-- 012 : PRONOSTICS VISIBLES APRÈS COUP D'ENVOI + CLÉS IA PRIVÉES
-- ⚠️ Exécuter après 011 dans le SQL Editor
-- ============================================================

-- ==================== 1) PRONOS DÉVOILÉS ====================
-- Chacun voit TOUJOURS ses propres pronostics.
-- Tout le monde voit les pronostics des autres DÈS QUE le match a commencé
-- (impossible de copier avant le coup d'envoi).
-- L'admin voit tous les pronostics à tout moment (modération).

drop policy if exists predictions_select_own on public.predictions;
create policy predictions_select_own on public.predictions
  for select using (
    auth.uid() = user_id
    or public.is_admin()
    or exists (
      select 1 from public.matches m
      where m.id = predictions.match_id
        and (
          m.match_date <= now()
          or m.status in ('live', 'missed', 'finished')
        )
    )
  );

-- ==================== 2) CLÉS API IA (PRIVÉES) ====================
-- Stocke les clés Groq / Gemini pour l'assistant IA.
-- ⚠️ AUCUNE policy : les visiteurs et membres ne peuvent RIEN lire
-- (RLS activé sans policy = tout refusé). Seul le serveur
-- (service role) lit et écrit ces secrets.

create table if not exists public.prono_secrets (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

alter table public.prono_secrets enable row level security;

-- Ceinture de sécurité : aucun accès direct via l'API REST publique
revoke all on public.prono_secrets from anon, authenticated;
