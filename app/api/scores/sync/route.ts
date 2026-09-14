import { NextResponse } from "next/server";
import { syncLiveScores, importFixtures, syncStandings, cleanupPassedMatches, syncMatchEvents, lastApiMeta, LIVE_API_STATUSES } from "@/lib/services/football.service";
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

  // 1) THROTTLE ADAPTATIF :
  //    • matchs LIVE en base ou coup d'envoi imminent (±15 min) → 90 s max
  //      (les scores vivent en direct pendant les matchs)
  //    • sinon → intervalle long (min 20 min) pour préserver le quota gratuit
  //    • l'env SCORES_SYNC_INTERVAL reste la base si elle est plus stricte
  const settings = await getSettings();
  const baseInterval = (Number(process.env.SCORES_SYNC_INTERVAL) || 90) * 1000;
  const now = Date.now();
  const hasCronSecret =
    process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

  let hot = false;
  try {
    const [liveCount, upcomingHot, missedKickoffs] = await Promise.all([
      // a) matchs déjà dans le cache live
      admin.from("live_scores").select("id", { count: "exact", head: true }),
      // b) coup d'envoi imminent (dans les 15 prochaines minutes)
      admin
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled")
        .gte("match_date", new Date(now - 30 * 60_000).toISOString())
        .lte("match_date", new Date(now + 15 * 60_000).toISOString()),
      // c) COUPS D'ENVOI MANQUÉS : matchs programmés dont l'heure est passée
      //    (ils sont en train de se jouer mais pas encore dans live_scores)
      admin
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled")
        .lt("match_date", new Date(now).toISOString())
        .gte("match_date", new Date(now - 3 * 3600_000).toISOString()),
    ]);
    hot = (liveCount.count ?? 0) > 0 || (upcomingHot.count ?? 0) > 0 || (missedKickoffs.count ?? 0) > 0;
  } catch {
    /* si le check échoue on reste sur l'intervalle de base */
  }
  const interval = hot ? Math.min(baseInterval, 90_000) : Math.max(baseInterval, 20 * 60_000);

  if (now - settings.sync_state.last_scores_sync < interval) {
    return NextResponse.json({ ok: true, skipped: "throttled", hot });
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

    // Événements (buteurs, cartons) des matchs live — auto-throttlé 20 min
    const events = await syncMatchEvents().catch(() => ({ events: 0, skipped: "error" }));

    // Import des nouveaux matchs des 19 équipes (1x/6h) + classements (1x/1h)
    const fixturesDue = now - settings.sync_state.last_fixtures_import > 6 * 3600_000;
    const fixtures = fixturesDue ? await importFixtures() : null;

    const standingsDue = now - settings.sync_state.last_standings_sync > 3600_000;
    const standings = standingsDue ? await syncStandings() : null;

    // 🔍 DIAGNOSTIC : on journalise le résultat complet de la vraie synchro
    // dans site_settings (lisible par l'admin et le support — observabilité).
    const debug = {
      at: new Date().toISOString(),
      result,
      events,
      apiMeta: lastApiMeta,
      fixturesImported: fixtures?.imported ?? 0,
      standingsUpdated: standings?.updated ?? 0,
    };
    // ⚠️ Erreur fournisseur (compte suspendu, clé refusée...) → visible par l'admin
    const apiError =
      lastApiMeta?.errors && Object.keys(lastApiMeta.errors as Record<string, unknown>).length > 0
        ? JSON.stringify(lastApiMeta.errors)
        : null;
    await updateSetting("sync_state", { last_scores_result: JSON.stringify(debug), api_error: apiError }).catch(() => {});

    return NextResponse.json({
      ok: true,
      data: { ...result, eventsSynced: events.events, fixturesImported: fixtures?.imported ?? 0, standingsUpdated: standings?.updated ?? 0 },
      cleaned: cleanupDue,
      cron: Boolean(hasCronSecret),
    });
  } catch (e) {
    console.error("[api/scores/sync]", e);
    await updateSetting("sync_state", {
      last_scores_result: JSON.stringify({ at: new Date().toISOString(), error: (e as Error).message, apiMeta: lastApiMeta }),
      api_error: (e as Error).message,
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
