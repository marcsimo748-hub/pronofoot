/**
 * FOURNISSEURS DE DONNÉES FOOTBALL — chaîne de secours automatique.
 *
 *   1. API-Football (api-sports.io)  → live + événements, 100 req/j (clé)
 *   2. football-data.org             → nos 6 compétitions, 10 req/min, gratuit à vie (clé)
 *   3. ESPN (API site non officielle) → scores live, SANS clé, toujours dispo
 *
 * Si un fournisseur échoue (compte suspendu, quota, panne), la synchro
 * bascule automatiquement sur le suivant. Les trois produisent le même
 * format normalisé (NormalizedFixture) avec un id STABLE par match
 * (équipes + date) : aucun doublon quand on change de fournisseur.
 */

import { LEAGUES, TEAM_ALIASES } from "@/lib/constants";
import { normalizeTeam } from "@/lib/utils";
import type { LeagueCode } from "@/lib/types";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSettings, updateSetting } from "./settings.service";

const API_BASE = "https://v3.football.api-sports.io";

/** Fixture normalisée, identique quel que soit le fournisseur */
export interface NormalizedFixture {
  /** id STABLE : équipes + jour → aucun doublon entre fournisseurs */
  id: string;
  /** id chez le fournisseur (pour les événements API-Football) */
  sourceId: string;
  provider: string;
  league: LeagueCode;
  date: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "live" | "ft";
  /** code court pour live_scores : 1H/2H/HT/LIVE… */
  liveStatus: string;
  elapsed: number | null;
}

export interface ProviderResult {
  provider: string;
  fixtures: NormalizedFixture[];
  error: string | null;
}

// ---------------------------------------------------------------
// CLÉS (Admin > prono_secrets PRIME sur la variable Vercel)
// ---------------------------------------------------------------

let apiKeyCache: { key: string | null; at: number } | null = null;
let fdKeyCache: { key: string | null; at: number } | null = null;

export function invalidateProviderKeyCaches(): void {
  apiKeyCache = null;
  fdKeyCache = null;
}

async function readSecret(secretKey: string): Promise<string | null> {
  try {
    const admin = tryGetSupabaseAdminClient();
    if (!admin) return null;
    const { data } = await admin.from("prono_secrets").select("value").eq("key", secretKey).maybeSingle();
    return data?.value ? String(data.value) : null;
  } catch {
    return null;
  }
}

/** Clé API-Football effective : Admin (prono_secrets) > variable Vercel */
export async function getApiSportsKey(): Promise<string | null> {
  if (apiKeyCache && Date.now() - apiKeyCache.at < 30_000) return apiKeyCache.key;
  let key: string | null = process.env.API_SPORTS_KEY ?? null;
  const dbKey = await readSecret("api_sports_key");
  if (dbKey) key = dbKey;
  apiKeyCache = { key, at: Date.now() };
  return key;
}

/** Clé football-data.org effective : Admin > variable Vercel */
export async function getFootballDataKey(): Promise<string | null> {
  if (fdKeyCache && Date.now() - fdKeyCache.at < 30_000) return fdKeyCache.key;
  let key: string | null = process.env.FOOTBALL_DATA_KEY ?? null;
  const dbKey = await readSecret("football_data_key");
  if (dbKey) key = dbKey;
  fdKeyCache = { key, at: Date.now() };
  return key;
}

// ---------------------------------------------------------------
// DIAGNOSTIC du dernier appel (lisible par la route sync)
// ---------------------------------------------------------------

export let lastApiMeta: {
  provider: string;
  path: string;
  ok: boolean;
  status: number;
  quotaHeaderRemaining: string | null;
  errors: unknown;
  count: number;
} | null = null;

// ---------------------------------------------------------------
// FOURNISSEUR 1 : API-FOOTBALL (api-sports.io)
// ---------------------------------------------------------------

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { id: number; name: string; season: number };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
}

/** Appel GET vers API-FOOTBALL avec gestion du quota */
export async function apiGet(path: string, params: Record<string, string | number>): Promise<ApiFixture[] | null> {
  const key = await getApiSportsKey();
  if (!key) return null;

  const url = new URL(API_BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    headers: { "x-apisports-key": key },
    cache: "no-store",
  });
  const remaining = res.headers.get("x-requests-remaining") ?? res.headers.get("x-ratelimit-requests-remaining");
  if (!res.ok) {
    lastApiMeta = { provider: "api-football", path, ok: false, status: res.status, quotaHeaderRemaining: remaining, errors: null, count: 0 };
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
  if (hasErrors) console.warn("[providers] erreurs API-Football:", json.errors);
  lastApiMeta = {
    provider: "api-football",
    path,
    ok: true,
    status: res.status,
    quotaHeaderRemaining: remaining,
    errors: hasErrors ? json.errors : null,
    count: json.response?.length ?? 0,
  };
  return json.response ?? [];
}

/** Statuts API-Sports = match réellement EN COURS */
export const LIVE_API_STATUSES = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT", "SUSP"];
/** Statuts API-Sports = match terminé */
export const FINISHED_API_STATUSES = ["FT", "AET", "PEN"];

/** Recherche d'alias tolérante : les tirets et slashs deviennent des espaces
 *  (« Saint-Germain » doit trouver l'alias « saint germain »). */
function aliasLookup(name: string): string {
  return TEAM_ALIASES[normalizeTeam(name.replace(/[-/&.]/g, " "))] ?? name;
}

function toOurName(name: string): string {
  return aliasLookup(name);
}

/**
 * Équipes nationales africaines (FR + EN + variantes ESPN).
 * Utilisé pour filtrer les amicaux internationaux (fifa.friendly) et ne garder
 * que ceux impliquant au moins une équipe africaine.
 */
const AFRICAN_TEAM_KEYWORDS: string[] = [
  // Grands pays (FR + EN + acronymes CAF)
  "Cameroon", "Cameroun", "CMR",
  "Senegal", "Sénégal", "SEN",
  "Morocco", "Maroc", "MAR",
  "Nigeria", "NGA",
  "Ivory Coast", "Côte d'Ivoire", "Cote d'Ivoire", "CIV",
  "Egypt", "Egypte", "Égypte", "EGY",
  "Ghana", "GHA",
  "Algeria", "Algérie", "Algerie", "ALG",
  "Tunisia", "Tunisie", "TUN",
  "Mali", "MLI",
  "Burkina Faso", "BFA",
  "Guinea", "Guinée", "GUI",
  "DR Congo", "RD Congo", "Congo DR", "COD",
  "Gabon", "GAB",
  "Cape Verde", "Cap-Vert", "Cap Vert", "CPV",
  "Cameroon U17", "Cameroun U17", "Cameroon U20", "Cameroun U20",
  "Senegal U17", "Sénégal U17", "Senegal U20", "Sénégal U20",
  // Autres pays CAF (extensibles)
  "Tanzania", "Tanzanie", "TAN",
  "Kenya", "KEN",
  "Uganda", "Ouganda", "UGA",
  "Zambia", "Zambie", "ZAM",
  "Zimbabwe", "ZIM",
  "Togo", "TOG",
  "Benin", "Bénin", "BEN",
  "Madagascar", "MAD",
  "Angola", "ANG",
  "Mozambique", "MOZ",
  "Ethiopia", "Ethiopie", "ETH",
  "Comoros", "Comores", "COM",
  "Mauritania", "Mauritanie", "MTN",
  "Libya", "Libye", "LBY",
  "Sudan", "Soudan", "SUD",
  "South Sudan", "Soudan du Sud", "SSD",
  "Central African Republic", "République centrafricaine", "CTA",
  "Equatorial Guinea", "Guinée Équatoriale", "GEQ",
  "Congo", "COG", // ⚠️ peut matcher "DR Congo" aussi, à compléter avec regex stricte
  "Gambia", "Gambie", "GAM",
  "Botswana", "BOT",
  "Namibia", "Namibie", "NAM",
  "Sierra Leone", "Sierra Leone", "SLE",
  "Liberia", "Libéria", "LBR",
  "Eritrea", "Érythrée", "ERI",
  "Somalia", "Somalie", "SOM",
  "Lesotho", "LES",
  "Eswatini", "Swaziland", "SWZ",
  "Rwanda", "RWA",
  "Burundi", "BDI",
  "Chad", "Tchad", "CHA",
  "Niger", "NIG",
];

/** Détecte si une équipe est africaine (par nom). */
function isAfricanTeam(name: string): boolean {
  return AFRICAN_TEAM_KEYWORDS.some((k) => name.includes(k));
}

/** Détecte si un match (home, away) implique au moins une équipe africaine. */
export function isAfricanMatch(home: string, away: string): boolean {
  return isAfricanTeam(home) || isAfricanTeam(away);
}

function stableId(date: string, home: string, away: string): string {
  const day = new Date(date).toISOString().slice(0, 10).replace(/-/g, "");
  const h = normalizeTeam(home).replace(/ /g, "-");
  const a = normalizeTeam(away).replace(/ /g, "-");
  return `${h}-${a}-${day}`;
}

/** Nos 6 championnats sont-ils concernés par ce fixture ? */
function ourLeague(apiLeagueId: number): LeagueCode | null {
  for (const code of Object.keys(LEAGUES) as LeagueCode[]) {
    if (LEAGUES[code].apiId === apiLeagueId) return code;
  }
  return null;
}

async function providerApiFootball(): Promise<ProviderResult> {
  const key = await getApiSportsKey();
  if (!key) return { provider: "api-football", fixtures: [], error: "no_key" };
  try {
    const fixtures = await apiGet("/fixtures", { live: "all" });
    if (fixtures === null) return { provider: "api-football", fixtures: [], error: "no_key" };
    // ⚠️ PIÈGE : un compte suspendu/clé refusée renvoie 200 avec errors + count 0.
    // Un « 0 match » n'est sain QUE s'il n'y a aucune erreur dans la réponse.
    const meta = lastApiMeta;
    const respErrors = meta?.errors as Record<string, unknown> | null | undefined;
    if (respErrors && Object.keys(respErrors).length > 0) {
      return {
        provider: "api-football",
        fixtures: [],
        error: `refusé: ${JSON.stringify(respErrors).slice(0, 120)}`,
      };
    }
    const ours: NormalizedFixture[] = [];
    for (const f of fixtures) {
      const league = ourLeague(f.league.id);
      if (!league) continue;
      const short = f.fixture.status.short;
      const isLive = LIVE_API_STATUSES.includes(short);
      const isFt = FINISHED_API_STATUSES.includes(short);
      if (!isLive && !isFt) continue;
      const home = toOurName(f.teams.home.name);
      const away = toOurName(f.teams.away.name);
      ours.push({
        id: stableId(f.fixture.date, home, away),
        sourceId: String(f.fixture.id),
        provider: "api-football",
        league,
        date: f.fixture.date,
        home,
        away,
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        status: isLive ? "live" : "ft",
        liveStatus: short,
        elapsed: f.fixture.status.elapsed,
      });
    }
    return { provider: "api-football", fixtures: ours, error: null };
  } catch (e) {
    return { provider: "api-football", fixtures: [], error: (e as Error).message };
  }
}

// ---------------------------------------------------------------
// FOURNISSEUR 2 : FOOTBALL-DATA.ORG (gratuit à vie, 10 req/min)
// ---------------------------------------------------------------

export const FD_COMPETITIONS: Record<string, LeagueCode> = {
  PL: "premier",
  CL: "champions",
  PD: "laliga",
  SA: "seriea",
  FL1: "ligue1",
  BL1: "bundesliga",
};

async function providerFootballDataOrg(): Promise<ProviderResult> {
  const key = await getFootballDataKey();
  if (!key) return { provider: "football-data.org", fixtures: [], error: "no_key" };
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86_400_000);
    const params = new URLSearchParams({
      dateFrom: yesterday.toISOString().slice(0, 10),
      dateTo: now.toISOString().slice(0, 10),
      competitions: Object.keys(FD_COMPETITIONS).join(","),
    });
    const res = await fetch(`https://api.football-data.org/v4/matches?${params}`, {
      headers: { "X-Auth-Token": key },
      cache: "no-store",
    });
    if (!res.ok) {
      lastApiMeta = { provider: "football-data.org", path: "/v4/matches", ok: false, status: res.status, quotaHeaderRemaining: res.headers.get("x-request-counter") ?? null, errors: null, count: 0 };
      return { provider: "football-data.org", fixtures: [], error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as {
      matches?: {
        id: number;
        utcDate: string;
        status: string;
        competition: { code: string };
        homeTeam: { name: string } | null;
        awayTeam: { name: string } | null;
        score: { fullTime: { home: number | null; away: number | null } };
      }[];
    };
    const fixtures: NormalizedFixture[] = [];
    for (const m of json.matches ?? []) {
      const league = FD_COMPETITIONS[m.competition?.code];
      if (!league || !m.homeTeam?.name || !m.awayTeam?.name) continue;
      const isLive = m.status === "IN_PLAY" || m.status === "PAUSED";
      const isFt = m.status === "FINISHED";
      if (!isLive && !isFt) continue;
      const home = toOurName(m.homeTeam.name);
      const away = toOurName(m.awayTeam.name);
      fixtures.push({
        id: stableId(m.utcDate, home, away),
        sourceId: String(m.id),
        provider: "football-data.org",
        league,
        date: m.utcDate,
        home,
        away,
        homeScore: m.score?.fullTime?.home ?? null,
        awayScore: m.score?.fullTime?.away ?? null,
        status: isLive ? "live" : "ft",
        liveStatus: m.status === "PAUSED" ? "HT" : "LIVE",
        elapsed: null,
      });
    }
    lastApiMeta = { provider: "football-data.org", path: "/v4/matches", ok: true, status: res.status, quotaHeaderRemaining: null, errors: null, count: json.matches?.length ?? 0 };
    return { provider: "football-data.org", fixtures, error: null };
  } catch (e) {
    return { provider: "football-data.org", fixtures: [], error: (e as Error).message };
  }
}

// ---------------------------------------------------------------
// FOURNISSEUR 3 : ESPN (sans clé — API site non officielle)
// ---------------------------------------------------------------

const ESPN_LEAGUES: Record<string, LeagueCode> = {
  "eng.1": "premier",
  "uefa.champions": "champions",
  "esp.1": "laliga",
  "ita.1": "seriea",
  "fra.1": "ligue1",
  "ger.1": "bundesliga",
  // Compétitions africaines + internationales (sélections nationales)
  // Source: github.com/pseudo-r/Public-ESPN-API/blob/main/docs/sports/soccer.md
  "caf.nations": "can",                  // CAN (Coupe d'Afrique des Nations)
  "caf.nations_qual": "qwc_afrique",     // Qualifications CAN
  "fifa.worldq.caf": "qwc_afrique",      // Qualifications CDM (zone Afrique)
  // 'fifa.friendly' : tous les amicaux internationaux, on filtre côté code
  // pour ne garder que ceux impliquant une équipe africaine.
};

/**
 * Slug ESPN utilisé pour les amicaux internationaux.
 * On importe TOUS les amicaux, puis on filtre côté code (isAfricanMatch)
 * pour ne garder que ceux impliquant au moins une équipe africaine.
 */
export const ESPN_FRIENDLY_SLUG = "fifa.friendly";

/** Récupère les matchs (live + finis) d'UNE date via ESPN — sans clé. */
export async function espnFixturesForDate(
  dateStr: string,
  onlyLeagues?: LeagueCode[]
): Promise<{ fixtures: NormalizedFixture[]; failed: number }> {
  const fixtures: NormalizedFixture[] = [];
  let failed = 0;
  const espnDate = dateStr.replace(/-/g, "");
  for (const [slug, league] of Object.entries(ESPN_LEAGUES)) {
    if (onlyLeagues && !onlyLeagues.includes(league)) continue;
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${espnDate}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        failed++;
        continue;
      }
      const json = (await res.json()) as {
        events?: {
          id: string;
          date: string;
          status?: { type?: { state?: string; shortDetail?: string } };
          competitions?: {
            competitors?: { homeAway: string; team?: { displayName?: string }; score?: string }[];
          }[];
        }[];
      };
      for (const ev of json.events ?? []) {
        const comp = ev.competitions?.[0];
        const homeC = comp?.competitors?.find((c) => c.homeAway === "home");
        const awayC = comp?.competitors?.find((c) => c.homeAway === "away");
        const homeName = homeC?.team?.displayName;
        const awayName = awayC?.team?.displayName;
        if (!homeName || !awayName) continue;
        const state = ev.status?.type?.state;
        if (state !== "in" && state !== "post") continue;
        const home = toOurName(homeName);
        const away = toOurName(awayName);
        const detail = ev.status?.type?.shortDetail ?? "";
        fixtures.push({
          id: stableId(ev.date, home, away),
          sourceId: ev.id,
          provider: "espn",
          league,
          date: ev.date,
          home,
          away,
          homeScore: homeC.score !== undefined ? Number(homeC.score) : null,
          awayScore: awayC.score !== undefined ? Number(awayC.score) : null,
          status: state === "in" ? "live" : "ft",
          liveStatus: state === "in" ? (/halftime|pause/i.test(detail) ? "HT" : "LIVE") : "FT",
          elapsed: null,
        });
      }
    } catch {
      failed++;
    }
  }
  // Branche amicaux : on importe TOUS les amicaux du jour, puis on filtre
  // côté code pour ne garder que ceux impliquant une équipe africaine.
  if (!onlyLeagues || onlyLeagues.includes("afriendly")) {
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${ESPN_FRIENDLY_SLUG}/scoreboard?dates=${espnDate}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        failed++;
      } else {
        const json = (await res.json()) as {
          events?: {
            id: string;
            date: string;
            status?: { type?: { state?: string; shortDetail?: string } };
            competitions?: {
              competitors?: { homeAway: string; team?: { displayName?: string }; score?: string }[];
            }[];
          }[];
        };
        for (const ev of json.events ?? []) {
          const comp = ev.competitions?.[0];
          const homeC = comp?.competitors?.find((c) => c.homeAway === "home");
          const awayC = comp?.competitors?.find((c) => c.homeAway === "away");
          const homeName = homeC?.team?.displayName;
          const awayName = awayC?.team?.displayName;
          if (!homeName || !awayName) continue;
          const state = ev.status?.type?.state;
          if (state !== "in" && state !== "post") continue;
          const home = toOurName(homeName);
          const away = toOurName(awayName);
          if (!isAfricanMatch(home, away)) continue;
          const detail = ev.status?.type?.shortDetail ?? "";
          fixtures.push({
            id: stableId(ev.date, home, away),
            sourceId: ev.id,
            provider: "espn",
            league: "afriendly",
            date: ev.date,
            home,
            away,
            homeScore: homeC.score !== undefined ? Number(homeC.score) : null,
            awayScore: awayC.score !== undefined ? Number(awayC.score) : null,
            status: state === "in" ? "live" : "ft",
            liveStatus: state === "in" ? (/halftime|pause/i.test(detail) ? "HT" : "LIVE") : "FT",
            elapsed: null,
          });
        }
      }
    } catch {
      failed++;
    }
  }
  return { fixtures, failed };
}

/**
 * Calendrier ESPN sur une fenêtre de dates (J-2 → J+7 en pratique) — TOUS les
 * états (à venir, en cours, fini), pour l'import des fixtures. Sans clé, sans
 * quota : c'est la source principale du rafraîchissement des matchs.
 * Un appel par ligue et par date (l'API scoreboard n'accepte pas les plages).
 */
export async function espnFixturesRange(
  dates: string[]
): Promise<{ fixtures: (NormalizedFixture & { espnState: string })[]; failed: number }> {
  const fixtures: (NormalizedFixture & { espnState: string })[] = [];
  let failed = 0;
  const seen = new Set<string>();
  for (const dateStr of dates) {
    const espnDate = dateStr.replace(/-/g, "");
    for (const [slug, league] of Object.entries(ESPN_LEAGUES)) {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${espnDate}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          failed++;
          continue;
        }
        const json = (await res.json()) as {
          events?: {
            id: string;
            date: string;
            status?: { type?: { state?: string; shortDetail?: string } };
            competitions?: {
              competitors?: { homeAway: string; team?: { displayName?: string }; score?: string }[];
            }[];
          }[];
        };
        for (const ev of json.events ?? []) {
          const comp = ev.competitions?.[0];
          const homeC = comp?.competitors?.find((c) => c.homeAway === "home");
          const awayC = comp?.competitors?.find((c) => c.homeAway === "away");
          const homeName = homeC?.team?.displayName;
          const awayName = awayC?.team?.displayName;
          if (!homeName || !awayName) continue;
          const state = ev.status?.type?.state; // pre | in | post
          if (state !== "pre" && state !== "in" && state !== "post") continue;
          const home = toOurName(homeName);
          const away = toOurName(awayName);
          const key = `${home}|${away}|${ev.date.slice(0, 10)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const detail = ev.status?.type?.shortDetail ?? "";
          fixtures.push({
            id: stableId(ev.date, home, away),
            sourceId: ev.id,
            provider: "espn",
            league,
            date: ev.date,
            home,
            away,
            homeScore: homeC?.score !== undefined ? Number(homeC.score) : null,
            awayScore: awayC?.score !== undefined ? Number(awayC.score) : null,
            status: state === "post" ? "ft" : "live",
            liveStatus: state === "in" ? (/halftime|pause/i.test(detail) ? "HT" : "LIVE") : state === "post" ? "FT" : "PRE",
            elapsed: null,
            espnState: state,
          });
        }
      } catch {
        failed++;
      }
    }
    // Branche amicaux internationaux : on importe TOUS les amicaux du jour,
    // puis on filtre côté code pour ne garder que ceux impliquant une équipe
    // africaine (Cameroun, Sénégal, Maroc, etc.).
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${ESPN_FRIENDLY_SLUG}/scoreboard?dates=${espnDate}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        failed++;
      } else {
        const json = (await res.json()) as {
          events?: {
            id: string;
            date: string;
            status?: { type?: { state?: string; shortDetail?: string } };
            competitions?: {
              competitors?: { homeAway: string; team?: { displayName?: string }; score?: string }[];
            }[];
          }[];
        };
        for (const ev of json.events ?? []) {
          const comp = ev.competitions?.[0];
          const homeC = comp?.competitors?.find((c) => c.homeAway === "home");
          const awayC = comp?.competitors?.find((c) => c.homeAway === "away");
          const homeName = homeC?.team?.displayName;
          const awayName = awayC?.team?.displayName;
          if (!homeName || !awayName) continue;
          const state = ev.status?.type?.state;
          if (state !== "pre" && state !== "in" && state !== "post") continue;
          const home = toOurName(homeName);
          const away = toOurName(awayName);
          if (!isAfricanMatch(home, away)) continue;
          const key = `${home}|${away}|${ev.date.slice(0, 10)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const detail = ev.status?.type?.shortDetail ?? "";
          fixtures.push({
            id: stableId(ev.date, home, away),
            sourceId: ev.id,
            provider: "espn",
            league: "afriendly",
            date: ev.date,
            home,
            away,
            homeScore: homeC?.score !== undefined ? Number(homeC.score) : null,
            awayScore: awayC?.score !== undefined ? Number(awayC.score) : null,
            status: state === "post" ? "ft" : "live",
            liveStatus: state === "in" ? (/halftime|pause/i.test(detail) ? "HT" : "LIVE") : state === "post" ? "FT" : "PRE",
            elapsed: null,
            espnState: state,
          });
        }
      }
    } catch {
      failed++;
    }
  }
  return { fixtures, failed };
}

async function providerEspn(): Promise<ProviderResult> {
  try {
    const now = new Date();
    const days = [now.toISOString().slice(0, 10), new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10)];
    const fixtures: NormalizedFixture[] = [];
    let failed = 0;
    for (const d of days) {
      const r = await espnFixturesForDate(d);
      fixtures.push(...r.fixtures);
      failed += r.failed;
    }
    if (fixtures.length === 0 && failed > 0) {
      return { provider: "espn", fixtures: [], error: `HTTP échoué (${failed} appels)` };
    }
    lastApiMeta = { provider: "espn", path: "scoreboard", ok: true, status: 200, quotaHeaderRemaining: null, errors: null, count: fixtures.length };
    return { provider: "espn", fixtures, error: null };
  } catch (e) {
    return { provider: "espn", fixtures: [], error: (e as Error).message };
  }
}

// ---------------------------------------------------------------
// FOURNISSEUR 4 : TheSportsDB (clé publique "3" — gratuit, sans inscription)
// Plan gratuit limité (1 dernier + 1 prochain par ligue) mais FIABLE pour
// confirmer des scores finaux → idéal en renfort de secours.
// ---------------------------------------------------------------

const TSD_LEAGUES: Record<string, LeagueCode> = {
  "4328": "premier",
  "4335": "laliga",
  "4332": "seriea",
  "4331": "bundesliga",
  "4334": "ligue1",
  "4480": "champions",
};

async function providerSportsDB(): Promise<ProviderResult> {
  try {
    const fixtures: NormalizedFixture[] = [];
    let failed = 0;
    for (const [id, league] of Object.entries(TSD_LEAGUES)) {
      for (const endpoint of ["eventspastleague", "eventsnextleague"]) {
        try {
          const res = await fetch(
            `https://www.thesportsdb.com/api/v1/json/3/${endpoint}.php?id=${id}`,
            { cache: "no-store" }
          );
          if (!res.ok) {
            failed++;
            continue;
          }
          const json = (await res.json()) as {
            events?: {
              idEvent: string;
              dateEvent: string;
              strTimestamp?: string | null;
              strTime?: string | null;
              strHomeTeam?: string;
              strAwayTeam?: string;
              intHomeScore?: string | null;
              intAwayScore?: string | null;
              strStatus?: string | null;
            }[];
          };
          for (const ev of json.events ?? []) {
            const homeName = ev.strHomeTeam;
            const awayName = ev.strAwayTeam;
            if (!homeName || !awayName) continue;
            const status = (ev.strStatus ?? "").toUpperCase();
            // Le plan gratuit ne diffuse pas les scores live : FT uniquement.
            if (status !== "FT" && status !== "AET" && status !== "PEN") continue;
            const h = ev.intHomeScore !== null && ev.intHomeScore !== undefined ? Number(ev.intHomeScore) : null;
            const a = ev.intAwayScore !== null && ev.intAwayScore !== undefined ? Number(ev.intAwayScore) : null;
            if (h === null || a === null || Number.isNaN(h) || Number.isNaN(a)) continue;
            const ts = (ev.strTimestamp ?? "").replace(" ", "T");
            const iso = ts
              ? ts.endsWith("Z")
                ? ts
                : `${ts}Z`
              : `${ev.dateEvent}T${(ev.strTime ?? "12:00:00").slice(0, 8)}Z`;
            const home = toOurName(homeName);
            const away = toOurName(awayName);
            fixtures.push({
              id: stableId(iso, home, away),
              sourceId: ev.idEvent,
              provider: "thesportsdb",
              league,
              date: iso,
              home,
              away,
              homeScore: h,
              awayScore: a,
              status: "ft",
              liveStatus: "FT",
              elapsed: null,
            });
          }
        } catch {
          failed++;
        }
      }
    }
    if (fixtures.length === 0 && failed > 0) {
      return { provider: "thesportsdb", fixtures: [], error: `HTTP échoué (${failed} appels)` };
    }
    return { provider: "thesportsdb", fixtures, error: null };
  } catch (e) {
    return { provider: "thesportsdb", fixtures: [], error: (e as Error).message };
  }
}

// ---------------------------------------------------------------
// FOURNISSEUR 5 : OpenLigaDB (sans clé — Bundesliga, résultats
// communautaires quasi temps réel). 1 seul appel = toute la journée.
// ---------------------------------------------------------------

async function providerOpenLigaDB(): Promise<ProviderResult> {
  try {
    const res = await fetch("https://api.openligadb.de/getmatchdata/bl1", { cache: "no-store" });
    if (!res.ok) {
      return { provider: "openligadb", fixtures: [], error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as {
      matchID: number;
      matchDateTime: string;
      matchIsFinished: boolean;
      team1?: { teamName?: string; shortName?: string };
      team2?: { teamName?: string; shortName?: string };
      matchResults?: {
        resultTypeName?: string;
        pointsTeam1?: number | null;
        pointsTeam2?: number | null;
      }[];
    }[];
    const fixtures: NormalizedFixture[] = [];
    for (const m of json ?? []) {
      const hName = m.team1?.teamName ?? m.team1?.shortName;
      const aName = m.team2?.teamName ?? m.team2?.shortName;
      if (!hName || !aName) continue;
      const results = m.matchResults ?? [];
      const ft =
        results.find((r) => /endergebnis|final/i.test(r.resultTypeName ?? "")) ??
        results[results.length - 1];
      const h = ft?.pointsTeam1 ?? null;
      const a = ft?.pointsTeam2 ?? null;
      const hasScore = h !== null && a !== null;
      if (!m.matchIsFinished && !hasScore) continue; // pas commencé
      const home = toOurName(hName);
      const away = toOurName(aName);
      const isLive = !m.matchIsFinished && hasScore;
      fixtures.push({
        id: stableId(m.matchDateTime, home, away),
        sourceId: String(m.matchID),
        provider: "openligadb",
        league: "bundesliga",
        date: m.matchDateTime,
        home,
        away,
        homeScore: hasScore ? h : null,
        awayScore: hasScore ? a : null,
        status: m.matchIsFinished ? "ft" : "live",
        liveStatus: m.matchIsFinished ? "FT" : "LIVE",
        elapsed: null,
      });
    }
    return { provider: "openligadb", fixtures, error: null };
  } catch (e) {
    return { provider: "openligadb", fixtures: [], error: (e as Error).message };
  }
}

// ---------------------------------------------------------------
// LA CHAÎNE : couche gratuite FUSIONNÉE (football-data.org + ESPN +
// TheSportsDB + OpenLigaDB en parallèle), api-football en dernier
// recours uniquement (préserve le quota 100/jour du plan gratuit).
// ---------------------------------------------------------------

export async function fetchFixturesWithFallback(
  opts: { skipApiFootball?: boolean } = {}
): Promise<{
  result: ProviderResult | null;
  attempts: { provider: string; error: string }[];
}> {
  const attempts: { provider: string; error: string }[] = [];
  if (opts.skipApiFootball) attempts.push({ provider: "api-football", error: "skipped (quota)" });

  // 1) COUCHE GRATUITE : tous les fournisseurs sans quota sont appelés EN
  //    PARALLÈLE puis FUSIONNÉS par match (id stable équipes+jour) : celui
  //    qui a le score complète celui qui ne l'a pas → couverture maximale,
  //    aucune panne unique ne peut plus bloquer la synchro.
  const freeProviders = [providerFootballDataOrg, providerEspn, providerSportsDB, providerOpenLigaDB];
  const results = await Promise.all(freeProviders.map((p) => p()));
  const merged = new Map<string, NormalizedFixture>();
  const contributors: string[] = [];
  let okCount = 0;
  for (const r of results) {
    if (r.error) {
      attempts.push({ provider: r.provider, error: r.error });
      continue;
    }
    okCount++;
    if (r.fixtures.length > 0) contributors.push(r.provider);
    for (const f of r.fixtures) {
      const cur = merged.get(f.id);
      if (!cur) {
        merged.set(f.id, f);
        continue;
      }
      // un score là où il manquait, ou un FT plus fiable qu'un live → on prend
      if ((cur.homeScore === null && f.homeScore !== null) || (cur.status === "live" && f.status === "ft")) {
        merged.set(f.id, { ...f, provider: `${cur.provider}+${f.provider}` });
      }
    }
  }
  if (okCount > 0) {
    const label = contributors.join("+") || "multi";
    lastApiMeta = {
      provider: label,
      path: "fusion multi-fournisseurs",
      ok: true,
      status: 200,
      quotaHeaderRemaining: null,
      errors: null,
      count: merged.size,
    };
    return { result: { provider: label, fixtures: [...merged.values()], error: null }, attempts };
  }

  // 2) API-Football : ultime recours (quotas du plan gratuit préservés)
  if (!opts.skipApiFootball) {
    const r = await providerApiFootball();
    if (r.error !== "no_key" && !r.error) return { result: r, attempts };
    attempts.push({ provider: r.provider, error: r.error ?? "inconnu" });
  }
  return { result: null, attempts };
}

export { toOurName, stableId, ourLeague, apiTeamToOurs };
export type { ApiFixture };

/** Traduit un nom d'équipe API vers notre nom FR en base */
function apiTeamToOurs(name: string): string {
  return aliasLookup(name);
}
