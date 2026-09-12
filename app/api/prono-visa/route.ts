import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getVisaHistory, saveVisaCheck } from "@/lib/services/pronovisa.service";

export const dynamic = "force-dynamic";

/**
 * GET  /api/prono-visa — historique de mes simulations.
 * POST /api/prono-visa — enregistre une simulation du calculateur.
 * Corps : { visa_type, answers, score }
 */
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const history = await getVisaHistory(user.id);
    return NextResponse.json({ ok: true, data: history });
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
    const result = await saveVisaCheck(user.id, body ?? {});
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/prono-visa]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
