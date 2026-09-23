-- ============================================================
-- 016 — Phase 3 : paiements en ligne (PRÉPARÉ SANS ÊTRE BRANCHÉ)
-- Fournisseurs : Stripe (banque requise) et CinetPay (cartes + Mobile
-- Money, reversement Mobile Money SANS compte bancaire).
-- Aucune clé en base = aucune route active (checkout → 503).
-- Migration idempotente : elle peut être rejouée sans erreur.
-- ============================================================

-- Historique des paiements (écrit uniquement par le serveur : service role)
create table if not exists public.payments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  plan                  text not null default 'premium_monthly',
  amount_cents          integer not null default 499,
  currency              text not null default 'eur',
  status                text not null default 'pending',   -- pending | paid | failed | refunded
  stripe_session_id     text unique,
  stripe_customer_id    text,
  stripe_payment_intent text,
  created_at            timestamptz not null default now(),
  paid_at               timestamptz
);

create index if not exists idx_payments_user on public.payments (user_id);

-- Fournisseur du paiement (stripe | cinetpay) — idempotent si re-jouée
alter table public.payments add column if not exists provider text not null default 'stripe';

-- Premium jusqu'au (null = compte gratuit — aucun comportement existant changé)
alter table public.profiles add column if not exists premium_until timestamptz;

-- RLS : chaque joueur voit SES paiements ; seule l'écriture serveur (service
-- role, webhook Stripe) peut insérer/modifier — aucune policy d'écriture.
alter table public.payments enable row level security;

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select using (auth.uid() = user_id);

-- Le service role passe par défaut (bypass RLS) : rien d'autre à faire.
