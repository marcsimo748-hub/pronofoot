"use client";

/**
 * Client Supabase côté NAVIGATEUR (Client Components).
 * Utilisé pour : auth, realtime (scores live), lectures/écritures simples
 * respectant les policies RLS (pronostics, chat...).
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // En développement sans config, on laisse supabase-js échouer proprement
    // (les composants catchent les erreurs et affichent des états vides).
    console.warn("[pronofoot] Variables Supabase manquantes — mode dégradé.");
  }

  browserClient = createBrowserClient(url ?? "https://placeholder.supabase.co", anonKey ?? "public-anon-key");
  return browserClient;
}
