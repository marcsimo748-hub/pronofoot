/**
 * Service FOOTBALL — API-FOOTBALL (api-sports.io) + cache Supabase.
 * ⭐ Règle d'or : AUCUN composant n'appelle l'API externe.
 *    Tout passe par ce service (appelé par les routes /api/scores/*).
 *    Le front lit uniquement Supabase (table `live_scores` / `matches`).
 *
 * Quotas : le plan gratuit API-Sports autorise 100 requêtes/jour.
 * Le service lit l'en-tête `x-requests-remaining` et se met en pause
 * automatiquement jusqu'à minuit UTC quand le quota est presque épuisé.
 */

import { LEAGUES, LEAGUE_CODES, FEATURED_TEAMS, TEAM_ALIASES } from "@/lib/constants";
import type { LiveScoreRow, Match, StandingEntry, LeagueCode, MatchEventRow } from "@/lib/types";
import { normalizeTeam, safeQuery } from "@/lib/utils";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  apiGet,
  getApiSportsKey,
  LIVE_API_STATUSES,
  FINISHED_API_STATUSES,
  lastApiMeta,
  fetchFixturesWithFallback,
  apiTeamToOurs,
  ourLeague,
  type NormalizedFixture,
} from "./football.providers";

export { getApiSportsKey, lastApiMeta, LIVE_API_STATUSES };
export { invalidateProviderKeyCaches } from "./football.providers";
import { getSettings, updateSetting } from "./settings.service";

const API_BASE = "https://v3.football.api-sports.io";




// ---------------------------------------------------------------
// SYNCHRO SCORES LIVE (appelée par /api/scores/sync toutes les ~90s)
// ---------------------------------------------------------------
/** Statuts API-Sports considérés comme match terminé (FT, prolong., tirs au but) */
/** Statuts API-Sports = match réellement EN COURS (le reste ne doit jamais s'afficher LIVE) */

export async function syncLiveScores(
  opts: { skipApiFootball?: boolean } = {}
): Promise<{
  synced: number;
  settled: number;
  provider?: string;
  providerErrors?: { provider: string; error: string }[];
  skipped?: string;
}> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { synced: 0, settled: 0, skipped: "no_supabase" };

  // 1) CHAÎNE DE FOURNISSEURS : API-Football → football-data.org → ESPN.
  //    Le premier qui répond gagne ; en cas d'échec (compte suspendu,
  //    quota, panne) on bascule automatiquement sur le suivant.
  const { result, attempts } = await fetchFixturesWithFallback(opts);
  if (!result) {
    return { synced: 0, settled: 0, skipped: "all_providers_failed", providerErrors: attempts };
  }

  // 2) Cache live_scores : uniquement les matchs EN COURS (id stable par
  //    match → aucun doublon quand on change de fournisseur)
  const live = result.fixtures.filter((f) => f.status === "live");
  for (const f of live) {
    await admin.from("live_scores").upsert({
      id: f.id,
      league: f.league,
      match_date: f.date,
      home_team: f.home,
      away_team: f.away,
      home_score: f.homeScore,
      away_score: f.awayScore,
      status: f.liveStatus,
      elapsed: f.elapsed,
      raw: f,
      updated_at: new Date().toISOString(),
    });
  }

  // 3) Les matchs TERMINÉS alimentent la table `matches` → calcul des points
  let settled = 0;
  const finished = result.fixtures.filter((f) => f.status === "ft" && f.homeScore !== null && f.awayScore !== null);
  for (const f of finished) {
    settled += await applyResultNormalized(f);
  }

  // 4) PURGE des lignes périmées : un match fini ou sorti du flux live ne
  //    doit JAMAIS rester affiché comme LIVE dans live_scores.
  const staleBefore = new Date(Date.now() - 4 * 3600_000).toISOString();
  // a) statut terminé / annulé / reporté → sortie du cache live
  await admin.from("live_scores").delete().not("status", "in", `("${LIVE_API_STATUSES.join('","')}")`);
  // b) plus aucune maj depuis 4 h (match sorti du flux live) → périmé
  await admin.from("live_scores").delete().lt("updated_at", staleBefore);

  return {
    synced: live.length,
    settled,
    provider: result.provider,
    providerErrors: attempts.length ? attempts : undefined,
  };
}

/** Enregistre un résultat FT (tous fournisseurs confondus) : match en base par équipes + date ±2j */
async function applyResultNormalized(f: NormalizedFixture): Promise<number> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return 0;

  const from = new Date(new Date(f.date).getTime() - 48 * 3600_000).toISOString();
  const to = new Date(new Date(f.date).getTime() + 48 * 3600_000).toISOString();

  const { data: candidates } = await admin
    .from("matches")
    .select("id, home_team, away_team, home_score, league")
    .gte("match_date", from)
    .lte("match_date", to)
    .or(`home_team.eq.${f.home},away_team.eq.${f.away}`);

  const match = (candidates ?? []).find(
    (m) =>
      normalizeTeam(m.home_team) === normalizeTeam(f.home) &&
      normalizeTeam(m.away_team) === normalizeTeam(f.away)
  );
  if (!match || match.home_score !== null) return 0;

  // Enregistre le résultat + calcule les points de tous les pronostics (RPC SQL)
  const { data } = await admin.rpc("set_match_result", {
    p_match_id: match.id,
    p_home: f.homeScore ?? 0,
    p_away: f.awayScore ?? 0,
  });
  return typeof data === "number" ? data : 0;
}


// ---------------------------------------------------------------
// IMPORT DES FIXTURES des 19 équipes vedettes (nouvelles saisons,
// ajouts automatiques de matchs) — toutes les 6h maximum
// ---------------------------------------------------------------
export async function importFixtures(): Promise<{
  imported: number;
  settled?: number;
  skipped?: string;
  diag?: { team: string; count: number; errors: string | null }[];
}> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { imported: 0, skipped: "no_supabase" };
  if (!(await getApiSportsKey())) return { imported: 0, skipped: "no_api_key" };

  const season = LEAGUES.premier.season;
  let imported = 0;
  let settled = 0;
  const diag: { team: string; count: number; errors: string | null }[] = [];

  for (const team of FEATURED_TEAMS) {
    // Une équipe qui échoue (429, réseau…) n'arrête plus tout l'import
    let fixtures: Awaited<ReturnType<typeof apiGet>>;
    try {
      fixtures = await apiGet("/fixtures", { team: team.apiId, season });
    } catch (e) {
      diag.push({ team: team.name, count: -1, errors: `throw: ${(e as Error).message}` });
      continue;
    }
    const meta = lastApiMeta;
    const respErr =
      meta?.errors && Object.keys(meta.errors as Record<string, unknown>).length > 0
        ? JSON.stringify(meta.errors).slice(0, 160)
        : null;
    diag.push({ team: team.name, count: fixtures?.length ?? -1, errors: respErr });
    if (!fixtures || fixtures.length === 0) continue;

    for (const f of fixtures) {
      const league = ourLeague(f.league.id);
      if (!league) continue; // amicaux, coupes non suivies...

      const isFinished = FINISHED_API_STATUSES.includes(f.fixture.status.short);
      const row = {
        external_id: String(f.fixture.id),
        league,
        season: f.league.season,
        match_date: f.fixture.date,
        home_team: apiTeamToOurs(f.teams.home.name),
        away_team: apiTeamToOurs(f.teams.away.name),
        status: isFinished ? "finished" : "scheduled",
        home_score: isFinished ? f.goals.home : null,
        away_score: isFinished ? f.goals.away : null,
        source: "api",
      };

      // 1) Insertion si le match est inconnu (nouveau fixture)
      const { error } = await admin
        .from("matches")
        .upsert(row, { onConflict: "external_id", ignoreDuplicates: true });
      if (!error) imported++;

      if (isFinished) {
        // 2a) Match terminé DÉJÀ connu mais sans résultat en base → settlement
        //     (le score n'est jamais écrasé : applyResultNormalized vérifie home_score)
        const homeName = apiTeamToOurs(f.teams.home.name);
        const awayName = apiTeamToOurs(f.teams.away.name);
        settled += await applyResultNormalized({
          id: `${homeName}-${awayName}-${f.fixture.date.slice(0, 10)}`,
          sourceId: String(f.fixture.id),
          provider: "api-football",
          league: league,
          date: f.fixture.date,
          home: homeName,
          away: awayName,
          homeScore: f.goals.home,
          awayScore: f.goals.away,
          status: "ft",
          liveStatus: "FT",
          elapsed: null,
        });
      } else {
        // 2b) Match à venir déjà connu → on RAFRAÎCHIT l'horaire
        //     (changement d'horaire, report... les heures restent exactes)
        //     Uniquement si aucun résultat enregistré.
        await admin
          .from("matches")
          .update({ match_date: row.match_date, status: "scheduled" })
          .eq("external_id", row.external_id)
          .is("home_score", null)
          .neq("status", "finished");
      }
    }
  }

  await updateSetting("sync_state", { last_fixtures_import: Date.now() }).catch(() => {});
  return { imported, settled, diag };
}

// ---------------------------------------------------------------
// CLASSEMENTS DES CHAMPIONNATS (cache 1h dans site_settings)
// ---------------------------------------------------------------
export async function syncStandings(): Promise<{ updated: number; skipped?: string }> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { updated: 0, skipped: "no_supabase" };
  if (!(await getApiSportsKey())) return { updated: 0, skipped: "no_api_key" };

  const season = LEAGUES.premier.season;
  const leagues: Partial<Record<LeagueCode, StandingEntry[]>> = {};

  for (const code of LEAGUE_CODES) {
    const key = (await getApiSportsKey())!;
    const url = new URL(`${API_BASE}/standings`);
    url.searchParams.set("league", String(LEAGUES[code].apiId));
    url.searchParams.set("season", String(season));
    const res = await fetch(url, { headers: { "x-apisports-key": key }, cache: "no-store" });
    if (!res.ok) continue;
    const json = (await res.json()) as {
      response?: {
        league: {
          standings?: {
            rank: number;
            team: { name: string };
            all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
            points: number;
            form?: string;
          }[][];
        };
      }[];
    };
    const rows = json.response?.[0]?.league.standings?.[0] ?? [];
    if (rows.length) {
      leagues[code] = rows.slice(0, 20).map((r) => ({
        rank: r.rank,
        team: apiTeamToOurs(r.team.name),
        played: r.all.played,
        win: r.all.win,
        draw: r.all.draw,
        lose: r.all.lose,
        goals_for: r.all.goals.for,
        goals_against: r.all.goals.against,
        points: r.points,
        form: r.form,
      }));
    }
  }

  await updateSetting("standings_cache", {
    updated_at: new Date().toISOString(),
    leagues,
  }).catch(() => {});
  await updateSetting("sync_state", { last_standings_sync: Date.now() }).catch(() => {});
  return { updated: Object.keys(leagues).length };
}

// ---------------------------------------------------------------
// NETTOYAGE : les matchs passés sont retirés automatiquement
// ---------------------------------------------------------------
export async function cleanupPassedMatches(): Promise<void> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return;
  await admin.rpc("cleanup_passed_matches");
  await updateSetting("sync_state", { last_cleanup: Date.now() }).catch(() => {});
}

// ---------------------------------------------------------------
// LECTURES (utilisées par les pages serveur)
// ---------------------------------------------------------------

/** Scores en direct (cache live_scores) */
export async function getLiveScores(): Promise<LiveScoreRow[]> {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("live_scores")
      .select("*")
      .in("status", LIVE_API_STATUSES)
      .gte("updated_at", new Date(Date.now() - 3 * 3600_000).toISOString())
      .order("updated_at", { ascending: false })
      .limit(30);
    return (data ?? []) as LiveScoreRow[];
  }, []);
}

/** Matchs à venir (à pronostiquer) */
export async function getUpcomingMatches(limit = 40, league?: LeagueCode): Promise<Match[]> {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    let q = supabase
      .from("matches")
      .select("*")
      .eq("status", "scheduled")
      .gte("match_date", new Date().toISOString())
      .order("match_date", { ascending: true })
      .limit(limit);
    if (league) q = q.eq("league", league);
    const { data } = await q;
    return (data ?? []) as Match[];
  }, []);
}

/** Derniers résultats */
export async function getRecentResults(limit = 20): Promise<Match[]> {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "finished")
      .order("match_date", { ascending: false })
      .limit(limit);
    return (data ?? []) as Match[];
  }, []);
}


// ---------------------------------------------------------------
// ÉVÉNEMENTS DE MATCH (buteurs, cartons, penalties) — API-Football
// /fixtures/events. QUOTA PROTÉGÉ : max 5 matchs, 1 synchro / 20 min,
// uniquement quand des matchs sont réellement en direct.
// ---------------------------------------------------------------

interface ApiEvent {
  time: { elapsed: number | null };
  team: { name: string };
  player: { name: string };
  type: string;
  detail: string | null;
}

/** Synchro des événements des matchs live (appelée depuis /api/scores/sync) */
export async function syncMatchEvents(): Promise<{ events: number; skipped?: string }> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { events: 0, skipped: "no_supabase" };
  if (!(await getApiSportsKey())) return { events: 0, skipped: "no_api_key" };

  // Throttle : une synchro des événements max toutes les 20 minutes
  const settings = await getSettings();
  const now = Date.now();
  if (now - (settings.sync_state.last_events_sync ?? 0) < 20 * 60_000) {
    return { events: 0, skipped: "throttled" };
  }
  await updateSetting("sync_state", { last_events_sync: now }).catch(() => {});

  // Garde-fou quota : il faut rester au-dessus de 15 requêtes
  const { requests_remaining, requests_day } = settings.sync_state;
  const today = new Date().toISOString().slice(0, 10);
  if (requests_remaining !== null && requests_day === today && requests_remaining < 15) {
    return { events: 0, skipped: "quota_low" };
  }

  // Matchs réellement en direct — les événements (buteurs/cartons) ne sont
  // disponibles que chez API-Football : on n'interroge que les matchs
  // synchronisés par ce fournisseur (id source dans raw.sourceId).
  const { data: liveRows } = await admin
    .from("live_scores")
    .select("id, raw")
    .in("status", LIVE_API_STATUSES)
    .limit(10);
  const apiRows = (liveRows ?? []).filter(
    (r) => (r.raw as { provider?: string } | null)?.provider === "api-football"
  );
  if (apiRows.length === 0) return { events: 0, skipped: "no_live" };

  let count = 0;
  for (const row of apiRows.slice(0, 5)) {
    const sourceId = (row.raw as { sourceId?: string } | null)?.sourceId ?? row.id;
    const events = await apiGetEvents("/fixtures/events", { fixture: sourceId });
    for (const ev of events) {
      const isGoal = ev.type === "Goal";
      const isCard = ev.type === "Card";
      const isPen = ev.type === "Var" || /penalty/i.test(ev.detail ?? "");
      if (!isGoal && !isCard && !isPen) continue; // on garde buts + cartons + VAR/penalty
      const { error } = await admin.from("prono_match_events").upsert(
        {
          fixture_id: row.id,
          team: apiTeamToOurs(ev.team.name),
          player: ev.player.name || "?",
          type: isGoal ? "Goal" : isCard ? "Card" : "Penalty",
          detail: ev.detail,
          minute: ev.time.elapsed,
        },
        { onConflict: "fixture_id,team,player,type,detail,minute" }
      );
      if (!error) count++;
    }
  }
  return { events: count };
}

/** Appel GET API-Football générique (events) */
async function apiGetEvents(path: string, params: Record<string, string | number>): Promise<ApiEvent[]> {
  const key = await getApiSportsKey();
  if (!key) return [];
  const url = new URL("https://v3.football.api-sports.io" + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  try {
    const res = await fetch(url, { headers: { "x-apisports-key": key }, cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { response?: ApiEvent[] };
    return json.response ?? [];
  } catch {
    return [];
  }
}

/** Événements des matchs live actuels (lecture publique, pour /scores) */
export async function getLiveEvents(): Promise<MatchEventRow[]> {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    const { data: live } = await supabase
      .from("live_scores")
      .select("id")
      .in("status", LIVE_API_STATUSES)
      .limit(10);
    if (!live || live.length === 0) return [];
    const ids = live.map((r: { id: string }) => r.id);
    const { data } = await supabase
      .from("prono_match_events")
      .select("fixture_id, team, player, type, detail, minute")
      .in("fixture_id", ids)
      .order("minute", { ascending: true });
    return (data ?? []) as MatchEventRow[];
  }, []);
}
