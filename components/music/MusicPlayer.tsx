"use client";

/**
 * MusicPlayer — lecteur GLOBAL fixé en bas de l'écran.
 * Monté une seule fois dans le layout racine → la musique continue
 * pendant toute la navigation (état porté par Zustand + Howler.js).
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Repeat2,
  Volume2, VolumeX, ListMusic, X, Music2,
} from "lucide-react";
import { useMusicPlayer } from "@/lib/hooks/useMusicPlayer";
import { useMusicStore } from "@/lib/store/musicStore";
import { useSongs } from "@/lib/hooks/useSongs";
import { Playlist } from "./Playlist";
import { cn, formatTime } from "@/lib/utils";
import type { Song } from "@/lib/types";

export function MusicPlayer({ initialSongs }: { initialSongs: Song[] }) {
  useSongs(initialSongs);
  const { seek } = useMusicPlayer(); // moteur Howler (une seule instance)

  const [drawerOpen, setDrawerOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const currentSong = useMusicStore((s) => s.currentSong);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const progress = useMusicStore((s) => s.progress);
  const duration = useMusicStore((s) => s.duration);
  const volume = useMusicStore((s) => s.volume);
  const shuffle = useMusicStore((s) => s.shuffle);
  const repeat = useMusicStore((s) => s.repeat);
  const togglePlay = useMusicStore((s) => s.togglePlay);
  const next = useMusicStore((s) => s.next);
  const prev = useMusicStore((s) => s.prev);
  const toggleShuffle = useMusicStore((s) => s.toggleShuffle);
  const cycleRepeat = useMusicStore((s) => s.cycleRepeat);
  const setVolume = useMusicStore((s) => s.setVolume);

  // Clic sur la barre de progression → seek
  const handleSeek = useCallback(
    (e: React.MouseEvent) => {
      const bar = barRef.current;
      if (!bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      seek(ratio * duration);
    },
    [duration, seek]
  );

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <>
      {/* Barre du lecteur (visible dès qu'un morceau est chargé) */}
      <AnimatePresence>
        {currentSong && (
          <motion.div
            id="music-player"
            className={cn("fixed inset-x-0 z-40 border-t border-white/10 bg-background/95 backdrop-blur-xl")}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
          >
            {/* Barre de progression (cliquable) */}
            <div
              ref={barRef}
              onClick={handleSeek}
              className="group h-1.5 w-full cursor-pointer bg-secondary"
              role="progressbar"
              aria-valuenow={Math.round(pct)}
            >
              <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>

            <div className="container flex h-16 items-center gap-3">
              {/* Pochette + infos */}
              <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none md:basis-1/4">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md cover-fallback">
                  {currentSong.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentSong.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center"><Music2 className="h-5 w-5 text-foreground/60" /></span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{currentSong.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{currentSong.artist ?? "-"}</p>
                </div>
                {isPlaying && (
                  <span className="equalizer ml-1 hidden sm:inline-flex" aria-hidden>
                    <span /><span /><span /><span />
                  </span>
                )}
              </div>

              {/* Contrôles */}
              <div className="flex items-center gap-1 md:flex-1 md:justify-center">
                <button
                  onClick={toggleShuffle}
                  className={cn("hidden rounded-full p-2 transition-colors hover:bg-accent sm:block", shuffle ? "text-primary" : "text-muted-foreground")}
                  aria-label="Lecture aléatoire"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button onClick={prev} className="rounded-full p-2 hover:bg-accent" aria-label="Précédent">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow-sm transition-transform active:scale-95"
                  aria-label={isPlaying ? "Pause" : "Lecture"}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                </button>
                <button onClick={next} className="rounded-full p-2 hover:bg-accent" aria-label="Suivant">
                  <SkipForward className="h-4 w-4" />
                </button>
                <button
                  onClick={cycleRepeat}
                  className={cn("hidden rounded-full p-2 transition-colors hover:bg-accent sm:block", repeat !== "off" ? "text-primary" : "text-muted-foreground")}
                  aria-label="Répétition"
                >
                  {repeat === "one" ? <Repeat1 className="h-4 w-4" /> : repeat === "all" ? <Repeat className="h-4 w-4" /> : <Repeat2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Temps + volume + playlist */}
              <div className="flex items-center justify-end gap-2 md:basis-1/4">
                <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                  {formatTime(progress)} / {formatTime(duration)}
                </span>
                <div className="hidden items-center gap-1.5 lg:flex">
                  <button
                    onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Muet"
                  >
                    {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="h-1 w-20 cursor-pointer accent-[hsl(var(--primary))]"
                    aria-label="Volume"
                  />
                </div>
                <button
                  onClick={() => setDrawerOpen((v) => !v)}
                  className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors", drawerOpen ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent")}
                >
                  {drawerOpen ? <X className="h-3.5 w-3.5" /> : <ListMusic className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Playlist</span>
                </button>
              </div>
            </div>

            {/* Tiroir playlist */}
            <AnimatePresence>
              {drawerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/5"
                >
                  <div className="container max-h-72 overflow-y-auto py-3">
                    <Playlist compact />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
