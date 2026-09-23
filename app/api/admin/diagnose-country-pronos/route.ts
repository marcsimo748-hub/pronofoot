import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getUserCountryPronos,
  getUserCountryBadges,
} from "@/lib/services/country-badges.service";
import { AFRICA_COUNTRIES } from "@/lib/services/country-badges.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/diagnose-country-pronos?user_id=UUID
 *
 * Route de DIAGNOSTIC ADMIN (lecture seule, n'écrit rien) — vérifie que
 * la vue SQL v_user_country_pronos ne plante plus après le fix du
 * commit b8e0228.
 *
 * - Liste tous les pays africains avec le nombre de pronos trouvés
 * - Liste tous les badges pays déjà attribués à l'utilisateur
 *
 * Body attendu : ?user_id=<uuid> (par défaut : admin appelant).
 *
 * Cette route est idempotente et SANS EFFET DE BORD : elle ne décerne
 * aucun badge, ne modifie aucune ligne.
 */
export async function GET(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin)
    return NextResponse.json(
      { ok: false, error: "Accès refusé" },
      { status: 403 }
    );

  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id") ?? admin.id;

  const db = tryGetSupabaseAdminClient();
  if (!db)
    return NextResponse.json(
      { ok: false, error: "Service role non configuré" },
      { status: 500 }
    );

  // 1) Appel direct à la vue SQL (test brut)
  const { data: rawRows, error: vueError } = await db
    .from("v_user_country_pronos")
    .select("country_key, prono_count")
    .eq("user_id", userId);

  // 2) Appel via le service TS (test métier)
  let pronos: Awaited<ReturnType<typeof getUserCountryPronos>> = [];
  let badges: Awaited<ReturnType<typeof getUserCountryBadges>> = [];
  let serviceError: string | null = null;
  try {
    pronos = await getUserCountryPronos(userId);
    badges = await getUserCountryBadges(userId);
  } catch (e) {
    serviceError = e instanceof Error ? e.message : String(e);
  }

  // 3) Sanity-check : la vue renvoie-t-elle bien la liste attendue ?
  const countriesWithPronos = pronos.filter((p) => p.prono_count > 0);

  return NextResponse.json({
    ok: !vueError && !serviceError,
    user_id: userId,
    diag: {
      vue_ok: !vueError,
      vue_error: vueError?.message ?? null,
      vue_row_count: rawRows?.length ?? 0,
      service_ok: !serviceError,
      service_error: serviceError,
    },
    totals: {
      countries_catalog_size: AFRICA_COUNTRIES.length,
      countries_with_pronos: countriesWithPronos.length,
      total_pronos_in_view: pronos.reduce((s, c) => s + c.prono_count, 0),
      badges_awarded: badges.length,
    },
    countries_with_pronos: countriesWithPronos,
    badges,
  });
}
