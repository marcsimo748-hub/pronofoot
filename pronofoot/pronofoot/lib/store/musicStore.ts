"use client";

/**
 * Store global du lecteur de musique (Zustand).
 * Le lecteur reste actif pendant toute la navigation car il est monté
 * dans le layout racine et lit son état ici.
 */

import { create } from "zustand";
import type { Song } from "@/lib/types";

export type RepeatMode = "off" | "all" | "one";

interface MusicState {
  // Données
  songs: Song[];
  currentSong: Song | null;
  currentIndex: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  progress: number; // secondes
  duration: number; // secondes

  // Actions
  setSongs: (songs: Song[]) => void;
  playSong: (index: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (v: number) => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  songs: [],
  currentSong: null,
  currentIndex: -1,
  isPlaying: false,
  shuffle: false,
  repeat: "off",
  volume: 0.8,
  progress: 0,
  duration: 0,

  setSongs: (songs) => set({ songs }),

  playSong: (index) => {
    const { songs } = get();
    if (!songs.length) return;
    const i = ((index % songs.length) + songs.length) % songs.length;
    set({ currentSong: songs[i], currentIndex: i, isPlaying: true, progress: 0 });
  },

  togglePlay: () => {
    const { currentSong, isPlaying } = get();
    if (!currentSong) return;
    set({ isPlaying: !isPlaying });
  },

  setPlaying: (playing) => set({ isPlaying: playing }),

  next: () => {
    const { songs, currentIndex, shuffle } = get();
    if (!songs.length) return;
    if (shuffle && songs.length > 1) {
      let r = currentIndex;
      while (r === currentIndex) r = Math.floor(Math.random() * songs.length);
      set({ currentSong: songs[r], currentIndex: r, isPlaying: true, progress: 0 });
      return;
    }
    const i = (currentIndex + 1) % songs.length;
    set({ currentSong: songs[i], currentIndex: i, isPlaying: true, progress: 0 });
  },

  prev: () => {
    const { songs, currentIndex } = get();
    if (!songs.length) return;
    const i = (currentIndex - 1 + songs.length) % songs.length;
    set({ currentSong: songs[i], currentIndex: i, isPlaying: true, progress: 0 });
  },

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),
  setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),
}));
