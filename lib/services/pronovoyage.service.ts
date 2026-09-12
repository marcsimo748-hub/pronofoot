/**
 * Service PRONO-VOYAGE (MODULE 6) — covoiturage de la communauté.
 * Les billets bus / train / avion sont des LIENS officiels (aucune donnée
 * copiée). Ici : publication de trajets, recherche, modération simple
 * (3 signalements = trajet masqué automatiquement), outil admin n°13.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PronoVoyageTrip } from "@/lib/types";

export const TRIP_REPORT_REASONS = [
  "Trajet mensonger ou frauduleux",
  "Arnaque / fraude",
  "Faux profil",
  "Contenu inapproprié",
  "Spam / publicité",
  "Autre",
];

/** Liste des trajets (RLS : actifs pour tous, les siens pour l'auteur, tout pour l'admin) */
export async function listTrips(
  filters: { origin?: string; dest?: string; id?: string },
  opts: { mine?: boolean; userId?: string; all?: boolean } = {}
): Promise<PronoVoyageTrip[]> {
  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("prono_voyage_trips")
      .select("*, author:profiles(username, avatar_url)")
      .order("trip_date", { ascending: true })
      .limit(60);

    if (filters.id) query = query.eq("id", filters.id);
    if (opts.mine && opts.userId) query = query.eq("user_id", opts.userId);
    if (filters.origin) query = query.ilike("origin_city", `%${filters.origin.replace(/[%(),]/g, " ")}%`);
    if (filters.dest) query = query.ilike("dest_city", `%${filters.dest.replace(/[%(),]/g, " ")}%`);

    const { data, error } = await query;
    if (error || !data) return [];
    // Les trajets passés (avant aujourd'hui) ne sont plus affichés côté public
    // (sauf pour l'auteur ou l'admin)
    const today = new Date().toISOString().slice(0, 10);
    return (data as unknown as PronoVoyageTrip[]).filter(
      (t) => opts.mine || opts.all || t.trip_date >= today
    );
  } catch {
    return [];
  }
}

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Publie un trajet covoiturage (RLS : à soi-même uniquement) */
export async function createTrip(
  userId: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; code?: string; trip?: PronoVoyageTrip }> {
  const origin = clean(body.origin_city, 70);
  const dest = clean(body.dest_city, 70);
  if (origin.length < 2 || dest.length < 2) return { ok: false, code: "villes_invalides" };

  const dateStr = String(body.trip_date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { ok: false, code: "date_invalide" };
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr < today) return { ok: false, code: "date_passee" };

  const seats = Math.min(8, Math.max(1, Number(body.seats) || 3));
  const price = Math.min(999, Math.max(0, Number(body.price_eur) || 0));
  const contactPreference = ["whatsapp", "email"].includes(String(body.contact_preference))
    ? String(body.contact_preference)
    : "whatsapp";
  const contactValue = clean(body.contact_value, 150);
  if (!contactValue) return { ok: false, code: "contact_manquant" };

  const row = {
    user_id: userId,
    origin_city: origin,
    dest_city: dest,
    trip_date: dateStr,
    seats,
    price_eur: price,
    note: clean(body.note, 500),
    contact_preference: contactPreference,
    contact_value: contactValue,
    status: "active",
  };

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prono_voyage_trips")
      .insert(row)
      .select("*, author:profiles(username, avatar_url)")
      .single();
    if (error) {
      if (error.message.includes("exist") || error.code === "PGRST205") {
        return { ok: false, code: "no_table" };
      }
      return { ok: false, code: "db_error" };
    }
    return { ok: true, trip: data as unknown as PronoVoyageTrip };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/** Masque / affiche un trajet (RLS : propriétaire ou admin) */
export async function updateTripStatus(
  id: string,
  status: "active" | "hidden" | "removed"
): Promise<{ ok: boolean; code?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("prono_voyage_trips")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      if (error.message.includes("exist")) return { ok: false, code: "no_table" };
      return { ok: false, code: "not_allowed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/** Supprime un trajet (RLS : propriétaire ou admin) */
export async function deleteTrip(id: string): Promise<{ ok: boolean; code?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("prono_voyage_trips").delete().eq("id", id);
    if (error) {
      if (error.message.includes("exist")) return { ok: false, code: "no_table" };
      return { ok: false, code: "not_allowed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/** Signale un trajet. 3 signalements différents = masquage automatique. */
export async function reportTrip(
  userId: string,
  tripId: string,
  reason: string
): Promise<{ ok: boolean; code?: string; hidden?: boolean }> {
  const safeReason = TRIP_REPORT_REASONS.includes(reason) ? reason : "Autre";
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("prono_voyage_trip_reports")
      .insert({ trip_id: tripId, user_id: userId, reason: safeReason });
    if (error) {
      if (error.message.includes("exist")) return { ok: false, code: "no_table" };
      if (error.code === "23505") return { ok: false, code: "already_reported" };
      return { ok: false, code: "db_error" };
    }

    const admin = tryGetSupabaseAdminClient();
    if (admin) {
      const { count } = await admin
        .from("prono_voyage_trip_reports")
        .select("id", { count: "exact", head: true })
        .eq("trip_id", tripId);
      if ((count ?? 0) >= 3) {
        await admin
          .from("prono_voyage_trips")
          .update({ status: "hidden", reports_count: count ?? 3, updated_at: new Date().toISOString() })
          .eq("id", tripId);
        return { ok: true, hidden: true };
      }
      await admin.from("prono_voyage_trips").update({ reports_count: count ?? 0 }).eq("id", tripId);
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "exception" };
  }
}
