/**
 * Country badges service — badges par pays africain.
 *
 * Chaque utilisateur qui pronostique sur des matchs impliquant un pays
 * africain peut débloquer 3 paliers :
 * - supporter-{slug} (5+ pronos)
 * - fidele-{slug} (15+ pronos)
 * - ambassadeur-{slug} (50+ pronos)
 *
 * La vue SQL v_user_country_pronos compte les pronos par pays.
 * On l'appelle après chaque settlement (via checkAndAwardBadges).
 *
 * Mapping pays → badge : cf AFRICA_COUNTRIES ci-dessous (slug + nom trilingue).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Lang } from "@/lib/badges";

export interface AfricaCountry {
  slug: string; // "cameroun", "senegal", etc.
  flag: string;
  name: Record<Lang, string>;
  /** Tier atteint (0 = aucun, 1 = supporter, 2 = fidele, 3 = ambassadeur) */
  tier: 0 | 1 | 2 | 3;
  prono_count: number;
}

/**
 * Catalogue des pays africains avec drapeaux et noms trilingues.
 * 35 pays — alignés avec AFRICA_FEATURED_TEAMS (constants.ts) + autres pays CAF.
 */
export const AFRICA_COUNTRIES: { slug: string; flag: string; name: Record<Lang, string> }[] = [
  { slug: "cameroun", flag: "🇨🇲", name: { fr: "Cameroun", en: "Cameroon", de: "Kamerun" } },
  { slug: "senegal", flag: "🇸🇳", name: { fr: "Sénégal", en: "Senegal", de: "Senegal" } },
  { slug: "maroc", flag: "🇲🇦", name: { fr: "Maroc", en: "Morocco", de: "Marokko" } },
  { slug: "nigeria", flag: "🇳🇬", name: { fr: "Nigeria", en: "Nigeria", de: "Nigeria" } },
  { slug: "cote_divoire", flag: "🇨🇮", name: { fr: "Côte d'Ivoire", en: "Ivory Coast", de: "Elfenbeinküste" } },
  { slug: "egypte", flag: "🇪🇬", name: { fr: "Égypte", en: "Egypt", de: "Ägypten" } },
  { slug: "ghana", flag: "🇬🇭", name: { fr: "Ghana", en: "Ghana", de: "Ghana" } },
  { slug: "algerie", flag: "🇩🇿", name: { fr: "Algérie", en: "Algeria", de: "Algerien" } },
  { slug: "tunisie", flag: "🇹🇳", name: { fr: "Tunisie", en: "Tunisia", de: "Tunesien" } },
  { slug: "mali", flag: "🇲🇱", name: { fr: "Mali", en: "Mali", de: "Mali" } },
  { slug: "burkina_faso", flag: "🇧🇫", name: { fr: "Burkina Faso", en: "Burkina Faso", de: "Burkina Faso" } },
  { slug: "guinee", flag: "🇬🇳", name: { fr: "Guinée", en: "Guinea", de: "Guinea" } },
  { slug: "rdc", flag: "🇨🇩", name: { fr: "RD Congo", en: "DR Congo", de: "DR Kongo" } },
  { slug: "gabon", flag: "🇬🇦", name: { fr: "Gabon", en: "Gabon", de: "Gabun" } },
  { slug: "cap_vert", flag: "🇨🇻", name: { fr: "Cap-Vert", en: "Cape Verde", de: "Kap Verde" } },
  { slug: "tanzanie", flag: "🇹🇿", name: { fr: "Tanzanie", en: "Tanzania", de: "Tansania" } },
  { slug: "kenya", flag: "🇰🇪", name: { fr: "Kenya", en: "Kenya", de: "Kenia" } },
  { slug: "ouganda", flag: "🇺🇬", name: { fr: "Ouganda", en: "Uganda", de: "Uganda" } },
  { slug: "zambie", flag: "🇿🇲", name: { fr: "Zambie", en: "Zambia", de: "Sambia" } },
  { slug: "zimbabwe", flag: "🇿🇼", name: { fr: "Zimbabwe", en: "Zimbabwe", de: "Simbabwe" } },
  { slug: "togo", flag: "🇹🇬", name: { fr: "Togo", en: "Togo", de: "Togo" } },
  { slug: "benin", flag: "🇧🇯", name: { fr: "Bénin", en: "Benin", de: "Benin" } },
  { slug: "madagascar", flag: "🇲🇬", name: { fr: "Madagascar", en: "Madagascar", de: "Madagaskar" } },
  { slug: "angola", flag: "🇦🇴", name: { fr: "Angola", en: "Angola", de: "Angola" } },
  { slug: "mozambique", flag: "🇲🇿", name: { fr: "Mozambique", en: "Mozambique", de: "Mosambik" } },
  { slug: "ethiopie", flag: "🇪🇹", name: { fr: "Éthiopie", en: "Ethiopia", de: "Äthiopien" } },
  { slug: "comores", flag: "🇰🇲", name: { fr: "Comores", en: "Comoros", de: "Komoren" } },
  { slug: "mauritanie", flag: "🇲🇷", name: { fr: "Mauritanie", en: "Mauritania", de: "Mauretanien" } },
  { slug: "libye", flag: "🇱🇾", name: { fr: "Libye", en: "Libya", de: "Libyen" } },
  { slug: "soudan", flag: "🇸🇩", name: { fr: "Soudan", en: "Sudan", de: "Sudan" } },
  { slug: "rca", flag: "🇨🇫", name: { fr: "Centrafrique", en: "Central African Republic", de: "Zentralafrikanische Republik" } },
  { slug: "guinee_equatoriale", flag: "🇬🇶", name: { fr: "Guinée Équatoriale", en: "Equatorial Guinea", de: "Äquatorialguinea" } },
  { slug: "congo", flag: "🇨🇬", name: { fr: "Congo", en: "Congo", de: "Kongo" } },
  { slug: "gambie", flag: "🇬🇲", name: { fr: "Gambie", en: "Gambia", de: "Gambia" } },
  { slug: "botswana", flag: "🇧🇼", name: { fr: "Botswana", en: "Botswana", de: "Botswana" } },
  { slug: "namibie", flag: "🇳🇦", name: { fr: "Namibie", en: "Namibia", de: "Namibia" } },
  { slug: "sierra_leone", flag: "🇸🇱", name: { fr: "Sierra Leone", en: "Sierra Leone", de: "Sierra Leone" } },
  { slug: "liberia", flag: "🇱🇷", name: { fr: "Libéria", en: "Liberia", de: "Liberia" } },
  { slug: "rwanda", flag: "🇷🇼", name: { fr: "Rwanda", en: "Rwanda", de: "Ruanda" } },
  { slug: "burundi", flag: "🇧🇮", name: { fr: "Burundi", en: "Burundi", de: "Burundi" } },
  { slug: "tchad", flag: "🇹🇩", name: { fr: "Tchad", en: "Chad", de: "Tschad" } },
  { slug: "niger", flag: "🇳🇪", name: { fr: "Niger", en: "Niger", de: "Niger" } },
];

const TIERS = [
  { tier: 1, label: "supporter", min: 5, emoji: "🌱", labelFr: "Supporter" },
  { tier: 2, label: "fidele", min: 15, emoji: "💪", labelFr: "Fidèle" },
  { tier: 3, label: "ambassadeur", min: 50, emoji: "👑", labelFr: "Ambassadeur" },
] as const;

/** Lit les pronos par pays africain pour un utilisateur. */
export async function getUserCountryPronos(userId: string): Promise<AfricaCountry[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("v_user_country_pronos")
    .select("country_key, prono_count")
    .eq("user_id", userId);
  if (error || !data) return [];

  const countBySlug = new Map<string, number>(
    (data as { country_key: string; prono_count: number }[]).map((r) => [r.country_key, r.prono_count ?? 0])
  );

  return AFRICA_COUNTRIES.map((c) => {
    const count = countBySlug.get(c.slug) ?? 0;
    let tier: 0 | 1 | 2 | 3 = 0;
    if (count >= 50) tier = 3;
    else if (count >= 15) tier = 2;
    else if (count >= 5) tier = 1;
    return { ...c, prono_count: count, tier };
  });
}

/** Évalue et attribue les badges pays pour un utilisateur (idempotent). */
export async function checkAndAwardCountryBadges(userId: string): Promise<{ slug: string; tier: number; newly: boolean }[]> {
  const db = tryGetSupabaseAdminClient();
  if (!db) return [];

  const countries = await getUserCountryPronos(userId);
  const results: { slug: string; tier: number; newly: boolean }[] = [];

  for (const c of countries) {
    if (c.tier === 0) continue;
    for (const tier of TIERS) {
      if (c.tier < tier.tier) continue;
      const { data: ok } = await db.rpc("award_country_badge", {
        p_user_id: userId,
        p_country_slug: c.slug,
        p_tier: tier.label,
      });
      results.push({ slug: c.slug, tier: tier.tier, newly: ok === true });
    }
  }
  return results;
}

/** Lit les badges pays obtenus par un utilisateur (via la vue publique). */
export async function getUserCountryBadges(
  userId: string
): Promise<{ code: string; awarded_at: string }[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("v_user_public_badges")
    .select("badge_code, awarded_at")
    .eq("user_id", userId)
    .like("badge_code", "supporter-%")
    .order("awarded_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    code: r.badge_code as string,
    awarded_at: r.awarded_at as string,
  }));
}

/** Décode un code badge pays → infos (slug, tier). */
export function decodeCountryBadge(code: string): { slug: string; tier: number; label: string; emoji: string; tierLabel: string; country: AfricaCountry | undefined } | null {
  const m = code.match(/^(supporter|fidele|ambassadeur)-(.+)$/);
  if (!m) return null;
  const [, label, slug] = m;
  const tierInfo = TIERS.find((t) => t.label === label);
  if (!tierInfo) return null;
  const country = AFRICA_COUNTRIES.find((c) => c.slug === slug);
  return { slug, tier: tierInfo.tier, label, emoji: tierInfo.emoji, tierLabel: tierInfo.labelFr, country };
}
