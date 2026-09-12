import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJobPrefs } from "@/lib/services/pronojob.service";
import type { JobPrefs } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET  /api/prono-jobs/prefs — préférences emploi de l'utilisateur connecté.
 * POST /api/prono-jobs/prefs — enregistre les préférences (alimentent le PronoScore).
 * Corps POST : { keywords, city, remote_only, german_level, english_level, contract }
 */
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const prefs = await getJobPrefs(user.id);
    return NextResponse.json({ ok: true, data: prefs });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const body = (await req.json()) as Partial<JobPrefs>;
    const row = {
      user_id: user.id,
      keywords: String(body.keywords ?? "").slice(0, 300),
      city: String(body.city ?? "").slice(0, 80),
      remote_only: Boolean(body.remote_only),
      german_level: ["none", "A1", "A2", "B1", "B2", "C1", "C2"].includes(String(body.german_level)) ? String(body.german_level) : "none",
      english_level: ["none", "A1", "A2", "B1", "B2", "C1", "C2"].includes(String(body.english_level)) ? String(body.english_level) : "none",
      contract: ["", "full-time", "part-time", "contract", "internship", "freelance"].includes(String(body.contract)) ? String(body.contract) : "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("prono_job_prefs")
      .upsert(row, { onConflict: "user_id" });

    if (error) {
      // Tables 004 pas encore créées ?
      if (error.message.includes("exist") || error.code === "PGRST205") {
        return NextResponse.json({ ok: false, code: "no_table" }, { status: 200 });
      }
      throw error;
    }
    return NextResponse.json({ ok: true, data: row });
  } catch (e) {
    console.error("[api/prono-jobs/prefs]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
