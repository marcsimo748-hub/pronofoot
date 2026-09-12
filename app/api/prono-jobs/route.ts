import { NextRequest, NextResponse } from "next/server";
import { getJobs, scoreForJob, getJobPrefs } from "@/lib/services/pronojob.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobFilters, PronoScoredJob } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/prono-jobs — liste paginée des offres + PronoScore personnalisé.
 * Query : q, city, country, contract, remote (1), source, page.
 * Offres en cache DB (cron) ou en lecture live selon disponibilité.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const filters: JobFilters = {
      q: sp.get("q") ?? "",
      city: sp.get("city") ?? "",
      country: sp.get("country") ?? "",
      contract: sp.get("contract") ?? "",
      remote: sp.get("remote") === "1",
      source: sp.get("source") ?? "",
      page: Math.max(0, Number(sp.get("page") ?? 0) || 0),
    };

    // Préférences de l'utilisateur connecté (alimentent le PronoScore)
    let prefs = null;
    try {
      const supabase = createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) prefs = await getJobPrefs(user.id);
    } catch {
      /* anonyme → pas de score personnalisé */
    }

    const { jobs, total, mode } = await getJobs(filters);
    const scored: PronoScoredJob[] = jobs.map((j) => {
      const s = scoreForJob(j, prefs);
      return { ...j, score: s?.score ?? null, reasons: s?.reasons ?? [] };
    });

    return NextResponse.json({ ok: true, data: { jobs: scored, total, mode } });
  } catch (e) {
    console.error("[api/prono-jobs]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
