"use client";

/**
 * Store UI transverse : déverrouillage du mode Admin
 * (5 clics sur le logo), persisté localement.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  adminUnlocked: boolean;
  announcementDismissed: string; // message déjà fermé par l'utilisateur
  setAdminUnlocked: (v: boolean) => void;
  dismissAnnouncement: (message: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      adminUnlocked: false,
      announcementDismissed: "",
      setAdminUnlocked: (v) => set({ adminUnlocked: v }),
      dismissAnnouncement: (message) => set({ announcementDismissed: message }),
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
