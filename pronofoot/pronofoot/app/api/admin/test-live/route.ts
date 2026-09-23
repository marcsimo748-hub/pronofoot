import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/test-live — Mode Testeur LIVE 🔴
 *  • start    : active le mode (setting live_tester.active = true)
 *  • stop     : désactive
 *  • simulate : génère/met à jour de faux matchs "en direct" dans live_scores
 *               (préfixe test_ → aucun impact sur les pronostics/points)
 *  • clear    : supprime toutes les lignes de test
 */
export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const db = tryGetSupabaseAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

  try {
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    const action = body.action ?? "simulate";

    if (action === "start" || action === "stop") {
      const active = action === "start";
      await db.from("site_settings").upsert(
        { key: "live_tester", value: { active }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
      if (!active) {
        await db.from("live_scores").delete().like("id", "test_%");
      }
      return NextResponse.json({ ok: true, data: { active } });
    }

    if (action === "clear") {
      const { error } = await db.from("live_scores").delete().like("id", "test_%");
      if (error) throw error;
      return NextResponse.json({ ok: true, data: { cleared: true } });
    }

    // --- simulate : matchs fictifs à partir des prochains vrais matchs ---
    const now = new Date();
    const { data: upcoming } = await db
      .from("matches")
      .select("id, league, home_team, away_team, match_date")
      .gte("match_date", now.toISOString())
      .order("match_date")
      .limit(6);

    if (!upcoming?.length) {
      return NextResponse.json({ ok: true, data: { simulated: 0 } });
    }

    for (let i = 0; i < upcoming.length; i++) {
      const m = upcoming[i];
      const minute = Math.min(90, 5 + Math.floor(Math.random() * 85));
      const status = minute >= 90 ? "FT" : minute >= 45 ? "2H" : "1H";
      const row = {
        id: `test_${m.id}`,
        league: m.league,
        match_date: m.match_date,
        home_team: `${m.home_team} (TEST)`,
        away_team: m.away_team,
        home_score: Math.floor(Math.random() * 4),
        away_score: Math.floor(Math.random() * 4),
        status,
        elapsed: minute,
        raw: { test: true, index: i },
        updated_at: new Date().toISOString(),
      };
      await db.from("live_scores").upsert(row);
    }

    return NextResponse.json({ ok: true, data: { simulated: upcoming.length } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
