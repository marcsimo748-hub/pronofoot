import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bonus-settle — clôture une catégorie de bonus de saison.
 * Les joueurs ayant la bonne réponse reçoivent leurs points automatiquement (RPC SQL).
 * Body : { category, answer }
 */
export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const db = tryGetSupabaseAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

  try {
    const body = (await req.json()) as { category?: string; answer?: string };
    if (!body.category?.trim() || !body.answer?.trim()) {
      return NextResponse.json({ ok: false, error: "Catégorie et réponse requises" }, { status: 400 });
    }

    const { data: settled, error } = await db.rpc("settle_bonus", {
      p_category: body.category.trim(),
      p_answer: body.answer.trim(),
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, data: { settled: typeof settled === "number" ? settled : 0 } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
