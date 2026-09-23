import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAndAwardBadges } from "@/lib/services/badges.service";
import { checkAndAwardCountryBadges } from "@/lib/services/country-badges.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/match-result — enregistre un résultat et calcule
 * AUTOMATIQUEMENT les points de tous les pronostics (RPC SQL settle_match).
 * Déclenche ensuite l'évaluation des badges pour chaque utilisateur affecté.
 *
 * Body : { match_id, home, away }
 */
export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const db = tryGetSupabaseAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

  try {
    const body = (await req.json()) as { match_id?: string; home?: number; away?: number };
    const { match_id, home, away } = body;
    if (!match_id || !Number.isInteger(home) || !Number.isInteger(away) || (home ?? -1) < 0 || (away ?? -1) < 0) {
      return NextResponse.json({ ok: false, error: "Paramètres invalides" }, { status: 400 });
    }

    // Enregistre le résultat + settlement atomique côté SQL
    const { data: settled, error } = await db.rpc("set_match_result", {
      p_match_id: match_id,
      p_home: home,
      p_away: away,
    });
    if (error) throw error;

    // Récupère les user_ids impactés par ce settlement (pronostiqueurs sur ce match)
    const { data: impacted } = await db
      .from("predictions")
      .select("user_id")
      .eq("match_id", match_id);

    const userIds = Array.from(new Set((impacted ?? []).map((r) => r.user_id as string)));

    // Évalue les badges pour chaque utilisateur affecté (best-effort, non bloquant)
    const newBadges: { user_id: string; badge_code: string }[] = [];
    const newCountryBadges: { user_id: string; badge_code: string; tier: number }[] = [];
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          // Badges classiques (centurion, streak, etc.)
          const results = await checkAndAwardBadges(uid);
          for (const r of results) {
            if (r.newly_awarded) {
              newBadges.push({ user_id: uid, badge_code: r.badge.code });
            }
          }
          // Badges pays africain (supporter-cameroun, fidele-senegal, etc.)
          const countryResults = await checkAndAwardCountryBadges(uid);
          for (const r of countryResults) {
            if (r.newly) {
              newCountryBadges.push({ user_id: uid, badge_code: `${r.tier === 1 ? "supporter" : r.tier === 2 ? "fidele" : "ambassadeur"}-${r.slug}`, tier: r.tier });
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("[badges] check failed for user", uid, err);
        }
      })
    );

    return NextResponse.json({
      ok: true,
      data: {
        settled: typeof settled === "number" ? settled : 0,
        home,
        away,
        impacted_users: userIds.length,
        new_badges: newBadges,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
