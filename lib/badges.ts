/**
 * Catalogue des badges PRONO — visibles sur le profil public /joueur/[id].
 *
 * Chaque badge a :
 * - code : identifiant unique en kebab-case (ex: "first-prono")
 * - emoji : icône affichée (une seule)
 * - nom + description trilingues
 * - rarity : common / rare / legendary (influencera l'ordre d'affichage)
 * - check(userStats) : fonction qui teste si l'utilisateur mérite le badge
 *
 * Les badges sont attribués par `lib/services/badges.service.ts` après
 * chaque pronostic validé (settlement côté SQL).
 */

export type BadgeRarity = "common" | "rare" | "legendary";
export type Lang = "fr" | "en" | "de";

export interface BadgeDef {
  code: string;
  emoji: string;
  rarity: BadgeRarity;
  // Trilingue
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  /**
   * Retourne true si l'utilisateur mérite ce badge.
   * @param stats stats agrégées du joueur (déjà calculées)
   */
  check: (stats: BadgeCheckInput) => boolean;
}

/** Données utilisateur nécessaires pour évaluer tous les badges. */
export interface BadgeCheckInput {
  total_predictions: number; // total pronos
  exact_scores: number; // scores exacts
  correct_outcomes: number; // bonnes issues (1, N, 2)
  total_points: number;
  /** Plus longue série de bons pronos consécutifs (exact OU outcome) */
  longest_streak: number;
  /** Nombre de pronos sur des matchs du Cameroun/Lions Indomptables */
  cameroon_pronos: number;
  /** Classement actuel (1 = premier). null si non classé. */
  current_rank: number | null;
  /** Meilleure position atteinte ce mois-ci */
  best_monthly_rank: number | null;
  /** Total jours distincts où l'utilisateur a pronostiqué */
  active_days: number;
}

/**
 * Catalogue — l'ordre du tableau est l'ordre d'affichage (rare en premier).
 */
export const BADGES: BadgeDef[] = [
  // === LÉGENDAIRES ===
  {
    code: "top-3-mois",
    emoji: "👑",
    rarity: "legendary",
    name: {
      fr: "Roi du mois",
      en: "Monthly King",
      de: "Monatskönig",
    },
    description: {
      fr: "Dans le top 3 du classement mensuel",
      en: "Top 3 in the monthly ranking",
      de: "Top 3 in der Monatswertung",
    },
    check: (s) => s.best_monthly_rank !== null && s.best_monthly_rank <= 3,
  },
  {
    code: "centurion",
    emoji: "💯",
    rarity: "legendary",
    name: {
      fr: "Centurion",
      en: "Centurion",
      de: "Hundertjähriger",
    },
    description: {
      fr: "100 pronostics validés (ou plus)",
      en: "100 validated predictions (or more)",
      de: "100 validierte Tipps (oder mehr)",
    },
    check: (s) => s.total_predictions >= 100,
  },
  {
    code: "sniper",
    emoji: "🎯",
    rarity: "legendary",
    name: {
      fr: "Sniper",
      en: "Sniper",
      de: "Scharfschütze",
    },
    description: {
      fr: "10 scores exacts ou plus — la précision ultime",
      en: "10 exact scores or more — ultimate precision",
      de: "10 exakte Ergebnisse oder mehr — ultimative Präzision",
    },
    check: (s) => s.exact_scores >= 10,
  },

  // === RARES ===
  {
    code: "streak-5",
    emoji: "🔥",
    rarity: "rare",
    name: {
      fr: "En feu",
      en: "On Fire",
      de: "On Fire",
    },
    description: {
      fr: "5 bons pronos d'affilée",
      en: "5 correct predictions in a row",
      de: "5 richtige Tipps in Folge",
    },
    check: (s) => s.longest_streak >= 5,
  },
  {
    code: "streak-10",
    emoji: "⚡",
    rarity: "legendary",
    name: {
      fr: "Inarrêtable",
      en: "Unstoppable",
      de: "Unaufhaltbar",
    },
    description: {
      fr: "10 bons pronos d'affilée — légende !",
      en: "10 correct predictions in a row — legend!",
      de: "10 richtige Tipps in Folge — Legende!",
    },
    check: (s) => s.longest_streak >= 10,
  },
  {
    code: "lions-fan",
    emoji: "🦁",
    rarity: "rare",
    name: {
      fr: "Supporter des Lions",
      en: "Lions Supporter",
      de: "Löwen-Fan",
    },
    description: {
      fr: "5 pronos ou plus sur les matchs du Cameroun / CAN",
      en: "5 predictions or more on Cameroon / AFCON matches",
      de: "5 Tipps oder mehr auf Kamerun / Afrika-Cup-Spiele",
    },
    check: (s) => s.cameroon_pronos >= 5,
  },
  {
    code: "premier-pas",
    emoji: "🏆",
    rarity: "rare",
    name: {
      fr: "Premier pas",
      en: "First Steps",
      de: "Erste Schritte",
    },
    description: {
      fr: "Premier pronostic validé",
      en: "First validated prediction",
      de: "Erster validierter Tipp",
    },
    check: (s) => s.total_predictions >= 1,
  },
  {
    code: "regulier",
    emoji: "📅",
    rarity: "rare",
    name: {
      fr: "Régulier",
      en: "Regular",
      de: "Stammgast",
    },
    description: {
      fr: "Pronostiqué sur 7 jours différents",
      en: "Predicted on 7 different days",
      de: "An 7 verschiedenen Tagen getippt",
    },
    check: (s) => s.active_days >= 7,
  },

  // === COMMUNS ===
  {
    code: "debutant",
    emoji: "🌱",
    rarity: "common",
    name: {
      fr: "Débutant",
      en: "Beginner",
      de: "Anfänger",
    },
    description: {
      fr: "Bienvenue ! Ton premier prono est en route",
      en: "Welcome! Your first prediction is on the way",
      de: "Willkommen! Dein erster Tipp ist unterwegs",
    },
    check: () => true, // Toujours décerné à l'inscription (badge d'accueil)
  },
  {
    code: "expert",
    emoji: "⭐",
    rarity: "common",
    name: {
      fr: "Expert",
      en: "Expert",
      de: "Experte",
    },
    description: {
      fr: "20 pronostics validés ou plus",
      en: "20 validated predictions or more",
      de: "20 validierte Tipps oder mehr",
    },
    check: (s) => s.total_predictions >= 20,
  },
];

/** Helper : retrouve la définition d'un badge par code. */
export function getBadgeByCode(code: string): BadgeDef | undefined {
  return BADGES.find((b) => b.code === code);
}

/** Couleur d'un badge (utilisée pour les bordures/fonds). */
export function badgeColor(rarity: BadgeRarity): string {
  switch (rarity) {
    case "legendary":
      return "from-amber-400 via-yellow-500 to-orange-500";
    case "rare":
      return "from-violet-500 via-fuchsia-500 to-pink-500";
    case "common":
      return "from-slate-500 via-slate-400 to-slate-500";
  }
}
