/**
 * Service PRONO-ANNONCES — petites annonces communautaires (MODULE 5).
 * Table prono_annonces (+ prono_annonce_reports, photos en Supabase Storage).
 * Modération simple : 3 signalements = annonce masquée automatiquement ;
 * l'admin (12ᵉ outil) peut masquer, afficher ou supprimer.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PronoAnnonce } from "@/lib/types";

export const ANNONCE_CATEGORIES = [
  { value: "rencontre", label: "❤️ Rencontre" },
  { value: "partenaire", label: "💞 Recherche partenaire" },
  { value: "ami", label: "🤝 Ami / Amie" },
  { value: "logement", label: "🏠 Logement" },
  { value: "service", label: "🛠️ Service" },
] as const;

export const REPORT_REASONS = [
  "Contenu inapproprié",
  "Arnaque / fraude",
  "Faux profil",
  "Contenu illégal",
  "Spam / publicité",
  "Autre",
];

/** Liste des annonces (RLS : actives pour tous, les siennes pour l'auteur, tout pour l'admin) */
export async function listAnnonces(
  filters: { category?: string; city?: string; q?: string; id?: string },
  opts: { mine?: boolean; userId?: string } = {}
): Promise<PronoAnnonce[]> {
  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("prono_annonces")
      .select("*, author:profiles(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(60);

    if (filters.id) query = query.eq("id", filters.id);
    if (opts.mine && opts.userId) query = query.eq("user_id", opts.userId);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.city) query = query.ilike("city", `%${filters.city.replace(/[%(),]/g, " ")}%`);
    if (filters.q) {
      const q = filters.q.replace(/[%(),]/g, " ").trim();
      if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as unknown as PronoAnnonce[];
  } catch {
    return [];
  }
}

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Publie une annonce (RLS : à soi-même uniquement) */
export async function createAnnonce(
  userId: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; code?: string; annonce?: PronoAnnonce }> {
  const category = String(body.category ?? "");
  if (!ANNONCE_CATEGORIES.some((c) => c.value === category)) {
    return { ok: false, code: "invalid_category" };
  }
  const title = clean(body.title, 90);
  if (title.length < 5) return { ok: false, code: "title_too_short" };

  const photos = Array.isArray(body.photos)
    ? (body.photos as unknown[]).map((p) => clean(p, 500)).filter(Boolean).slice(0, 3)
    : [];
  const contactPreference = ["whatsapp", "email"].includes(String(body.contact_preference))
    ? String(body.contact_preference)
    : "whatsapp";
  const contactValue = clean(body.contact_value, 150);
  if (!contactValue) return { ok: false, code: "contact_manquant" };

  const row = {
    user_id: userId,
    category,
    title,
    description: clean(body.description, 2000),
    city: clean(body.city, 70),
    country: clean(body.country, 70),
    photos,
    status: "active",
  };

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prono_annonces")
      .insert(row)
      .select("*, author:profiles(username, avatar_url)")
      .single();
    if (error) {
      if (error.message.includes("exist") || error.code === "PGRST205") {
        return { ok: false, code: "no_table" };
      }
      return { ok: false, code: "db_error" };
    }

    // Coordonnées PRIVÉES : table séparée, révélées dans le chat après accord
    const { error: contactErr } = await supabase
      .from("prono_annonces_contacts")
      .insert({ annonce_id: data.id, contact_preference: contactPreference, contact_value: contactValue });
    if (contactErr) {
      // Rollback : pas d'annonce sans coordonnées à révéler
      await supabase.from("prono_annonces").delete().eq("id", data.id);
      if (contactErr.message.includes("exist")) return { ok: false, code: "no_contact_table" };
      return { ok: false, code: "db_error" };
    }
    return { ok: true, annonce: data as unknown as PronoAnnonce };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/** Masque / affiche une annonce (RLS : propriétaire ou admin) */
export async function updateAnnonceStatus(
  id: string,
  status: "active" | "hidden" | "removed"
): Promise<{ ok: boolean; code?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("prono_annonces")
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

/** Supprime une annonce (RLS : propriétaire ou admin) */
export async function deleteAnnonce(id: string): Promise<{ ok: boolean; code?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("prono_annonces").delete().eq("id", id);
    if (error) {
      if (error.message.includes("exist")) return { ok: false, code: "no_table" };
      return { ok: false, code: "not_allowed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/**
 * Signale une annonce. À partir de 3 signalements différents,
 * l'annonce est automatiquement masquée (modération simple).
 */
export async function reportAnnonce(
  userId: string,
  annonceId: string,
  reason: string
): Promise<{ ok: boolean; code?: string; hidden?: boolean }> {
  const safeReason = REPORT_REASONS.includes(reason) ? reason : "Autre";
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("prono_annonce_reports")
      .insert({ annonce_id: annonceId, user_id: userId, reason: safeReason });
    if (error) {
      if (error.message.includes("exist")) return { ok: false, code: "no_table" };
      if (error.code === "23505") return { ok: false, code: "already_reported" };
      return { ok: false, code: "db_error" };
    }

    // Comptage via admin (les signalements ne sont lisibles que par l'admin)
    const admin = tryGetSupabaseAdminClient();
    if (admin) {
      const { count } = await admin
        .from("prono_annonce_reports")
        .select("id", { count: "exact", head: true })
        .eq("annonce_id", annonceId);
      if ((count ?? 0) >= 3) {
        // 3 signalements = masquage automatique
        await admin
          .from("prono_annonces")
          .update({ status: "hidden", reports_count: count ?? 3, updated_at: new Date().toISOString() })
          .eq("id", annonceId);
        return { ok: true, hidden: true };
      }
      await admin.from("prono_annonces").update({ reports_count: count ?? 0 }).eq("id", annonceId);
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "exception" };
  }
}
