import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/match-result — enregistre un résultat et calcule
 * AUTOMATIQUEMENT les points de tous les pronostics (RPC SQL settle_match).
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

    return NextResponse.json({
      ok: true,
      data: { settled: typeof settled === "number" ? settled : 0, home, away },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
