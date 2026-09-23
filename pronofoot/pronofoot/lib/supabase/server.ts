/**
 * Client Supabase côté SERVEUR (Server Components, Server Actions, Route Handlers).
 * Porteur de la session utilisateur (cookies) → respecte les policies RLS.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key";
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Appelé depuis un Server Component : ignorable (middleware gère le refresh)
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set(name, "", options);
        } catch {
          // idem
        }
      },
    },
  });
}

/** Récupère l'utilisateur + son profil, ou null (jamais d'exception) */
export async function getSessionUser() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, is_admin, total_points")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email ?? null,
      username: profile?.username ?? "joueur",
      avatar_url: profile?.avatar_url ?? null,
      is_admin: profile?.is_admin ?? false,
      total_points: profile?.total_points ?? 0,
    };
  } catch {
    return null;
  }
}
