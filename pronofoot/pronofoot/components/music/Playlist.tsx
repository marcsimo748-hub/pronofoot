"use client";

/**
 * Playlist — liste des morceaux cliquables.
 * Utilisée sur la page /music et dans le tiroir du lecteur global.
 */

import { ListMusic, Pause, Play } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { useMusicStore } from "@/lib/store/musicStore";
import type { Song } from "@/lib/types";

interface PlaylistProps {
  compact?: boolean;
  className?: string;
}

export function Playlist({ compact = false, className }: PlaylistProps) {
  const songs = useMusicStore((s) => s.songs);
  const currentSong = useMusicStore((s) => s.currentSong);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const playSong = useMusicStore((s) => s.playSong);
  const togglePlay = useMusicStore((s) => s.togglePlay);

  if (!songs.length) {
    return (
      <div className={cn("rounded-xl border border-dashed p-8 text-center", className)}>
        <ListMusic className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          Aucune musique pour l'instant. L'administrateur peut ajouter des MP3 depuis
          l'onglet <span className="font-semibold text-foreground">⚙️ Admin → 🎵 Playlist MP3</span>.
        </p>
      </div>
    );
  }

  return (
    <ul className={cn("divide-y divide-white/5 overflow-hidden rounded-xl border bg-card/60", className)}>
      {songs.map((song, i) => {
        const isCurrent = currentSong?.id === song.id;
        return (
          <li key={song.id}>
            <button
              onClick={() => (isCurrent ? togglePlay() : playSong(i))}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent",
                isCurrent && "bg-primary/10"
              )}
            >
              {/* Pochette */}
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md cover-fallback">
                {song.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={song.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-sm">🎵</span>
                )}
              </div>

              {/* Titre */}
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", isCurrent && "text-primary")}>
                  {song.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{song.artist ?? "Artiste inconnu"}</p>
              </div>

              {/* Égaliseur si en lecture */}
              {isCurrent && isPlaying && (
                <span className="equalizer" aria-label="En lecture">
                  <span /><span /><span /><span />
                </span>
              )}

              {/* Bouton play/pause */}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary">
                {isCurrent && isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </span>

              {!compact && typeof song.duration === "number" && (
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {formatTime(song.duration)}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
