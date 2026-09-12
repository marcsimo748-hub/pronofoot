import { NextResponse } from "next/server";
import { cleanupPassedMatches } from "@/lib/services/football.service";

export const dynamic = "force-dynamic";

/**
 * GET|POST /api/matches/cleanup — retire automatiquement les matchs passés :
 *  • scheduled + date passée  → 'missed' (verrouillés, hors liste de pronostics)
 *  • missed    > 7 jours      → 'archived'
 *  • finished  > 30 jours     → 'archived'
 */
async function handle() {
  try {
    await cleanupPassedMatches();
    return NextResponse.json({ ok: true, data: { cleaned: true, at: new Date().toISOString() } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
