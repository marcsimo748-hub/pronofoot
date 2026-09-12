import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordApplication, getUserApplications } from "@/lib/services/pronojob.service";
import type { PronoJob } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/prono-jobs/apply — "Postuler depuis Pronofoot"
 * Enregistre la candidature de l'utilisateur connecté (visible dans son dashboard)
 * puis le front redirige vers l'offre originale.
 * Corps : { job: PronoJob }  (l'offre est recréée en base si elle vient du mode live)
 *
 * GET /api/prono-jobs/apply — liste des candidatures de l'utilisateur connecté.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const body = await req.json();
    const job = body?.job as Partial<PronoJob> | undefined;
    if (!job?.source || !job?.source_id || !job?.url || !job?.title) {
      return NextResponse.json({ ok: false, error: "invalid_job" }, { status: 400 });
    }

    const result = await recordApplication(user.id, {
      source: String(job.source),
      source_id: String(job.source_id),
      title: String(job.title).slice(0, 300),
      company: String(job.company ?? "").slice(0, 200),
      city: job.city ?? null,
      country: job.country ?? null,
      contract_type: String(job.contract_type ?? "other"),
      remote: Boolean(job.remote),
      description_short: job.description_short ?? null,
      url: String(job.url),
      salary_min: job.salary_min ?? null,
      salary_max: job.salary_max ?? null,
      published_at: job.published_at ?? null,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 200 });
  } catch (e) {
    console.error("[api/prono-jobs/apply]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

    const applications = await getUserApplications(user.id);
    return NextResponse.json({ ok: true, data: applications });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
