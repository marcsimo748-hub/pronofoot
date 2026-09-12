import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHousingLetter, saveHousingLetter } from "@/lib/services/pronohousing.service";

export const dynamic = "force-dynamic";

/**
 * GET  /api/prono-housing — ma lettre Anschreiben sauvegardée.
 * POST /api/prono-housing — enregistre la lettre.
 * Corps : { data, letter_de, letter_fr }
 */
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const letter = await getHousingLetter(user.id);
    return NextResponse.json({ ok: true, data: letter });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const body = await req.json();
    const result = await saveHousingLetter(user.id, body ?? {});
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/prono-housing]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
