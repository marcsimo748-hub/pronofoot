"use client";

/**
 * Store du widget IA (historique de conversation, état d'ouverture).
 * Historique persisté dans Supabase (chat_history) pour les utilisateurs
 * connectés ; en local pour les invités.
 */

import { create } from "zustand";
import type { ChatMsg } from "@/lib/types";

interface AiState {
  isOpen: boolean;
  isTyping: boolean;
  messages: ChatMsg[];
  provider: string | null;

  open: () => void;
  close: () => void;
  toggle: () => void;
  setTyping: (t: boolean) => void;
  addMessage: (msg: ChatMsg) => void;
  setMessages: (msgs: ChatMsg[]) => void;
  clear: () => void;
  setProvider: (p: string | null) => void;
}

export const useAiStore = create<AiState>((set) => ({
  isOpen: false,
  isTyping: false,
  messages: [
    {
      role: "assistant",
      content:
        "Salut 👋 Je suis l'assistant de Pronofoot. Je peux t'aider à naviguer, trouver les prochains matchs, les scores, les news ou la musique. Que cherches-tu ?",
    },
  ],
  provider: null,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setTyping: (t) => set({ isTyping: t }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  clear: () =>
    set({
      messages: [
        { role: "assistant", content: "Nouvelle conversation ! Comment puis-je t'aider ?" },
      ],
    }),
  setProvider: (p) => set({ provider: p }),
}));
