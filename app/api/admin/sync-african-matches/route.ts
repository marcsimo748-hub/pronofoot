import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import { syncAfricanMatches } from "@/lib/services/sync-african-matches.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s max — la sync couvre 15 jours × 4 slugs

/**
 * POST /api/admin/sync-african-matches
 * GET  /api/admin/sync-african-matches (alias)
 *
 * Déclenche manuellement la synchronisation des matchs de sélections
 * africaines depuis ESPN dans la table `matches`.
 *
 * - Admin uniquement (cookie de session + rôle admin).
 * - Idempotent (upsert sur external_id).
 * - Aucun effet sur les pronos / badges / settlement.
 * - Plage par défaut : J-1 → J+14 (paramétrable via ?past=N&future=M).
 *
 * Réponse :
 * {
 *   ok: boolean,
 *   total_fetched, total_upserted, failed_requests,
 *   by_league: { can: 8, qwc_afrique: 12, afriendly: 5 },
 *   date_range: ["2025-09-22", ..., "2025-10-06"],
 *   errors: string[]
 * }
 */
async function handle(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin)
    return NextResponse.json(
      { ok: false, error: "Accès refusé" },
      { status: 403 }
    );

  const url = new URL(req.url);
  const pastDays = Number(url.searchParams.get("past") ?? 1);
  const futureDays = Number(url.searchParams.get("future") ?? 14);

  try {
    const result = await syncAfricanMatches({ pastDays, futureDays });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
