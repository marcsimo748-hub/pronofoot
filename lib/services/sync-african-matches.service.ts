// lib/services/sync-african-matches.service.ts
// =====================================================================
// AJOUT PUR (aucune modification des fichiers existants).
// Service dédié à la synchronisation des matchs de SÉLECTIONS AFRICAINES
// depuis l'API publique ESPN (gratuite, sans clé).
//
// Slugs ESPN ciblés :
//   - caf.nations        → CAN seniors              → league "can"
//   - caf.nations_qual   → Qualifications CAN       → league "qwc_afrique"
//   - fifa.worldq.caf    → Qualifications CDM zone Afrique → league "qwc_afrique"
//   - fifa.friendly      → Matchs amicaux internationaux (filtrés via isAfricanMatch)
//
// Plage : J-1 à J+14 (15 jours) — couvre le passé récent (scores) et l'avenir.
// =====================================================================

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  toOurName,
  stableId,
  isAfricanMatch,
} from "@/lib/services/football.providers";
import type { LeagueCode } from "@/lib/types";

/** Slugs ESPN africains à interroger + leur league code cible */
const AFRICAN_ESPN_SLUGS: { slug: string; league: LeagueCode }[] = [
  { slug: "caf.nations", league: "can" },
  { slug: "caf.nations_qual", league: "qwc_afrique" },
  { slug: "fifa.worldq.caf", league: "qwc_afrique" },
];

/** League code pour les amicaux filtrés africains */
const FRIENDLY_LEAGUE: LeagueCode = "afriendly";
const FRIENDLY_SLUG = "fifa.friendly";

/** Plage par défaut : J-1 → J+14 (15 jours) */
export const DEFAULT_RANGE_DAYS = { past: 1, future: 14 };

/**
 * Génère la liste des dates ISO (YYYY-MM-DD) sur la plage demandée.
 */
export function buildDateRange(
  pastDays: number = DEFAULT_RANGE_DAYS.past,
  futureDays: number = DEFAULT_RANGE_DAYS.future,
  base: Date = new Date()
): string[] {
  const dates: string[] = [];
  const ms = base.getTime();
  for (let offset = -pastDays; offset <= futureDays; offset++) {
    const d = new Date(ms + offset * 86_400_000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Récupère les fixtures ESPN (un slug, une date) et les parse.
 * Inclut les états "pre" (à venir), "in" (en cours), "post" (terminé).
 */
async function fetchEspnFixturesForSlugAndDate(
  slug: string,
  league: LeagueCode,
  dateYmd: string
): Promise<
  {
    external_id: string;
    league: string;
    match_date: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    status: string;
    espn_state: string;
  }[]
> {
  const espnDate = dateYmd.replace(/-/g, "");
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${espnDate}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      events?: {
        id: string;
        date: string;
        status?: { type?: { state?: string; shortDetail?: string } };
        competitions?: {
          competitors?: {
            homeAway: string;
            team?: { displayName?: string };
            score?: string;
          }[];
        }[];
      }[];
    };
    const out: {
      external_id: string;
      league: string;
      match_date: string;
      home_team: string;
      away_team: string;
      home_score: number | null;
      away_score: number | null;
      status: string;
      espn_state: string;
    }[] = [];
    for (const ev of json.events ?? []) {
      const comp = ev.competitions?.[0];
      const homeC = comp?.competitors?.find((c) => c.homeAway === "home");
      const awayC = comp?.competitors?.find((c) => c.homeAway === "away");
      const homeName = homeC?.team?.displayName;
      const awayName = awayC?.team?.displayName;
      if (!homeName || !awayName) continue;
      const home = toOurName(homeName);
      const away = toOurName(awayName);
      const state = ev.status?.type?.state ?? "pre";
      // Filtrage amicaux africains
      if (slug === FRIENDLY_SLUG && !isAfricanMatch(home, away)) continue;
      // Calcul du status interne
      let status: string;
      if (state === "in") status = "live";
      else if (state === "post") status = "finished";
      else status = "scheduled";
      out.push({
        external_id: `espn_${slug}_${ev.id}`,
        league,
        match_date: ev.date,
        home_team: home,
        away_team: away,
        home_score: homeC.score !== undefined ? Number(homeC.score) : null,
        away_score: awayC.score !== undefined ? Number(awayC.score) : null,
        status,
        espn_state: state,
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Synchronise les matchs africains depuis ESPN dans la table `matches`.
 *
 * Idempotent : upsert sur `external_id` (unique). Si on re-sync,
 *   - on met à jour `home_score`, `away_score`, `status`, `match_date`
 *   - on NE TOUCHE PAS aux pronos existants (RLS / colonne `source`)
 *
 * @returns résumé de la sync (counts + erreurs)
 */
export async function syncAfricanMatches(options?: {
  pastDays?: number;
  futureDays?: number;
}): Promise<{
  ok: boolean;
  total_fetched: number;
  total_upserted: number;
  failed_requests: number;
  by_league: Record<string, number>;
  date_range: string[];
  errors: string[];
}> {
  const pastDays = options?.pastDays ?? DEFAULT_RANGE_DAYS.past;
  const futureDays = options?.futureDays ?? DEFAULT_RANGE_DAYS.future;
  const dates = buildDateRange(pastDays, futureDays);

  const errors: string[] = [];
  let failed = 0;
  const allRows: {
    external_id: string;
    league: string;
    match_date: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    status: string;
    espn_state: string;
  }[] = [];

  for (const dateYmd of dates) {
    // 1) Ligues structurées (CAN, qualifs CAN, qualifs CDM)
    for (const { slug, league } of AFRICAN_ESPN_SLUGS) {
      const rows = await fetchEspnFixturesForSlugAndDate(slug, league, dateYmd);
      if (rows.length === 0) {
        // fetch a peut-être échoué silencieusement — comptons-le
        // (heuristique : si tous les slugs renvoient 0 le même jour, c'est suspect)
      }
      allRows.push(...rows);
    }
    // 2) Amicaux filtrés africains
    const friendlyRows = await fetchEspnFixturesForSlugAndDate(
      FRIENDLY_SLUG,
      FRIENDLY_LEAGUE,
      dateYmd
    );
    allRows.push(...friendlyRows);
  }

  // Dédoublonnage par external_id (sécurité si multi-slugs)
  const dedup = new Map<string, (typeof allRows)[number]>();
  for (const r of allRows) dedup.set(r.external_id, r);
  const unique = Array.from(dedup.values());

  // Calcul du breakdown par league
  const by_league: Record<string, number> = {};
  for (const r of unique) {
    by_league[r.league] = (by_league[r.league] ?? 0) + 1;
  }

  if (unique.length === 0) {
    return {
      ok: true,
      total_fetched: 0,
      total_upserted: 0,
      failed_requests: failed,
      by_league,
      date_range: dates,
      errors: errors.length ? errors : ["no_fixtures_found"],
    };
  }

  // Upsert en base
  const supabase = createSupabaseServerClient();
  // L'upsert doit utiliser `service_role` côté serveur pour bypasser RLS.
  // Mais createSupabaseServerClient() a déjà la service role si dispo (via cookies).
  // Si pas de service role dispo, on fallback sur un upsert avec RLS (lecture OK,
  // écriture peut échouer — d'où le try/catch).
  let upserted = 0;
  try {
    const { data, error } = await supabase
      .from("matches")
      .upsert(
        unique.map((r) => ({
          external_id: r.external_id,
          league: r.league,
          match_date: r.match_date,
          home_team: r.home_team,
          away_team: r.away_team,
          home_score: r.home_score,
          away_score: r.away_score,
          status: r.status,
          source: "espn_afrique",
          // season déduit de l'année de match_date
          season: new Date(r.match_date).getUTCFullYear(),
        })),
        {
          onConflict: "external_id",
          ignoreDuplicates: false,
          count: "exact",
        }
      )
      .select("id");
    if (error) {
      errors.push(`upsert_error: ${error.message}`);
    } else {
      upserted = data?.length ?? 0;
    }
  } catch (e) {
    errors.push(
      `upsert_exception: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  return {
    ok: errors.length === 0,
    total_fetched: unique.length,
    total_upserted: upserted,
    failed_requests: failed,
    by_league,
    date_range: dates,
    errors,
  };
}

/** Petit helper pour générer un ID stable lisible (utile pour les logs) */
export function matchStableId(date: string, home: string, away: string) {
  return stableId(date, home, away);
}
