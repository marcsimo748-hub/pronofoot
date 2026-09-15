import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/match-predictions — tous les pronostics des matchs donnés
 * (admin only, clé service : contourne le RLS « propres pronos uniquement »).
 * Body : { match_ids: string[] }
 * Retour : { predictions: Record<match_id, { username, home_score, away_score,
 *            points_earned, calculated }[]>, counts: Record<match_id, number> }
 */
export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const db = tryGetSupabaseAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

  try {
    const body = (await req.json()) as { match_ids?: string[] };
    const ids = (body.match_ids ?? []).filter((x) => typeof x === "string").slice(0, 60);
    if (ids.length === 0) return NextResponse.json({ ok: true, data: { predictions: {}, counts: {} } });

    const { data, error } = await db
      .from("predictions")
      .select("match_id, home_score, away_score, points_earned, calculated, profiles(username, avatar_url)")
      .in("match_id", ids);

    if (error) throw error;

    const predictions: Record<string, { username: string; avatar_url: string | null; home_score: number; away_score: number; points_earned: number; calculated: boolean }[]> = {};
    const counts: Record<string, number> = {};
    for (const p of (data ?? []) as unknown as {
      match_id: string;
      home_score: number;
      away_score: number;
      points_earned: number;
      calculated: boolean;
      profiles: { username: string | null; avatar_url: string | null } | null;
    }[]) {
      (predictions[p.match_id] ??= []).push({
        username: p.profiles?.username ?? "?",
        avatar_url: p.profiles?.avatar_url ?? null,
        home_score: p.home_score,
        away_score: p.away_score,
        points_earned: p.points_earned,
        calculated: p.calculated,
      });
      counts[p.match_id] = (counts[p.match_id] ?? 0) + 1;
    }
    return NextResponse.json({ ok: true, data: { predictions, counts } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
