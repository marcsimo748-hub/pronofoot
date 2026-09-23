/**
 * Client Supabase avec la clé SERVICE ROLE — UNIQUEMENT côté serveur.
 * Contourne les policies RLS : réservé aux routes API protégées (cron, admin, sync).
 * ⚠️ Ne JAMAIS importer ce fichier dans un Client Component.
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "[pronofoot] SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquante. " +
        "Ajoutez-les dans .env.local (ou dans les variables Vercel)."
    );
  }

  adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/** Version "douce" : ne jette pas, retourne null si non configuré */
export function tryGetSupabaseAdminClient(): SupabaseClient | null {
  try {
    return getSupabaseAdminClient();
  } catch {
    return null;
  }
}

/** Vérifie que l'appelant d'une route API est bien administrateur */
export async function requireAdminUser(req: Request): Promise<{ id: string; username: string } | null> {
  const authHeader = req.headers.get("authorization");
  // Autorisation alternative par secret cron (pour les tâches automatisées)
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return { id: "cron", username: "cron" };
  }
  try {
    const { createSupabaseServerClient } = await import("./server");
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) return null;
    return { id: profile.id, username: profile.username };
  } catch {
    return null;
  }
}
