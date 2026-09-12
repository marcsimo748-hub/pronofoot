-- ============================================================
-- 011 : NOTIFICATIONS IN-APP + VÉRIFICATION EMAIL (badges ✓)
-- ⚠️ Exécuter APRÈS 009 et 010 dans le SQL Editor (ordre important)
-- ============================================================

-- ==================== 1) BADGE EMAIL VÉRIFIÉ ====================

alter table public.profiles
  add column if not exists email_verified boolean not null default false;

-- Backfill : les comptes déjà confirmés deviennent vérifiés tout de suite
update public.profiles p
set email_verified = (u.email_confirmed_at is not null)
from auth.users u
where u.id = p.id
  and p.email_verified <> (u.email_confirmed_at is not null);

-- Inscription : le profil enregistre le statut dès la création
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, is_admin, email_verified)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      'joueur_' || substr(new.id::text, 1, 8)
    ),
    new.raw_user_meta_data->>'avatar_url',
    false,
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Synchronisation quand l'email est confirmé (ou changé)
create or replace function public.sync_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.email_confirmed_at is not distinct from new.email_confirmed_at then
    return null;
  end if;
  update public.profiles
  set email_verified = (new.email_confirmed_at is not null)
  where id = new.id;
  return null;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.sync_email_verified();

-- ==================== 2) TABLE NOTIFICATIONS ====================

create table if not exists public.prono_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('chat_message', 'chat_new', 'chat_contact', 'system')),
  title       text not null,
  body        text,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_prono_notifications_user
  on public.prono_notifications (user_id, created_at desc);

alter table public.prono_notifications enable row level security;

-- Chacun lit / modifie / supprime uniquement SES notifications.
-- Aucune policy INSERT : seuls les triggers ci-dessous (et le service role)
-- peuvent créer des notifications, impossible de spammer les autres.
drop policy if exists "select_own" on public.prono_notifications;
create policy "select_own" on public.prono_notifications
  for select using (auth.uid() = user_id);

drop policy if exists "update_own" on public.prono_notifications;
create policy "update_own" on public.prono_notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete_own" on public.prono_notifications;
create policy "delete_own" on public.prono_notifications
  for delete using (auth.uid() = user_id);

-- ==================== 3) TRIGGERS DE CRÉATION ====================

-- a) Nouveau message : notifie le destinataire
create or replace function public.prono_notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner     uuid;
  v_requester uuid;
  v_dest      uuid;
  v_sender    text;
begin
  select listing_owner, requester into v_owner, v_requester
  from public.prono_conversations where id = new.conversation_id;
  if v_owner is null then return new; end if;

  v_dest := case when new.sender_id = v_owner then v_requester else v_owner end;
  select username into v_sender from public.profiles where id = new.sender_id;

  insert into public.prono_notifications (user_id, type, title, body, link)
  values (
    v_dest,
    'chat_message',
    coalesce(v_sender, 'Un membre') || ' t''a écrit',
    left(new.body, 120),
    '/messages/' || new.conversation_id::text
  );
  return new;
end;
$$;

drop trigger if exists on_prono_message_created on public.prono_messages;
create trigger on_prono_message_created
  after insert on public.prono_messages
  for each row execute function public.prono_notify_new_message();

-- b) Nouvelle discussion sur une annonce / un trajet : notifie le propriétaire
create or replace function public.prono_notify_new_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requester text;
  v_label     text;
begin
  select username into v_requester from public.profiles where id = new.requester;
  v_label := case new.context_type when 'annonce' then 'ton annonce' else 'ton trajet' end;

  insert into public.prono_notifications (user_id, type, title, body, link)
  values (
    new.listing_owner,
    'chat_new',
    'Nouvelle discussion',
    coalesce(v_requester, 'Un membre') || ' veut discuter de ' || v_label,
    '/messages/' || new.id::text
  );
  return new;
end;
$$;

drop trigger if exists on_prono_conversation_created on public.prono_conversations;
create trigger on_prono_conversation_created
  after insert on public.prono_conversations
  for each row execute function public.prono_notify_new_conversation();

-- c) Coordonnées révélées : notifie le demandeur
create or replace function public.prono_notify_contact_revealed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.contact_revealed = false and new.contact_revealed = true then
    insert into public.prono_notifications (user_id, type, title, body, link)
    values (
      new.requester,
      'chat_contact',
      'Coordonnées partagées',
      'Le propriétaire a accepté d''échanger ses coordonnées',
      '/messages/' || new.id::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_prono_contact_revealed on public.prono_conversations;
create trigger on_prono_contact_revealed
  after update on public.prono_conversations
  for each row execute function public.prono_notify_contact_revealed();

-- d) Limite : maximum 50 notifications par membre (les plus vieilles partent)
create or replace function public.prono_notifications_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.prono_notifications
  where user_id = new.user_id
    and id not in (
      select id from public.prono_notifications
      where user_id = new.user_id
      order by created_at desc
      limit 50
    );
  return new;
end;
$$;

drop trigger if exists on_prono_notification_created on public.prono_notifications;
create trigger on_prono_notification_created
  after insert on public.prono_notifications
  for each row execute function public.prono_notifications_cap();
