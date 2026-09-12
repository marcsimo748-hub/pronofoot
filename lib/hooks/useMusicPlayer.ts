"use client";

/**
 * Hook du lecteur de musique global — moteur Howler.js.
 * Instancié UNE seule fois (dans <MusicPlayer /> monté au layout racine),
 * il synchronise l'audio avec le store Zustand et survit aux navigations.
 */

import { useEffect, useRef } from "react";
import type { Howl } from "howler";
import { useMusicStore } from "@/lib/store/musicStore";

export function useMusicPlayer() {
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);

  const currentSong = useMusicStore((s) => s.currentSong);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const volume = useMusicStore((s) => s.volume);
  const repeat = useMusicStore((s) => s.repeat);

  // --- Création / changement de piste ---
  useEffect(() => {
    if (!currentSong) {
      howlRef.current?.unload();
      howlRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      // Import dynamique : Howler accède à `window`, interdit côté serveur
      const { Howl } = await import("howler");
      if (cancelled) return;

      howlRef.current?.unload();
      const howl = new Howl({
        src: [currentSong.audio_url],
        html5: true, // streaming (MP3 Storage Supabase, même volumineux)
        volume: useMusicStore.getState().volume,
        onload: () => useMusicStore.getState().setDuration(howl.duration() || 0),
        onplay: () => {
          useMusicStore.getState().setPlaying(true);
          const tick = () => {
            if (howlRef.current === howl) {
              useMusicStore.getState().setProgress(howl.seek() ?? 0);
              rafRef.current = window.setTimeout(tick, 500);
            }
          };
          tick();
        },
        onpause: () => useMusicStore.getState().setPlaying(false),
        onend: () => {
          const store = useMusicStore.getState();
          if (store.repeat === "one") {
            howl.seek(0);
            howl.play();
          } else {
            store.next();
          }
        },
        onloaderror: () => useMusicStore.getState().setPlaying(false),
      });
      howlRef.current = howl;

      if (useMusicStore.getState().isPlaying) howl.play();
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) window.clearTimeout(rafRef.current);
    };
  }, [currentSong]);

  // --- Play / Pause ---
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;
    if (isPlaying && !howl.playing()) howl.play();
    if (!isPlaying && howl.playing()) howl.pause();
  }, [isPlaying]);

  // --- Volume ---
  useEffect(() => {
    howlRef.current?.volume(volume);
  }, [volume]);

  // --- Repeat "one" appliqué côté Howler ---
  useEffect(() => {
    if (howlRef.current) howlRef.current.loop(repeat === "one");
  }, [repeat]);

  // --- Nettoyage au démontage ---
  useEffect(() => {
    return () => {
      if (rafRef.current) window.clearTimeout(rafRef.current);
      howlRef.current?.unload();
    };
  }, []);

  // --- Contrôles exposés ---
  const seek = (seconds: number) => {
    const howl = howlRef.current;
    if (!howl) return;
    howl.seek(seconds);
    useMusicStore.getState().setProgress(seconds);
  };

  return { seek };
}
