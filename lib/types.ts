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
  /** Email confirmé (badge ✓ vérifié) */
  email_verified: boolean;
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

/** Événement d'un match en direct (buteur, carton, penalty...) */
export interface MatchEventRow {
  fixture_id: string;
  team: string;
  player: string;
  type: string; // Goal | Card | Var | Sub
  detail: string | null; // Normal Goal | Yellow Card | Red Card | Penalty...
  minute: number | null;
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
    last_events_sync: number;
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


// ============================================================
// MODULE PRONOJOB — agrégateur d'offres d'emploi (/prono-job)
// ============================================================

/** Offre d'emploi normalisée, quelle que soit la source (Arbeitnow, Remotive, Adzuna, JSearch) */
export interface PronoJob {
  id: string;
  source: string;          // arbeitnow | remotive | adzuna | jsearch
  source_id: string;
  title: string;
  company: string;
  city: string | null;
  country: string | null;
  contract_type: string;   // full-time | part-time | contract | internship | freelance | other
  remote: boolean;
  description_short: string | null;  // extrait ≤ 280 caractères (conformité légale)
  url: string;             // lien vers l'offre ORIGINALE
  salary_min: number | null;
  salary_max: number | null;
  published_at: string | null;
}

/** Préférences emploi d'un joueur (alimentent le PronoScore) */
export interface JobPrefs {
  keywords: string;        // mots-clés métier, ex : "chauffeur, cuisine, logistique"
  city: string;            // ville souhaitée
  remote_only: boolean;
  german_level: string;    // none | A1 | A2 | B1 | B2 | C1 | C2
  english_level: string;   // none | A1 | A2 | B1 | B2 | C1 | C2
  contract: string;        // "" = tous les contrats
}

/** Filtres de recherche d'emploi */
export interface JobFilters {
  q?: string;
  city?: string;
  country?: string;
  contract?: string;
  remote?: boolean;
  source?: string;
  page?: number;
}

/** Offre + PronoScore (probabilité de match avec le profil, 0-99) */
export interface PronoScoredJob extends PronoJob {
  score: number | null;    // null = profil non renseigné
  reasons: string[];       // explication du score
}

/** Candidature enregistrée via "Postuler depuis Pronofoot" */
export interface JobApplication {
  id: string;
  created_at: string;
  status: string;          // sent | viewed | interview | rejected
  job: PronoJob | null;
}


// ============================================================
// MODULE 2 — PRONOPROFIL & PRONOCV (/prono-profil)
// ============================================================

/** Intentions disponibles (un profil par intention et par compte) */
export type PronoIntention = "emploi" | "logement" | "visa" | "rencontre";

/** Une expérience professionnelle (dans PronoProfile.experiences) */
export interface ProfileExperience {
  role: string;
  company: string;
  period: string;
  description?: string;
}

/** Un diplôme / une formation (dans PronoProfile.educations) */
export interface ProfileEducation {
  degree: string;
  school: string;
  year: string;
}

/** Profil d'un joueur pour une intention donnée (table prono_profiles) */
export interface PronoProfile {
  id: string;
  user_id: string;
  intention: PronoIntention;
  full_name: string;
  phone: string;
  city: string;
  country: string;
  birth_year: number | null;
  bio: string;
  job_title: string;
  skills: string;
  experiences: ProfileExperience[];
  educations: ProfileEducation[];
  german_level: string;
  english_level: string;
  other_languages: string;
  linkedin_url: string;
  target_country: string;
  visa_type: string;
  blocked_note: string;
  housing_city: string;
  housing_type: string;
  budget_max: number | null;
  age_range: string;
  looking_for: string;
  created_at: string;
  updated_at: string;
}

// ---------- MODULE 5 : PRONO-ANNONCES ----------
export type AnnonceCategory = "rencontre" | "partenaire" | "ami" | "logement" | "service";

export interface PronoAnnonce {
  id: string;
  user_id: string;
  category: AnnonceCategory;
  title: string;
  description: string;
  city: string;
  country: string;
  photos: string[];
  status: string; // active | hidden | removed
  reports_count: number;
  created_at: string;
  updated_at: string;
  author?: { username: string | null; avatar_url: string | null; email_verified?: boolean } | null;
}

// ---------- MODULE 6 : PRONO-VOYAGE ----------
export interface PronoVoyageTrip {
  id: string;
  user_id: string;
  origin_city: string;
  dest_city: string;
  trip_date: string; // YYYY-MM-DD
  seats: number;
  price_eur: number;
  note: string;
  status: string; // active | hidden | removed
  reports_count: number;
  created_at: string;
  updated_at: string;
  author?: { username: string | null; avatar_url: string | null; email_verified?: boolean } | null;
}

// ---------- MODULE 7 : MESSAGERIE INTERNE ----------
export type ChatContextType = "annonce" | "trajet";

export interface PronoConversation {
  id: string;
  context_type: ChatContextType;
  context_id: string;
  listing_owner: string;
  requester: string;
  status: string;
  contact_revealed: boolean;
  last_read_owner: string;
  last_read_requester: string;
  created_at: string;
  updated_at: string;
}

export interface PronoMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

/** Conversation enrichie pour la liste /messages */
export interface ChatThreadSummary {
  id: string;
  context_type: ChatContextType;
  context_id: string;
  context_title: string;
  other_username: string | null;
  other_avatar: string | null;
  other_email_verified: boolean | null;
  last_message: string | null;
  last_message_at: string | null;
  unread: number;
  contact_revealed: boolean;
  am_owner: boolean;
}

/** Fil de discussion complet */
export interface ChatThread {
  conversation: PronoConversation;
  messages: PronoMessage[];
  am_owner: boolean;
  other_username: string | null;
  other_avatar: string | null;
  other_email_verified: boolean | null;
  context_title: string;
  /** Coordonnées du propriétaire, visibles uniquement si contact_revealed */
  contact: { preference: string; value: string } | null;
}

/** Notification in-app (table prono_notifications, migration 011) */
export interface PronoNotification {
  id: string;
  type: "chat_message" | "chat_new" | "chat_contact" | "system";
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}
