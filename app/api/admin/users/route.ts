import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/users — promouvoir / rétrograder un administrateur.
 * Body : { user_id, is_admin }
 */
export async function PATCH(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const db = tryGetSupabaseAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

  try {
    const body = (await req.json()) as { user_id?: string; is_admin?: boolean };
    if (!body.user_id || typeof body.is_admin !== "boolean") {
      return NextResponse.json({ ok: false, error: "Paramètres invalides" }, { status: 400 });
    }
    if (body.user_id === admin.id && body.is_admin === false) {
      return NextResponse.json({ ok: false, error: "Impossible de te rétrograder toi-même." }, { status: 400 });
    }

    const { error } = await db
      .from("profiles")
      .update({ is_admin: body.is_admin })
      .eq("id", body.user_id);
    if (error) throw error;

    return NextResponse.json({ ok: true, data: { user_id: body.user_id, is_admin: body.is_admin } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
