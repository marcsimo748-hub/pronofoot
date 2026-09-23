import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import { importFixtures, backfillMissedResults } from "@/lib/services/football.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/backfill-results — récupère TOUT de suite les résultats
 * manquants via l'API (sans attendre le cycle 6 h) : matchs passés sans
 * score → résultats + points des pronostics. Admin only.
 */
export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  try {
    // 1) Rattrapage des résultats manquants (par date, plan-gratuit compatible)
    const backfill = await backfillMissedResults();
    // 2) Import classique des nouveaux fixtures (no-op si saison interdite au plan)
    const result = await importFixtures().catch(() => ({ imported: 0, settled: 0 }));
    return NextResponse.json({
      ok: true,
      data: {
        imported: result.imported ?? 0,
        settled: (backfill.settled ?? 0) + (result.settled ?? 0),
        diag: backfill.diag ?? [],
        dates: backfill.dates ?? [],
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
