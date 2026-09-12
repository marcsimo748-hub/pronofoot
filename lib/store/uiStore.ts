"use client";

/**
 * Store UI transverse : déverrouillage du mode Admin
 * (5 clics sur le logo) et langue de l'interface (FR/EN/DE),
 * persistés localement.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UiLang = "fr" | "en" | "de";

interface UiState {
  adminUnlocked: boolean;
  announcementDismissed: string; // message déjà fermé par l'utilisateur
  lang: UiLang; // langue de l'interface (FR par défaut)
  setAdminUnlocked: (v: boolean) => void;
  dismissAnnouncement: (message: string) => void;
  setLang: (lang: UiLang) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      adminUnlocked: false,
      announcementDismissed: "",
      lang: "fr",
      setAdminUnlocked: (v) => set({ adminUnlocked: v }),
      dismissAnnouncement: (message) => set({ announcementDismissed: message }),
      setLang: (lang) => set({ lang }),
    }),
    {
      name: "pronofoot-ui",
      // ⚠️ skipHydration : le localStorage n'est PAS relu au premier rendu client
      // (le serveur ne peut pas le lire → valeurs différentes → erreur React #425).
      // La réhydratation est faite APRÈS montage dans SyncManager.
      skipHydration: true,
    }
  )
);
