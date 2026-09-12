-- ============================================================
-- 010 — MODULE 7 MESSAGERIE INTERNE (/messages)
-- Chat privé lié aux comptes et aux annonces / trajets.
-- Les coordonnées (téléphone, email) deviennent PRIVÉES :
-- stockées dans des tables à part, révélées dans le chat UNIQUEMENT
-- après l'accord du propriétaire. Tout se passe sur le site.
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 009)
-- ============================================================

-- ---------- Conversations (1 par annonce/trajet et par demandeur) ----------
create table if not exists public.prono_conversations (
  id             uuid primary key default gen_random_uuid(),
  context_type   text not null check (context_type in ('annonce','trajet')),
  context_id     uuid not null,
  listing_owner  uuid not null references public.profiles(id) on delete cascade,
  requester      uuid not null references public.profiles(id) on delete cascade,
  status         text not null default 'active',
  contact_revealed boolean not null default false,
  last_read_owner     timestamptz not null default now(),
  last_read_requester timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (context_type, context_id, requester),
  check (requester <> listing_owner)
);

create index if not exists idx_prono_conversations_owner     on public.prono_conversations (listing_owner, updated_at desc);
create index if not exists idx_prono_conversations_requester on public.prono_conversations (requester, updated_at desc);

-- ---------- Messages ----------
create table if not exists public.prono_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.prono_conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index if not exists idx_prono_messages_conversation on public.prono_messages (conversation_id, created_at desc);

-- ============================================================
-- COORDONNÉES PRIVÉES (nouveau) : le téléphone / email quitte les
-- tables publiques. Lecture réservée au propriétaire, à l'admin,
-- et aux participants d'une conversation où le contact est révélé.
-- ============================================================

create table if not exists public.prono_annonces_contacts (
  annonce_id        uuid primary key references public.prono_annonces(id) on delete cascade,
  contact_preference text not null default 'whatsapp',
  contact_value      text not null default ''
);

create table if not exists public.prono_voyage_trips_contacts (
  trip_id           uuid primary key references public.prono_voyage_trips(id) on delete cascade,
  contact_preference text not null default 'whatsapp',
  contact_value      text not null default ''
);

-- Copie des coordonnées existantes (aucune perte de données)
insert into public.prono_annonces_contacts (annonce_id, contact_preference, contact_value)
select id, contact_preference, contact_value from public.prono_annonces
on conflict (annonce_id) do nothing;

insert into public.prono_voyage_trips_contacts (trip_id, contact_preference, contact_value)
select id, contact_preference, contact_value from public.prono_voyage_trips
on conflict (trip_id) do nothing;

-- Les colonnes publiques sont retirées : plus moyen de lire un numéro
-- directement dans la table des annonces (même avec la clé anon).
alter table public.prono_annonces     drop column if exists contact_preference, drop column if exists contact_value;
alter table public.prono_voyage_trips drop column if exists contact_preference, drop column if exists contact_value;

-- ============================================================
-- RLS : conversations et messages visibles par les participants uniquement
-- ============================================================
alter table public.prono_conversations     enable row level security;
alter table public.prono_messages          enable row level security;
alter table public.prono_annonces_contacts  enable row level security;
alter table public.prono_voyage_trips_contacts enable row level security;

-- Conversations : lecture par les 2 participants
drop policy if exists "prono_conversations_select" on public.prono_conversations;
create policy "prono_conversations_select" on public.prono_conversations
  for select using (auth.uid() in (requester, listing_owner));

-- Création : uniquement en tant que demandeur (jamais sur sa propre annonce)
drop policy if exists "prono_conversations_insert" on public.prono_conversations;
create policy "prono_conversations_insert" on public.prono_conversations
  for insert to authenticated with check (auth.uid() = requester);

-- Mise à jour : participants (révélation du contact par le propriétaire,
-- horodatage de lecture par chacun, vérifié aussi côté API)
drop policy if exists "prono_conversations_update" on public.prono_conversations;
create policy "prono_conversations_update" on public.prono_conversations
  for update using (auth.uid() in (requester, listing_owner));

-- Messages : lecture par les participants de la conversation
drop policy if exists "prono_messages_select" on public.prono_messages;
create policy "prono_messages_select" on public.prono_messages
  for select using (
    exists (select 1 from public.prono_conversations c
            where c.id = conversation_id and auth.uid() in (c.requester, c.listing_owner))
  );

-- Messages : envoi par un participant, à son nom
drop policy if exists "prono_messages_insert" on public.prono_messages;
create policy "prono_messages_insert" on public.prono_messages
  for insert to authenticated with check (
    auth.uid() = sender_id
    and exists (select 1 from public.prono_conversations c
                where c.id = conversation_id and auth.uid() in (c.requester, c.listing_owner)
                and c.status = 'active')
  );

-- ============================================================
-- RLS : coordonnées privées (le cœur de la protection)
-- ============================================================
drop policy if exists "prono_annonces_contacts_select" on public.prono_annonces_contacts;
create policy "prono_annonces_contacts_select" on public.prono_annonces_contacts
  for select using (
    -- le propriétaire de l'annonce
    exists (select 1 from public.prono_annonces a where a.id = annonce_id and a.user_id = auth.uid())
    -- ou l'admin
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
    -- ou un participant d'une conversation où le contact a été révélé
    or exists (
      select 1 from public.prono_conversations c
      where c.context_type = 'annonce' and c.context_id = annonce_id
        and c.contact_revealed and auth.uid() in (c.requester, c.listing_owner)
    )
  );

drop policy if exists "prono_annonces_contacts_insert" on public.prono_annonces_contacts;
create policy "prono_annonces_contacts_insert" on public.prono_annonces_contacts
  for insert to authenticated with check (
    exists (select 1 from public.prono_annonces a where a.id = annonce_id and a.user_id = auth.uid())
  );

drop policy if exists "prono_annonces_contacts_update" on public.prono_annonces_contacts;
create policy "prono_annonces_contacts_update" on public.prono_annonces_contacts
  for update to authenticated using (
    exists (select 1 from public.prono_annonces a where a.id = annonce_id and a.user_id = auth.uid())
  );

drop policy if exists "prono_voyage_trips_contacts_select" on public.prono_voyage_trips_contacts;
create policy "prono_voyage_trips_contacts_select" on public.prono_voyage_trips_contacts
  for select using (
    exists (select 1 from public.prono_voyage_trips t where t.id = trip_id and t.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
    or exists (
      select 1 from public.prono_conversations c
      where c.context_type = 'trajet' and c.context_id = trip_id
        and c.contact_revealed and auth.uid() in (c.requester, c.listing_owner)
    )
  );

drop policy if exists "prono_voyage_trips_contacts_insert" on public.prono_voyage_trips_contacts;
create policy "prono_voyage_trips_contacts_insert" on public.prono_voyage_trips_contacts
  for insert to authenticated with check (
    exists (select 1 from public.prono_voyage_trips t where t.id = trip_id and t.user_id = auth.uid())
  );

drop policy if exists "prono_voyage_trips_contacts_update" on public.prono_voyage_trips_contacts;
create policy "prono_voyage_trips_contacts_update" on public.prono_voyage_trips_contacts
  for update to authenticated using (
    exists (select 1 from public.prono_voyage_trips t where t.id = trip_id and t.user_id = auth.uid())
  );
