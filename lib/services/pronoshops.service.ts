/**
 * Service PRONO-BOUTIQUES — boutiques des membres (/boutiques).
 * Une boutique = page personnalisée (thème, logo, accroche) qui affiche
 * les annonces COMMERCIALES de son propriétaire (articles & services).
 * Jamais de transaction : le contact passe par WhatsApp / chat PRONO.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listAnnonces } from "@/lib/services/pronoannonces.service";

export interface PronoShop {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  city: string;
  quartier: string;
  postal: string;
  theme: string;
  logo_url: string;
  whatsapp: string;
  status: string;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null } | null;
}

/** Catégories affichées dans une boutique (articles & services uniquement) */
export const SHOP_CATS = [
  "service", "coiffure", "demenagement", "dj", "chauffeur", "gardenfant",
  "voitures", "transport", "electronique", "mode", "maison", "objets",
];

const SHOP_THEMES_IDS = ["nuit", "emeraude", "ocean", "coucher", "violet", "or"];
const AUTHOR = "*, author:profiles(username, avatar_url)";

const clean = (v: unknown, max: number): string =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Génère un slug URL propre depuis le nom (accents retirés, minuscules, tirets) */
export function slugifyShop(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ---------- Lecture ----------

export async function listShops(): Promise<PronoShop[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prono_shops")
      .select(AUTHOR)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(120);
    if (error || !data) return [];
    return data as unknown as PronoShop[];
  } catch {
    return [];
  }
}

export async function getMyShop(userId: string): Promise<PronoShop | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("prono_shops")
      .select(AUTHOR)
      .eq("user_id", userId)
      .maybeSingle();
    return (data as unknown as PronoShop) ?? null;
  } catch {
    return null;
  }
}

export async function getShopBySlug(slug: string): Promise<PronoShop | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("prono_shops")
      .select(AUTHOR)
      .eq("slug", slug)
      .maybeSingle();
    return (data as unknown as PronoShop) ?? null;
  } catch {
    return null;
  }
}

/** Articles & services actifs du propriétaire (ce que sa boutique affiche) */
export async function getShopItems(userId: string) {
  const items = await listAnnonces({}, { mine: true, userId });
  return items.filter((a) => a.status === "active" && SHOP_CATS.includes(a.category));
}

/** Nombre d'articles par propriétaire (pour l'annuaire) */
export async function shopItemCounts(): Promise<Record<string, number>> {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("prono_annonces")
      .select("user_id, category, status")
      .eq("status", "active")
      .limit(2000);
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      if (SHOP_CATS.includes(row.category)) {
        counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
      }
    }
    return counts;
  } catch {
    return {};
  }
}

// ---------- Écriture ----------

function validateShopBody(body: Record<string, unknown>) {
  const name = clean(body.name, 60);
  if (name.length < 3) return { error: "name" as const };
  const theme = SHOP_THEMES_IDS.includes(String(body.theme)) ? String(body.theme) : "nuit";
  return {
    data: {
      name,
      tagline: clean(body.tagline, 90),
      description: clean(body.description, 1200),
      city: clean(body.city, 70),
      quartier: clean(body.quartier, 70),
      postal: clean(body.postal, 12).replace(/[^0-9A-Za-z -]/g, ""),
      theme,
      logo_url: clean(body.logo_url, 500),
      whatsapp: clean(body.whatsapp, 30).replace(/[^\d+]/g, ""),
    },
  };
}

export async function createShop(
  userId: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; code?: string; shop?: PronoShop }> {
  const parsed = validateShopBody(body);
  if ("error" in parsed) return { ok: false, code: "invalid_name" };

  // 1 boutique par membre
  const existing = await getMyShop(userId);
  if (existing) return { ok: false, code: "already_has_shop", shop: existing };

  const supabase = createSupabaseServerClient();

  // Slug unique : nom puis suffixes aléatoires si besoin
  let slug = slugifyShop(parsed.data.name);
  if (slug.length < 3) slug = `boutique-${Date.now().toString(36)}`;
  for (let i = 0; i < 5; i++) {
    const trySlug = i === 0 ? slug : `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("prono_shops")
      .insert({ ...parsed.data, user_id: userId, slug: trySlug })
      .select(AUTHOR)
      .single();
    if (!error && data) return { ok: true, shop: data as unknown as PronoShop };
    if (error && !String(error.message).includes("duplicate key")) {
      if (String(error.message).includes("relation") || error.code === "PGRST205") {
        return { ok: false, code: "no_table" };
      }
      return { ok: false, code: "db_error" };
    }
    // doublon de slug → on retente avec un suffixe
  }
  return { ok: false, code: "slug_taken" };
}

export async function updateShop(
  userId: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; code?: string; shop?: PronoShop }> {
  const parsed = validateShopBody(body);
  if ("error" in parsed) return { ok: false, code: "invalid_name" };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("prono_shops")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select(AUTHOR)
    .single();
  if (error || !data) return { ok: false, code: "db_error" };
  return { ok: true, shop: data as unknown as PronoShop };
}
