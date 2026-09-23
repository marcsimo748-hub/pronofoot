/**
 * Service MUSIQUE — lecture des morceaux / playlists depuis Supabase.
 * Les fichiers MP3 vivent dans le bucket Storage `songs` (public).
 */

import type { Song } from "@/lib/types";
import { safeQuery } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Tous les morceaux, triés par position */
export async function getSongs(): Promise<Song[]> {
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.from("songs").select("*").order("position");
    return (data ?? []) as Song[];
  }, []);
}

/** Playlists avec leurs morceaux */
export async function getPlaylistsWithSongs() {
  return safeQuery(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data } = await supabase
        .from("playlists")
        .select("id, name, description, is_default, playlist_songs(song_id, position)")
        .order("created_at");
      return data ?? [];
    },
    [] as unknown[]
  );
}
