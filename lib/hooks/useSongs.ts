"use client";

/**
 * Hook de chargement des morceaux (table `songs`) dans le store du lecteur.
 * S'abonne aussi aux changements temps réel (ajout/suppression par l'admin).
 */

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useMusicStore } from "@/lib/store/musicStore";
import type { Song } from "@/lib/types";

export function useSongs(initialSongs: Song[] = []) {
  const songs = useMusicStore((s) => s.songs);
  const setSongs = useMusicStore((s) => s.setSongs);

  useEffect(() => {
    setSongs(initialSongs);
  }, [initialSongs, setSongs]);

  useEffect(() => {
    if (!initialSongs.length) return; // pas de config → rien à écouter
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("songs-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "songs" },
        async () => {
          const { data } = await supabase.from("songs").select("*").order("position");
          if (data) setSongs(data as Song[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialSongs.length, setSongs]);

  return songs;
}
