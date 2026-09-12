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
};

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
  "roma": "AS Rome",
  "as roma": "AS Rome",
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
    requests_remaining: null,
    requests_day: null,
  },
  live_tester: { active: false },
  standings_cache: { updated_at: null, leagues: {} },
};

/** Nom du site */
export const SITE_NAME = "PRONO";
export const SITE_TAGLINE = "La Super-App de la Diaspora";
