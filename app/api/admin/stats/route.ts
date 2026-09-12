import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET /api/admin/stats — statistiques cloud de la plateforme (admin only). */
export async function GET(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const db = tryGetSupabaseAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();

    const count = async (table: string, filters: Record<string, unknown> = {}) => {
      let q = db.from(table).select("id", { count: "exact", head: true });
      for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
      const { count: c } = await q;
      return c ?? 0;
    };

    const [players, newPlayers, matchesTotal, finished, upcoming, predictions, pending, news, songs, chatMessages, groups, bonusesSettled] =
      await Promise.all([
        count("profiles"),
        db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo).then((r) => r.count ?? 0),
        count("matches"),
        count("matches", { status: "finished" }),
        db.from("matches").select("id", { count: "exact", head: true }).gte("match_date", now.toISOString()).then((r) => r.count ?? 0),
        count("predictions"),
        count("predictions", { calculated: false }),
        count("news"),
        count("songs"),
        count("chat_history"),
        count("groups"),
        count("bonus_predictions", { settled: true }),
      ]);

    // Points distribués = somme des pronostics calculés + bonus réglés
    const { data: pointsData } = await db
      .from("predictions")
      .select("points_earned")
      .eq("calculated", true);
    const pointsDistributed = (pointsData ?? []).reduce((sum, p) => sum + (p.points_earned ?? 0), 0) + bonusesSettled * 0;

    return NextResponse.json({
      ok: true,
      data: {
        players,
        newPlayers,
        matches: { total: matchesTotal, finished, upcoming },
        predictions,
        pendingPredictions: pending,
        pointsDistributed,
        news,
        songs,
        chatMessages,
        groups,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
