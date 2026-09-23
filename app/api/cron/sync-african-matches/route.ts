import { NextResponse } from "next/server";
import { syncAfricanMatches } from "@/lib/services/sync-african-matches.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/sync-african-matches
 *
 * Endpoint CRON pour Vercel Cron (gratuit — 1×/jour ou 2×/jour).
 * - Authentification par header `Authorization: Bearer <CRON_SECRET>`
 *   (configuré via variable d'env `CRON_SECRET` sur Vercel).
 * - Plage : J-1 → J+14 (matche la config par défaut).
 *
 * Config vercel.json :
 * {
 *   "crons": [
 *     { "path": "/api/cron/sync-african-matches", "schedule": "0 6 * * *" }
 *   ]
 * }
 *
 * Idempotent, sans effet de bord sur les pronos / badges / settlement.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized (cron)" },
      { status: 401 }
    );
  }

  try {
    const result = await syncAfricanMatches();
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
