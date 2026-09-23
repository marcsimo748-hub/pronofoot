/**
 * Types centraux de l'application PRONOFOOT.
 * Une seule source de vérité pour le front ET les services.
 */

export type LeagueCode =
  | "champions"
  | "premier"
  | "laliga"
  | "seriea"
  | "ligue1"
  | "bundesliga";

export type MatchStatus = "scheduled" | "live" | "finished" | "missed" | "archived";

/** Profil public d'un joueur (table `profiles`, liée à auth.users) */
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  total_points: number;
  created_at: string;
}

/** Utilisateur courant côté client (profil + email) */
export interface SessionUser {
  id: string;
  email: string | null;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  total_points: number;
}

/** Un match à pronostiquer / joué (table `matches`) */
export interface Match {
  id: string;
  external_id: string | null;
  league: LeagueCode;
  match_date: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  source: string;
  round?: string | null;
}

/** Pronostic d'un joueur (table `predictions`) */
export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points_earned: number;
  calculated: boolean;
  created_at?: string;
  /** Jointure optionnelle vers le match */
  matches?: Match;
}

/** Bonus de saison pronostiqué (table `bonus_predictions`) */
export interface BonusPrediction {
  id: string;
  user_id: string;
  category: string;
  answer: string;
  points_earned: number;
  settled: boolean;
}

/** Ligne du cache scores live (table `live_scores`) */
export interface LiveScoreRow {
  id: string;
  league: string;
  match_date: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string; // NS | 1H | HT | 2H | ET | FT | TEST
  elapsed: number | null;
}

/** Article d'actualité en cache (table `news`) */
export interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source: string | null;
  published_at: string | null;
}

/** Morceau de musique (table `songs`) */
export interface Song {
  id: string;
  title: string;
  artist: string | null;
  cover_url: string | null;
  audio_url: string;
  duration: number | null;
  position: number;
}

/** Message de chat (widget IA + table `chat_history`) */
export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/** Groupe d'amis (table `groups`) */
export interface GroupInfo {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
}

/** Ligne de classement (vues RPC `get_*_standings`) */
export interface StandingRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  preds: number;
}

/** Réglages du site (table `site_settings`, JSONB par clé) */
export interface SiteSettings {
  theme: { primary: string };
  announcement: { active: boolean; message: string; level: "info" | "warn" | "success" };
  wallpapers: { login: string; home: string };
  leagues: Record<LeagueCode, { banner_url: string; background_url: string }>;
  sync_state: {
    last_scores_sync: number;
    last_news_sync: number;
    last_cleanup: number;
    last_standings_sync: number;
    last_fixtures_import: number;
    requests_remaining: number | null;
    requests_day: string | null;
  };
  live_tester: { active: boolean };
  standings_cache: {
    updated_at: string | null;
    leagues: Partial<Record<LeagueCode, StandingEntry[]>>;
  };
}

/** Ligne d'un classement de championnat (cache standings) */
export interface StandingEntry {
  rank: number;
  team: string;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals_for: number;
  goals_against: number;
  points: number;
  form?: string;
}

/** Réponse JSON standard des routes API */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  skipped?: string;
  provider?: string;
}
