/**
 * API SIGNALEMENT ANNONCE (MODULE 5) — POST /api/prono-annonces/report
 * 3 signalements différents = annonce masquée automatiquement.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reportAnnonce } from "@/lib/services/pronoannonces.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id || !body.reason) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const result = await reportAnnonce(user.id, body.id, body.reason);
  if (!result.ok) {
    const status = result.code === "already_reported" ? 409 : 400;
    return NextResponse.json({ error: result.code }, { status });
  }
  return NextResponse.json({ ok: true, hidden: result.hidden ?? false });
}
