/**
 * Constantes métier PRONOFOOT :
 * championnats, 19 équipes vedettes, barème de points, réglages par défaut.
 */

import type { LeagueCode, SiteSettings } from "./types";

/** Les 6 compétitions suivies */
export const LEAGUES: Record<
  LeagueCode,
  { name: string; short: string; country: string; color: string; apiId: number; season: number }
> = {
  champions: { name: "Ligue des Champions", short: "C1", country: "Europe", color: "#3b82f6", apiId: 2, season: 2026 },
  premier: { name: "Premier League", short: "PL", country: "Angleterre", color: "#a855f7", apiId: 39, season: 2026 },
  laliga: { name: "LaLiga", short: "ES", country: "Espagne", color: "#f97316", apiId: 140, season: 2026 },
  seriea: { name: "Serie A", short: "IT", country: "Italie", color: "#38bdf8", apiId: 135, season: 2026 },
  ligue1: { name: "Ligue 1", short: "FR", country: "France", color: "#6366f1", apiId: 61, season: 2026 },
  bundesliga: { name: "Bundesliga", short: "DE", country: "Allemagne", color: "#ef4444", apiId: 78, season: 2026 },
  // Compétitions africaines + qualifs CDM + amicaux sélections
  can: { name: "CAN (Coupe d'Afrique des Nations)", short: "CAN", country: "Afrique", color: "#16a34a", apiId: 6, season: 2025 },
  can_u17: { name: "CAN U17", short: "U17", country: "Afrique", color: "#10b981", apiId: 10593, season: 2025 },
  can_u20: { name: "CAN U20", short: "U20", country: "Afrique", color: "#22c55e", apiId: 10587, season: 2025 },
  can_u23: { name: "CAN U23 / Jeux Africains", short: "U23", country: "Afrique", color: "#15803d", apiId: 10589, season: 2025 },
  qwc_afrique: { name: "Qualifications CDM (Afrique)", short: "QCM-AF", country: "Afrique", color: "#eab308", apiId: 29, season: 2026 },
  wcq_afrique: { name: "Qualifications CDM (Afrique)", short: "QCM-AF", country: "Afrique", color: "#eab308", apiId: 29, season: 2026 },
  afriendly: { name: "Amicaux internationaux", short: "AMI", country: "Monde", color: "#94a3b8", apiId: 10, season: 2025 },
  international: { name: "Compétition internationale", short: "INT", country: "Monde", color: "#64748b", apiId: 0, season: 2025 },
};

/** Codes des compétitions africaines + internationales (sélections nationales). */
export const AFRICA_LEAGUE_CODES: LeagueCode[] = [
  "can",
  "can_u17",
  "can_u20",
  "can_u23",
  "qwc_afrique",
  "wcq_afrique",
  "afriendly",
  "international",
];

/**
 * Sélections nationales africaines vedettes (pour la page /prono-afrique).
 * Les apiId correspondent aux IDs API-Football v3 des équipes nationales.
 * Triées par popularité diaspora (Cameroun en premier, puis grandes nations).
 */
export const AFRICA_FEATURED_TEAMS: {
  name: string;
  country: string;
  league: LeagueCode;
  apiId: number;
  color: string;
  flag: string; // emoji drapeau
}[] = [
  // Tier 1 — favoris diaspora camerounaise + grandes nations football
  { name: "Cameroun", country: "Cameroun", league: "can" as LeagueCode, apiId: 32, color: "#007a5e", flag: "🇨🇲" },
  { name: "Sénégal", country: "Sénégal", league: "can" as LeagueCode, apiId: 37, color: "#00853f", flag: "🇸🇳" },
  { name: "Maroc", country: "Maroc", league: "can" as LeagueCode, apiId: 26, color: "#c1272d", flag: "🇲🇦" },
  { name: "Nigeria", country: "Nigeria", league: "can" as LeagueCode, apiId: 30, color: "#008751", flag: "🇳🇬" },
  { name: "Côte d'Ivoire", country: "Côte d'Ivoire", league: "can" as LeagueCode, apiId: 39, color: "#f77f00", flag: "🇨🇮" },
  { name: "Égypte", country: "Égypte", league: "can" as LeagueCode, apiId: 33, color: "#ce1126", flag: "🇪🇬" },
  { name: "Ghana", country: "Ghana", league: "can" as LeagueCode, apiId: 36, color: "#ce1126", flag: "🇬🇭" },
  { name: "Algérie", country: "Algérie", league: "can" as LeagueCode, apiId: 25, color: "#006633", flag: "🇩🇿" },
  { name: "Tunisie", country: "Tunisie", league: "can" as LeagueCode, apiId: 27, color: "#e70013", flag: "🇹🇳" },
  // Tier 2 — autres nations importantes
  { name: "Mali", country: "Mali", league: "can" as LeagueCode, apiId: 41, color: "#14b53a", flag: "🇲🇱" },
  { name: "Burkina Faso", country: "Burkina Faso", league: "can" as LeagueCode, apiId: 47, color: "#ef2b2d", flag: "🇧🇫" },
  { name: "Guinée", country: "Guinée", league: "can" as LeagueCode, apiId: 38, color: "#ce1126", flag: "🇬🇳" },
  { name: "RD Congo", country: "RD Congo", league: "can" as LeagueCode, apiId: 42, color: "#007fff", flag: "🇨🇩" },
  { name: "Gabon", country: "Gabon", league: "can" as LeagueCode, apiId: 44, color: "#009e60", flag: "🇬🇦" },
  { name: "Cap-Vert", country: "Cap-Vert", league: "can" as LeagueCode, apiId: 129, color: "#003893", flag: "🇨🇻" },
  { name: "Sénégal U20", country: "Sénégal", league: "can_u20" as LeagueCode, apiId: 1504, color: "#00853f", flag: "🇸🇳" },
  { name: "Cameroun U17", country: "Cameroun", league: "can_u17" as LeagueCode, apiId: 1763, color: "#007a5e", flag: "🇨🇲" },
];

export const LEAGUE_CODES = Object.keys(LEAGUES) as LeagueCode[];

/**
 * Les 19 équipes vedettes sur lesquelles repose le jeu.
 * `apiId` = identifiant API-FOOTBALL (pour la synchro automatique des matchs).
 */
export const FEATURED_TEAMS = [
  // 🏴 Angleterre (7)
  { name: "Manchester City", country: "Angleterre", league: "premier" as LeagueCode, apiId: 50, color: "#6CABDD" },
  { name: "Manchester United", country: "Angleterre", league: "premier" as LeagueCode, apiId: 33, color: "#DA291C" },
  { name: "Liverpool", country: "Angleterre", league: "premier" as LeagueCode, apiId: 40, color: "#C8102E" },
  { name: "Arsenal", country: "Angleterre", league: "premier" as LeagueCode, apiId: 42, color: "#EF0107" },
  { name: "Chelsea", country: "Angleterre", league: "premier" as LeagueCode, apiId: 49, color: "#034694" },
  { name: "Tottenham", country: "Angleterre", league: "premier" as LeagueCode, apiId: 47, color: "#132257" },
  { name: "Newcastle", country: "Angleterre", league: "premier" as LeagueCode, apiId: 34, color: "#241F20" },
  // 🇪🇸 Espagne (3)
  { name: "Real Madrid", country: "Espagne", league: "laliga" as LeagueCode, apiId: 541, color: "#FEBE10" },
  { name: "FC Barcelone", country: "Espagne", league: "laliga" as LeagueCode, apiId: 529, color: "#A50044" },
  { name: "Atlético Madrid", country: "Espagne", league: "laliga" as LeagueCode, apiId: 530, color: "#CB3524" },
  // 🇫🇷 France (2)
  { name: "Paris Saint-Germain", country: "France", league: "ligue1" as LeagueCode, apiId: 85, color: "#004170" },
  { name: "Olympique de Marseille", country: "France", league: "ligue1" as LeagueCode, apiId: 81, color: "#2FAEE0" },
  // 🇮🇹 Italie (5)
  { name: "AS Rome", country: "Italie", league: "seriea" as LeagueCode, apiId: 497, color: "#8E1F2F" },
  { name: "Inter Milan", country: "Italie", league: "seriea" as LeagueCode, apiId: 505, color: "#0068A8" },
  { name: "Juventus", country: "Italie", league: "seriea" as LeagueCode, apiId: 496, color: "#000000" },
  { name: "AC Milan", country: "Italie", league: "seriea" as LeagueCode, apiId: 489, color: "#FB090B" },
  { name: "Naples", country: "Italie", league: "seriea" as LeagueCode, apiId: 492, color: "#12A0D7" },
  // 🇩🇪 Allemagne (2)
  { name: "Bayern Munich", country: "Allemagne", league: "bundesliga" as LeagueCode, apiId: 157, color: "#DC052D" },
  { name: "Borussia Dortmund", country: "Allemagne", league: "bundesliga" as LeagueCode, apiId: 165, color: "#FDE100" },
] as const;

/** Alias de normalisation des noms d'équipes (API-FOOTBALL ↔ noms FR du seed) */
export const TEAM_ALIASES: Record<string, string> = {
  // normalisé API → nom FR utilisé en base
  "paris saint germain": "Paris Saint-Germain",
  "psg": "Paris Saint-Germain",
  "marseille": "Olympique de Marseille",
  "napoli": "Naples",
  "roma": "AS Roma",
  "as roma": "AS Roma",
  "inter": "Inter Milan",
  "internazionale": "Inter Milan",
  "milan": "AC Milan",
  "barcelona": "FC Barcelone",
  "fc barcelona": "FC Barcelone",
  "atletico madrid": "Atlético Madrid",
  "club atletico de madrid": "Atlético Madrid",
  "bayern munich": "Bayern Munich",
  "fc bayern munich": "Bayern Munich",
  "borussia dortmund": "Borussia Dortmund",
  "manchester united": "Manchester United",
  "manchester city": "Manchester City",
  "tottenham hotspur": "Tottenham",
  "newcastle united": "Newcastle",
  "juventus": "Juventus",
  "real madrid": "Real Madrid",
  "liverpool": "Liverpool",
  "arsenal": "Arsenal",
  "chelsea": "Chelsea",
  // --- variantes football-data.org (noms officiels UEFA) et ESPN ---
  "bayern munchen": "Bayern Munich",
  "fc bayern": "Bayern Munich",
  "fc bayern munchen": "Bayern Munich",
  "ac milan": "AC Milan",
  "inter milan": "Inter Milan",
  "atletico": "Atlético Madrid",
  "atletico de madrid": "Atlético Madrid",
  "olympique de marseille": "Olympique de Marseille",
  "olympique marseille": "Olympique de Marseille",
  "paris saint germain fc": "Paris Saint-Germain",
  "man city": "Manchester City",
  "man united": "Manchester United",
  "manchester utd": "Manchester United",
  "spurs": "Tottenham",
  "tottenham hotspur fc": "Tottenham",
  "newcastle united fc": "Newcastle",
  "juventus fc": "Juventus",
  "juve": "Juventus",
  "real madrid cf": "Real Madrid",
  "fc liverpool": "Liverpool",
  "liverpool fc": "Liverpool",
  "arsenal fc": "Arsenal",
  "chelsea fc": "Chelsea",
  "borussia monchengladbach": "Gladbach",
  "bayer leverkusen": "Leverkusen",
  "rb leipzig": "RB Leipzig",
  "eintracht frankfurt": "Francfort",
  // --- noms ESPN (displayName anglais) ---
  "bologna": "Bologne",
  "leeds united": "Leeds United",
  "rayo vallecano": "Rayo Vallecano",
  "real sociedad": "Real Sociedad",
  "athletic club": "Athletic Bilbao",
  "olympique lyon": "Olympique Lyonnais",
  "lazio": "Lazio",
  "udinese": "Udinese",
  "sassuolo": "Sassuolo",
  "everton": "Everton",
  "fulham": "Fulham",
  "sunderland": "Sunderland",
  "paderborn": "Paderborn",
  "elversberg": "Elversberg",
  "brest": "Brest",
  // --- variantes ESPN/api-football decouvertes au rattrapage du 15/09 ---
  "ss lazio": "Lazio",
  "sv elversberg": "Elversberg",
  "sc paderborn 07": "Paderborn",
  "paderborn 07": "Paderborn",
  "leeds": "Leeds United",
  "bayern": "Bayern Munich",
  // --- variantes ESPN découvertes le 19/09 (import fixtures) — cibles = noms en base ---
  "as rome": "AS Roma",
  "bournemouth": "AFC Bournemouth",
  "1 fc union berlin": "Union Berlin",
  "union berlin": "Union Berlin",
  "aj auxerre": "Auxerre",
  "as monaco": "Monaco",
  "brighton hove albion": "Brighton",
  "deportivo": "Deportivo La Corogne",
  "deportivo de la coruna": "Deportivo La Corogne",
  "eintracht francfort": "Francfort",
  "fc cologne": "Cologne",
  "hamburg sv": "Hambourg SV",
  "le havre ac": "Le Havre",
  "mainz": "Mayence",
  "sevilla": "Séville",
  "stade rennais": "Rennes",
  "tsg hoffenheim": "Hoffenheim",
  "werder bremen": "Werder Brême",
  // --- noms officiels OpenLigaDB (Bundesliga, sans clé) ---
  // ("1 fc koln" et "sv werder bremen" existent déjà dans le bloc football-data.org)
  "fc schalke 04": "Schalke 04",
  "schalke 04": "Schalke 04",
  "sv 07 elversberg": "Elversberg",
  "tsg 1899 hoffenheim": "Hoffenheim",
  "sc paderborn": "Paderborn",
  "hamburger sv": "Hambourg SV",
  "1 fsv mainz 05": "Mayence",
  "ac monza": "Monza",
  "monza": "Monza",
  "racing club de lens": "Lens",
  "rennes": "Rennes",
  // --- noms football-data.org (classements, apostrophes/tirets normalisés) ---
  "manchester united fc": "Manchester United",
  "manchester city fc": "Manchester City",
  "aston villa fc": "Aston Villa",
  "west ham united fc": "West Ham",
  "everton fc": "Everton",
  "fulham fc": "Fulham",
  "brighton hove albion fc": "Brighton",
  "nottingham forest fc": "Nottingham Forest",
  "afc bournemouth": "AFC Bournemouth",
  "brentford fc": "Brentford",
  "crystal palace fc": "Crystal Palace",
  "wolverhampton wanderers fc": "Wolverhampton",
  "leeds united fc": "Leeds United",
  "burnley fc": "Burnley",
  "sunderland afc": "Sunderland",
  "west bromwich albion fc": "West Bromwich",
  "as monaco fc": "AS Monaco",
  "stade rennais fc 1901": "Rennes",
  "stade brestois 29": "Brest",
  "lille osc": "Lille",
  "losc lille": "Lille",
  "olympique lyonnais": "Olympique Lyonnais",
  "rc lens": "Lens",
  "fc lorient": "Lorient",
  "fc metz": "Metz",
  "as saint etienne": "Saint-Étienne",
  "ssc napoli": "Naples",
  "fc internazionale": "Inter Milan",
  "fc internazionale milano": "Inter Milan",
  "atalanta bc": "Atalanta",
  "acf fiorentina": "Fiorentina",
  "bologna fc 1909": "Bologne",
  "us sassuolo calcio": "Sassuolo",
  "udinese calcio": "Udinese",
  "cagliari calcio": "Cagliari",
  "hellas verona": "Vérone",
  "torino fc": "Turin",
  "como 1907": "Côme",
  "valencia cf": "Valence",
  "valencia": "Valence",
  "rc celta": "Celta Vigo",
  "ud las palmas": "Las Palmas",
  "getafe cf": "Getafe",
  "villarreal cf": "Villarreal",
  "levante ud": "Levante",
  "girona fc": "Girona",
  "sc freiburg": "Fribourg",
  "fc augsburg": "Augsbourg",
  "bayer 04 leverkusen": "Leverkusen",
  "vfl bochum": "Bochum",
  "sv werder bremen": "Werder Brême",
  "fsv mainz 05": "Mayence",
  "mainz 05": "Mayence",
  "vfb stuttgart": "Stuttgart",
  "tsv 1899 hoffenheim": "Hoffenheim",
  "fc st pauli": "St. Pauli",
  "1 fc heidenheim 1846": "Heidenheim",
  "1 fc koln": "Cologne",
  "fortuna dusseldorf": "Fortuna Düsseldorf",
  "fc copenhagen": "Copenhague",
  "sl benfica": "Benfica",
  "fc porto": "Porto",
  "sporting cp": "Sporting",
  "fc red bull salzburg": "RB Salzbourg",
  "celtic fc": "Celtic",
  "rangers fc": "Rangers",
  "olympiacos fc": "Olympiakos",
  "aek athens": "AEK Athènes",
  "panathinaikos fc": "Panathinaïkos",
  "club brugge": "Club Bruges",
  "krc genk": "Genk",
  "bsc young boys": "Young Boys",
  "shakhtar donetsk": "Shakhtar Donetsk",
};

/** Barème des points (règles d'or du jeu) */
export const POINTS_RULES = {
  EXACT_SCORE: 5, // Score exact
  CORRECT_OUTCOME: 3, // Bon vainqueur ou bon nul (score incorrect)
  WRONG: 0,
} as const;

/** Bonus de saison */
export const BONUS_CATEGORIES: {
  key: string;
  label: string;
  points: number;
  type: "team" | "text";
  league?: LeagueCode;
}[] = [
  { key: "champion_premier", label: "🏆 Champion d'Angleterre", points: 50, type: "team", league: "premier" },
  { key: "champion_laliga", label: "🏆 Champion d'Espagne", points: 50, type: "team", league: "laliga" },
  { key: "champion_seriea", label: "🏆 Champion d'Italie", points: 50, type: "team", league: "seriea" },
  { key: "champion_ligue1", label: "🏆 Champion de France", points: 50, type: "team", league: "ligue1" },
  { key: "champion_bundesliga", label: "🏆 Champion d'Allemagne", points: 50, type: "team", league: "bundesliga" },
  { key: "cup_premier", label: "🏴 Vainqueur FA Cup", points: 30, type: "team", league: "premier" },
  { key: "cup_laliga", label: "🏴 Vainqueur Copa del Rey", points: 30, type: "team", league: "laliga" },
  { key: "cup_seriea", label: "🏴 Vainqueur Coppa Italia", points: 30, type: "team", league: "seriea" },
  { key: "cup_ligue1", label: "🏴 Vainqueur Coupe de France", points: 30, type: "team", league: "ligue1" },
  { key: "cup_bundesliga", label: "🏴 Vainqueur DFB Pokal", points: 30, type: "team", league: "bundesliga" },
  { key: "ucl_winner", label: "⭐ Vainqueur Ligue des Champions", points: 75, type: "team" },
  { key: "ucl_finalist", label: "🥈 Finaliste Ligue des Champions", points: 30, type: "team" },
  { key: "top_scorer", label: "👟 Meilleur buteur de la saison", points: 25, type: "text" },
];

/** Valeurs par défaut des réglages site (fusionnées avec la table site_settings) */
export const DEFAULT_SETTINGS: SiteSettings = {
  theme: { primary: "#16a34a" },
  announcement: { active: false, message: "", level: "info" },
  wallpapers: { login: "", home: "" },
  leagues: {
    champions: { banner_url: "", background_url: "" },
    premier: { banner_url: "", background_url: "" },
    laliga: { banner_url: "", background_url: "" },
    seriea: { banner_url: "", background_url: "" },
    ligue1: { banner_url: "", background_url: "" },
    bundesliga: { banner_url: "", background_url: "" },
  },
  sync_state: {
    last_scores_sync: 0,
    last_news_sync: 0,
    last_cleanup: 0,
    last_standings_sync: 0,
    last_fixtures_import: 0,
    last_events_sync: 0,
    last_scores_result: null,
    api_error: null,
    requests_remaining: null,
    requests_day: null,
  },
  live_tester: { active: false },
  standings_cache: { updated_at: null, leagues: {} },
};

/** Nom du site */
export const SITE_NAME = "PRONO";
export const SITE_TAGLINE = "La Super-App de la Diaspora";
