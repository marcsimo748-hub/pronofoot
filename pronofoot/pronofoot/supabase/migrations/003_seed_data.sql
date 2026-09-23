-- ============================================================
-- PRONOFOOT — Migration 003 : Données de démarrage
-- Crée la playlist par défaut (VIDE — l'admin ajoute ses
-- propres MP3 depuis ⚙️ Admin → 🎵 Playlist MP3).
-- ⚠️ Aucune donnée fictive : tout le contenu réel est géré
--    par l'administrateur depuis le panneau.
-- ============================================================

insert into public.playlists (name, description, is_default) values
  ('Playlist officielle Pronofoot', 'La musique du site, choisie par l''admin.', true)
on conflict do nothing;
