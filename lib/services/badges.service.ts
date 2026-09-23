/**
 * Badges service — détecte et attribue les badges mérités.
 *
 * Appelé après chaque settlement de pronostic côté admin :
 *   - Pour chaque utilisateur dont le pronostic vient d'être validé,
 *   - On lit ses stats agrégées (vue v_user_badge_stats),
 *   - Pour chaque badge du catalogue, on teste si l'utilisateur le mérite,
 *   - On appelle la RPC `award_badge(user_id, badge_code)` (idempotente).
 *
 * Pas de duplication possible : la contrainte UNIQUE (user_id, badge_code)
 * garantit qu'un même badge ne peut être décerné deux fois.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { BADGES, type BadgeCheckInput, type BadgeDef, type Lang } from "@/lib/badges";

export interface BadgeCheckResult {
  badge: BadgeDef;
  newly_awarded: boolean;
}

/** Récupère les stats agrégées d'un utilisateur pour l'évaluation des badges. */
async function getUserBadgeStats(userId: string): Promise<BadgeCheckInput | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("v_user_badge_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;

  // Classement actuel : on prend depuis profiles.total_points (approximation)
  // Le vrai classement peut être calculé via le service `predictions.service`,
  // mais ici on a besoin d'un chiffre rapide pour le check.
  const totalPoints = (data.total_points as number) ?? 0;

  // Pour best_monthly_rank, on laisse null pour l'instant (nécessite une autre vue)
  // Sera amélioré dans une v2.

  return {
    total_predictions: (data.total_predictions as number) ?? 0,
    exact_scores: (data.exact_scores as number) ?? 0,
    correct_outcomes: (data.correct_outcomes as number) ?? 0,
    total_points: totalPoints,
    longest_streak: (data.longest_streak as number) ?? 0,
    cameroon_pronos: (data.cameroon_pronos as number) ?? 0,
    current_rank: null, // calculé séparément si besoin
    best_monthly_rank: null, // TODO migration 022 : vue v_user_monthly_rank
    active_days: (data.active_days as number) ?? 0,
  };
}

/**
 * Évalue et attribue les badges mérités pour un utilisateur.
 * À appeler après chaque settlement de pronostic.
 *
 * @returns Liste des badges (déjà obtenus + nouvellement attribués)
 */
export async function checkAndAwardBadges(userId: string): Promise<BadgeCheckResult[]> {
  const db = tryGetSupabaseAdminClient();
  if (!db) {
    // Pas de service role → on ne peut pas awarder (RLS bloque)
    // On retourne juste la liste statique basée sur les stats actuelles.
    return [];
  }

  const stats = await getUserBadgeStats(userId);
  if (!stats) return [];

  const results: BadgeCheckResult[] = [];

  for (const badge of BADGES) {
    let alreadyHas = false;
    const { data: existing } = await db
      .from("user_badges")
      .select("badge_code")
      .eq("user_id", userId)
      .eq("badge_code", badge.code)
      .maybeSingle();
    if (existing) alreadyHas = true;

    let newlyAwarded = false;
    if (!alreadyHas && badge.check(stats)) {
      const { data: ok } = await db.rpc("award_badge", {
        p_user_id: userId,
        p_badge_code: badge.code,
      });
      newlyAwarded = ok === true;
    }

    if (alreadyHas || newlyAwarded) {
      results.push({ badge, newly_awarded: newlyAwarded });
    }
  }

  return results;
}

/**
 * Lit tous les badges d'un utilisateur (vue publique).
 * Utilisé par la page /joueur/[id] pour afficher les trophées.
 */
export async function getUserBadges(userId: string): Promise<{ code: string; awarded_at: string }[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("v_user_public_badges")
    .select("badge_code, awarded_at")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    code: r.badge_code as string,
    awarded_at: r.awarded_at as string,
  }));
}

/**
 * Helper : traduit le nom d'un badge dans la langue courante.
 */
export function tBadgeName(badge: BadgeDef, lang: Lang): string {
  return badge.name[lang] ?? badge.name.fr;
}

export function tBadgeDesc(badge: BadgeDef, lang: Lang): string {
  return badge.description[lang] ?? badge.description.fr;
}
