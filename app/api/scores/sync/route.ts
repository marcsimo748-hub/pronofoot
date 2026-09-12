import { NextResponse } from "next/server";
import { syncLiveScores, importFixtures, syncStandings, cleanupPassedMatches } from "@/lib/services/football.service";
import { getSettings, updateSetting } from "@/lib/services/settings.service";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET|POST /api/scores/sync — Cron de synchro des scores (toutes les ~90 s).
 *
 * Protections :
 *  • Throttle serveur : un vrai appel API maximum toutes les SCORES_SYNC_INTERVAL secondes
 *  • Cron secret optionnel : Authorization: Bearer $CRON_SECRET
 *  • Garde-fou quota API-Sports (pause auto si < 10 requêtes restantes)
 * Appelée par : Vercel Cron (vercel.json), cron-job.org, et le SyncManager client.
 */
async function handle(req: Request) {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, skipped: "no_supabase" });
  }

  // 1) Throttle global
  const settings = await getSettings();
  const interval = (Number(process.env.SCORES_SYNC_INTERVAL) || 90) * 1000;
  const now = Date.now();
  const hasCronSecret =
    process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

  if (now - settings.sync_state.last_scores_sync < interval) {
    return NextResponse.json({ ok: true, skipped: "throttled" });
  }
  await updateSetting("sync_state", { last_scores_sync: now }).catch(() => {});

  // 2) Garde-fou quota (plan gratuit : 100 req/jour)
  const { requests_remaining, requests_day } = settings.sync_state;
  const today = new Date().toISOString().slice(0, 10);
  if (requests_remaining !== null && requests_day === today && requests_remaining < 10) {
    return NextResponse.json({ ok: true, skipped: "quota_low", remaining: requests_remaining });
  }

  // 3) Nettoyage automatique des matchs passés (1x/heure suffit)
  const cleanupDue = now - settings.sync_state.last_cleanup > 3600_000;
  if (cleanupDue) await cleanupPassedMatches();

  // 4) Pas de clé API → on s'arrête proprement (le site fonctionne en mode manuel)
  if (!process.env.API_SPORTS_KEY) {
    return NextResponse.json({ ok: true, skipped: "no_api_key", cleaned: cleanupDue });
  }

  try {
    const result = await syncLiveScores();

    // Import des nouveaux matchs des 19 équipes (1x/6h) + classements (1x/1h)
    const fixturesDue = now - settings.sync_state.last_fixtures_import > 6 * 3600_000;
    const fixtures = fixturesDue ? await importFixtures() : null;

    const standingsDue = now - settings.sync_state.last_standings_sync > 3600_000;
    const standings = standingsDue ? await syncStandings() : null;

    return NextResponse.json({
      ok: true,
      data: { ...result, fixturesImported: fixtures?.imported ?? 0, standingsUpdated: standings?.updated ?? 0 },
      cleaned: cleanupDue,
      cron: Boolean(hasCronSecret),
    });
  } catch (e) {
    console.error("[api/scores/sync]", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
