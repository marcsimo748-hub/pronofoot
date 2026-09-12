/**
 * NOTIFICATIONS IN-APP (Mission 10).
 * Créées uniquement par les triggers SQL (011) : nouveau message,
 * nouvelle discussion, coordonnées partagées. Ici on ne fait que
 * lire / marquer comme lu — RLS : chacun voit ses notifications.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PronoNotification } from "@/lib/types";

const FALLBACK_SELECT = "id, type, title, body, link, read, created_at";

/** Table pas encore créée (SQL 011 non exécuté) → liste vide silencieuse */
function isMissingTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "PGRST204" ||
    code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

/** Dernières notifications du membre */
export async function listNotifications(userId: string, limit = 15): Promise<PronoNotification[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prono_notifications")
      .select(FALLBACK_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (isMissingTable(error)) return [];
    if (error) return [];
    return (data ?? []) as PronoNotification[];
  } catch {
    return [];
  }
}

/** Nombre de notifications non lues */
export async function unreadNotificationsCount(userId: string): Promise<number> {
  try {
    const supabase = createSupabaseServerClient();
    const { count, error } = await supabase
      .from("prono_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (isMissingTable(error)) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Marquer une notification comme lue */
export async function markNotificationRead(userId: string, id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("prono_notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

/** Tout marquer comme lu */
export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("prono_notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    return !error;
  } catch {
    return false;
  }
}
