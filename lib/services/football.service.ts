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
import { getSettings, updateSetting } from "./settings.service";

const API_BASE = "https://v3.football.api-sports.io";

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { id: number; name: string; season: number };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
}

/** Diagnostic du dernier appel API-Sports (lisible juste après par la route sync) */
export let lastApiMeta: {
  path: string;
  ok: boolean;
  status: number;
  quotaHeaderRemaining: string | null;
  errors: unknown;
  count: number;
} | null = null;

/** Appel GET vers API-FOOTBALL avec gestion du quota */
async function apiGet(path: string, params: Record<string, string | number>): Promise<ApiFixture[] | null> {
  const key = process.env.API_SPORTS_KEY;
  if (!key) return null;

  const url = new URL(API_BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    headers: { "x-apisports-key": key },
    cache: "no-store",
  });
  const remaining = res.headers.get("x-requests-remaining") ?? res.headers.get("x-ratelimit-requests-remaining");
  if (!res.ok) {
    lastApiMeta = { path, ok: false, status: res.status, quotaHeaderRemaining: remaining, errors: null, count: 0 };
    throw new Error(`API-Sports ${res.status}`);
  }

  // Suivi du quota → pause automatique si < 10 requêtes restantes
  if (remaining !== null) {
    const today = new Date().toISOString().slice(0, 10);
    const state = (await getSettings()).sync_state;
    if (state.requests_day !== today || state.requests_remaining !== Number(remaining)) {
      await updateSetting("sync_state", { requests_remaining: Number(remaining), requests_day: today }).catch(() => {});
    }
  }

  const json = (await res.json()) as { response?: ApiFixture[]; errors?: unknown };
  const hasErrors = json.errors && Object.keys(json.errors).length > 0;
  if (hasErrors) console.warn("[football.service] erreurs API:", json.errors);
  lastApiMeta = {
    path,
    ok: true,
    status: res.status,
    quotaHeaderRemaining: remaining,
    errors: hasErrors ? json.errors : null,
    count: json.response?.length ?? 0,
  };
  return json.response ?? [];
}

/** Traduit le nom d'une équipe API vers notre nom FR en base */
function apiTeamToOurs(name: string): string {
  const norm = normalizeTeam(name);
  return TEAM_ALIASES[norm] ?? name;
}

/** Nos 6 championnats sont-ils concernés par ce fixture ? */
function ourLeague(apiLeagueId: number): LeagueCode | null {
  for (const code of LEAGUE_CODES) {
    if (LEAGUES[code].apiId === apiLeagueId) return code;
  }
  return null;
}

// ---------------------------------------------------------------
// SYNCHRO SCORES LIVE (appelée par /api/scores/sync toutes les ~90s)
// ---------------------------------------------------------------
/** Statuts API-Sports considérés comme match terminé (FT, prolong., tirs au but) */
const FINISHED_API_STATUSES = ["FT", "AET", "PEN"];
/** Statuts API-Sports = match réellement EN COURS (le reste ne doit jamais s'afficher LIVE) */
const LIVE_API_STATUSES = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT", "SUSP"];

export async function syncLiveScores(): Promise<{ synced: number; settled: number; skipped?: string }> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { synced: 0, settled: 0, skipped: "no_supabase" };

  const fixtures = await apiGet("/fixtures", { live: "all" });
  if (fixtures === null) return { synced: 0, settled: 0, skipped: "no_api_key" };

  // 1) Cache live_scores : uniquement nos championnats
  const ours = fixtures.filter((f) => ourLeague(f.league.id) !== null);
  for (const f of ours) {
    const row = {
      id: String(f.fixture.id),
      league: ourLeague(f.league.id),
      match_date: f.fixture.date,
      home_team: apiTeamToOurs(f.teams.home.name),
      away_team: apiTeamToOurs(f.teams.away.name),
      home_score: f.goals.home,
      away_score: f.goals.away,
      status: f.fixture.status.short,
      elapsed: f.fixture.status.elapsed,
      raw: f,
      updated_at: new Date().toISOString(),
    };
    await admin.from("live_scores").upsert(row);
  }

  // 2) Les matchs TERMINÉS alimentent la table `matches` → calcul des points
  let settled = 0;
  const finished = ours.filter((f) => FINISHED_API_STATUSES.includes(f.fixture.status.short));
  for (const f of finished) {
    settled += await applyApiResult(f);
  }

  // 3) PURGE des lignes périmées : un match fini ou sorti du flux live ne
  //    doit JAMAIS rester affiché comme LIVE dans live_scores.
  const staleBefore = new Date(Date.now() - 4 * 3600_000).toISOString();
  // a) statut terminé / annulé / reporté → sortie du cache live
  await admin.from("live_scores").delete().not("status", "in", `("${LIVE_API_STATUSES.join('","')}")`);
  // b) plus aucune maj depuis 4 h (match sorti du flux live) → périmé
  await admin.from("live_scores").delete().lt("updated_at", staleBefore);

  return { synced: ours.length, settled };
}

/** Fait correspondre un fixture API à un match en base (équipes + date ±2j) puis enregistre le résultat */
async function applyApiResult(f: ApiFixture): Promise<number> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return 0;

  const home = apiTeamToOurs(f.teams.home.name);
  const away = apiTeamToOurs(f.teams.away.name);
  const date = new Date(f.fixture.date);
  const from = new Date(date.getTime() - 48 * 3600_000).toISOString();
  const to = new Date(date.getTime() + 48 * 3600_000).toISOString();

  const { data: candidates } = await admin
    .from("matches")
    .select("id, home_team, away_team, home_score, league")
    .gte("match_date", from)
    .lte("match_date", to)
    .or(`home_team.eq.${home},away_team.eq.${away}`);

  const match = (candidates ?? []).find(
    (m) =>
      normalizeTeam(m.home_team) === normalizeTeam(home) &&
      normalizeTeam(m.away_team) === normalizeTeam(away)
  );
  if (!match || match.home_score !== null) return 0;

  // Enregistre le résultat + calcule les points de tous les pronostics (RPC SQL)
  const { data } = await admin.rpc("set_match_result", {
    p_match_id: match.id,
    p_home: f.goals.home ?? 0,
    p_away: f.goals.away ?? 0,
  });
  return typeof data === "number" ? data : 0;
}

// ---------------------------------------------------------------
// IMPORT DES FIXTURES des 19 équipes vedettes (nouvelles saisons,
// ajouts automatiques de matchs) — toutes les 6h maximum
// ---------------------------------------------------------------
export async function importFixtures(): Promise<{ imported: number; skipped?: string }> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { imported: 0, skipped: "no_supabase" };
  if (!process.env.API_SPORTS_KEY) return { imported: 0, skipped: "no_api_key" };

  const season = LEAGUES.premier.season;
  let imported = 0;

  for (const team of FEATURED_TEAMS) {
    const fixtures = await apiGet("/fixtures", { team: team.apiId, season });
    if (!fixtures) continue;

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
        //     (le score n'est jamais écrasé : applyApiResult vérifie home_score)
        await applyApiResult(f);
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
  return { imported };
}

// ---------------------------------------------------------------
// CLASSEMENTS DES CHAMPIONNATS (cache 1h dans site_settings)
// ---------------------------------------------------------------
export async function syncStandings(): Promise<{ updated: number; skipped?: string }> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { updated: 0, skipped: "no_supabase" };
  if (!process.env.API_SPORTS_KEY) return { updated: 0, skipped: "no_api_key" };

  const season = LEAGUES.premier.season;
  const leagues: Partial<Record<LeagueCode, StandingEntry[]>> = {};

  for (const code of LEAGUE_CODES) {
    const key = process.env.API_SPORTS_KEY!;
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
  if (!process.env.API_SPORTS_KEY) return { events: 0, skipped: "no_api_key" };

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

  // Matchs réellement en direct (max 5 fixtures = 5 requêtes)
  const { data: liveRows } = await admin
    .from("live_scores")
    .select("id")
    .in("status", LIVE_API_STATUSES)
    .limit(5);
  if (!liveRows || liveRows.length === 0) return { events: 0, skipped: "no_live" };

  let count = 0;
  for (const row of liveRows) {
    const events = await apiGetEvents("/fixtures/events", { fixture: row.id });
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
  const key = process.env.API_SPORTS_KEY;
  if (!key) return [];
  const url = new URL(API_BASE + path);
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
