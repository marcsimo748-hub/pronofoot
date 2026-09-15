import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import { importFixtures } from "@/lib/services/football.service";

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
    const result = await importFixtures();
    if (result.skipped) {
      return NextResponse.json({ ok: false, error: `Import impossible : ${result.skipped}` }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      data: { imported: result.imported, settled: result.settled ?? 0 },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
