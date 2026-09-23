"use client";

/** 🎵 Outil 7 : Playlist MP3 — upload direct vers le bucket Storage `songs` */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Music4 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadToStorage, adminFetch } from "../adminShared";
import type { Song } from "@/lib/types";

export function PlaylistTool() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void loadSongs(); }, []);

  async function loadSongs() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from("songs").select("*").order("position");
      setSongs((data ?? []) as Song[]);
    } catch {
      /* silencieux */
    }
  }

  async function addSong() {
    if (!file || !title.trim()) {
      toast.error("Titre + fichier MP3 requis.");
      return;
    }
    setBusy(true);
    try {
      // 1) Upload direct du MP3 vers Supabase Storage (aucune limite Vercel)
      const audioUrl = await uploadToStorage(file, "songs", "mp3");
      // 2) Enregistrement de la ligne (service role)
      await adminFetch("/api/admin/songs", {
        title: title.trim(),
        artist: artist.trim() || null,
        audio_url: audioUrl,
        position: songs.length,
      });
      toast.success("Musique ajoutée à la playlist 🎵");
      setTitle(""); setArtist(""); setFile(null);
      await loadSongs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'ajouter la musique");
    } finally {
      setBusy(false);
    }
  }

  async function removeSong(song: Song) {
    try {
      await adminFetch("/api/admin/songs", { id: song.id }, "DELETE");
      toast.success("Musique supprimée 🗑️");
      await loadSongs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="space-y-5">
      {/* Formulaire d'ajout */}
      <div className="grid gap-3 rounded-lg border bg-background/50 p-4 md:grid-cols-[1fr_1fr_auto]">
        <Input placeholder="Titre du morceau *" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
        <Input placeholder="Artiste (optionnel)" value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={100} />
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary/50">
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Upload className="h-4 w-4" />
          <span className="max-w-[140px] truncate">{file ? file.name : "Choisir un MP3 *"}</span>
        </label>
        <Button onClick={addSong} disabled={busy} className="gap-2 md:col-span-3 md:w-fit">
          <Music4 className="h-4 w-4" /> {busy ? "Ajout en cours…" : "Ajouter à la playlist"}
        </Button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {songs.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Playlist vide · ajoute ton premier MP3 ci-dessus.
          </p>
        )}
        {songs.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md cover-fallback text-sm">🎵</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.title}</p>
              <p className="truncate text-xs text-muted-foreground">{s.artist ?? "-"}</p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => removeSong(s)} aria-label="Supprimer">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
