import { NextResponse } from "next/server";
import { syncJobs } from "@/lib/services/pronojob.service";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET|POST /api/cron/jobs — Cron PRONOJOB (toutes les 6 heures recommandé).
 * Agrège les offres depuis les API officielles (Arbeitnow, Remotive, Adzuna,
 * JSearch) et met à jour le cache `prono_jobs` (purge auto > 30 jours).
 *
 * Sécurité : si CRON_SECRET est défini, il faut envoyer le header
 * `Authorization: Bearer <CRON_SECRET>` (cron-job.org → "Avancé" → En-têtes).
 */
async function handle(req: Request) {
  // Sécurité optionnelle : si le secret est configuré, on l'exige
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = tryGetSupabaseAdminClient();
  if (!admin) return NextResponse.json({ ok: true, skipped: "no_supabase" });

  try {
    const result = await syncJobs();
    if (!result.ok && result.error === "no_supabase_admin") {
      return NextResponse.json({ ok: true, skipped: "no_supabase" });
    }
    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    console.error("[api/cron/jobs]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export { handle as GET, handle as POST };
