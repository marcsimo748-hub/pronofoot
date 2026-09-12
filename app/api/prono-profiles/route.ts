import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfiles, upsertProfile } from "@/lib/services/pronoprofile.service";

export const dynamic = "force-dynamic";

/**
 * GET  /api/prono-profiles — tous mes profils (1 par intention max).
 * POST /api/prono-profiles — enregistre le profil d'une intention.
 * Corps : { intention: "emploi"|"logement"|"visa"|"rencontre", ...champs }
 */
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const profiles = await getProfiles(user.id);
    return NextResponse.json({ ok: true, data: profiles });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const result = await upsertProfile(user.id, body);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/prono-profiles]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
