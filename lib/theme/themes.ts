/**
 * 🎨 THÈMES SAISONNIERS + ÉVÉNEMENTS MONDIAUX (FR/EN/DE).
 *
 * Source unique : chaque thème décrit ses couleurs, ambiance, message
 * de bienvenue et décor (particules / pluie / neige / confettis…).
 *
 * 📅 Saison automatique par date (hémisphère Nord) :
 *   - hiver      : 21 déc → 20 mars
 *   - printemps  : 20 mars → 21 juin
 *   - été        : 21 juin → 22 sept
 *   - automne    : 22 sept → 21 déc
 *
 * 🌍 Événements mondiaux calculés localement (aucune API requise) :
 *   Noël, Nouvel An, Saint-Valentin, Pâques (algorithme de Gauss), Ramadan
 *   (~3 jours avant), Eid al-Fitr, Eid al-Adha, Diwali, Halloween,
 *   Thanksgiving (US), Yom Kippour, Hanoucca, fête nationale allemande (3 oct)…
 *
 * 🎁 Priorité : Événement actif > Saison > Défaut
 */

import type { Lang } from "@/lib/i18n";

// ----- Types -----

export interface ThemeVariant {
  /** Identifiant technique */
  id: string;
  /** Libellé court (debug) */
  label: string;
  /** "saison" ou "event" */
  kind: "season" | "event";
  /** Cibles CSS (variables CSS exposées par ThemeProvider) */
  tokens: {
    /** Couleur d'accent — boutons, liens, badges */
    primary: string;
    /** Fond général */
    bg: string;
    /** Surface élevée (cartes) */
    surface: string;
    /** Couleur d'accent secondaire (dégradé, halo) */
    accent: string;
  };
  /** Décor du fond (calque supérieur du layout) */
  decor?: DecorKind;
  /** Message d'accueil affiché au-dessus du contenu (facultatif) */
  greeting?: Record<Lang, string>;
  /** Période d'affichage — pour les events (saisons gérées par la date) */
  window?: { start: string; end: string } | "easter" | "ramadan" | "eid-fitr" | "eid-adha" | "hanoucca" | "yom-kippour" | "thanksgiving" | "diwali";
}

export type DecorKind =
  | "none"
  | "snow"
  | "rain"
  | "leaves"
  | "petals"
  | "sparkles"
  | "confetti"
  | "lights"
  | "stars"
  | "fireworks";

// ----- Catalogue de thèmes -----

export const SEASONAL_THEMES: Record<string, ThemeVariant> = {
  spring: {
    id: "spring",
    label: "Printemps",
    kind: "season",
    tokens: {
      primary: "#f472b6", // rose doux
      bg: "#0c0a14",
      surface: "#1a1422",
      accent: "#a3e635",
    },
    decor: "petals",
    greeting: {
      fr: "🌸 Le printemps est là — une saison pour rêver plus grand.",
      en: "🌸 Spring is here — a season to dream bigger.",
      de: "🌸 Der Frühling ist da — eine Saison, größer zu träumen.",
    },
  },
  summer: {
    id: "summer",
    label: "Été",
    kind: "season",
    tokens: {
      primary: "#fbbf24", // soleil
      bg: "#0c0e1a",
      surface: "#181b2e",
      accent: "#22d3ee",
    },
    decor: "sparkles",
    greeting: {
      fr: "☀️ Été ensoleillé — profite des matchs en plein air.",
      en: "☀️ Sunny summer — enjoy the matches outdoors.",
      de: "☀️ Sonniger Sommer — genieße die Spiele im Freien.",
    },
  },
  autumn: {
    id: "autumn",
    label: "Automne",
    kind: "season",
    tokens: {
      primary: "#f97316", // orange
      bg: "#0e0a08",
      surface: "#1d1612",
      accent: "#dc2626",
    },
    decor: "leaves",
    greeting: {
      fr: "🍂 L'automne, la CAN et la reprise des championnats.",
      en: "🍂 Autumn, football season back in full swing.",
      de: "🍂 Herbst, die Saison der Meisterschaften ist zurück.",
    },
  },
  winter: {
    id: "winter",
    label: "Hiver",
    kind: "season",
    tokens: {
      primary: "#60a5fa", // bleu glace
      bg: "#06080f",
      surface: "#101522",
      accent: "#67e8f9",
    },
    decor: "snow",
    greeting: {
      fr: "❄️ Hiver, Bundesliga, Ligue 1 : le football ne dort jamais.",
      en: "❄️ Winter, Bundesliga, Ligue 1: football never sleeps.",
      de: "❄️ Winter, Bundesliga, Ligue 1: Fußball schläft nie.",
    },
  },
};

export const EVENT_THEMES: Record<string, ThemeVariant> = {
  noel: {
    id: "noel",
    label: "Noël",
    kind: "event",
    window: { start: "12-20", end: "12-26" },
    tokens: {
      primary: "#ef4444", // rouge
      bg: "#0a0a0b",
      surface: "#1a1115",
      accent: "#fbbf24", // doré
    },
    decor: "lights",
    greeting: {
      fr: "🎄 Joyeux Noël à toute la communauté PRONO. Que cette saison soit douce pour toi et tes proches.",
      en: "🎄 Merry Christmas to the whole PRONO community. Wishing you and your loved ones a gentle season.",
      de: "🎄 Frohe Weihnachten für die ganze PRONO-Community. Eine sanfte Zeit für dich und deine Lieben.",
    },
  },
  nouvelAn: {
    id: "nouvelAn",
    label: "Nouvel An",
    kind: "event",
    window: { start: "12-30", end: "01-02" },
    tokens: {
      primary: "#a78bfa",
      bg: "#08060f",
      surface: "#171022",
      accent: "#facc15",
    },
    decor: "fireworks",
    greeting: {
      fr: "🎆 Bonne année ! Que 2026 t'apporte santé, travail et de gros scores sur les paris 💚",
      en: "🎆 Happy New Year! Wishing you 2026 full of health, work and big score wins 💚",
      de: "🎆 Frohes neues Jahr! 2026 voller Gesundheit, Arbeit und großer Tippsiege 💚",
    },
  },
  stValentin: {
    id: "stValentin",
    label: "Saint-Valentin",
    kind: "event",
    window: { start: "02-13", end: "02-15" },
    tokens: {
      primary: "#ec4899",
      bg: "#0e0a10",
      surface: "#1d1217",
      accent: "#fb7185",
    },
    decor: "petals",
    greeting: {
      fr: "💘 En couple ou pas : aujourd'hui, on célèbre toutes les affinités — y compris celles avec ton club.",
      en: "💘 Whether single or not: today we celebrate all affinities — including yours with your club.",
      de: "💘 Single oder nicht: heute feiern wir alle Sympathien — auch die für deinen Verein.",
    },
  },
  halloween: {
    id: "halloween",
    label: "Halloween",
    kind: "event",
    window: { start: "10-30", end: "11-01" },
    tokens: {
      primary: "#f97316",
      bg: "#08070a",
      surface: "#15111c",
      accent: "#a855f7",
    },
    decor: "sparkles",
    greeting: {
      fr: "🎃 Trick or treat ? Une victoire ce soir vaudrait bien un chocolat.",
      en: "🎃 Trick or treat? A win tonight would be worth a chocolate.",
      de: "🎃 Süßes oder Saures? Ein Sieg heute Abend wäre eine Süßigkeit wert.",
    },
  },
  paques: {
    id: "paques",
    label: "Pâques",
    kind: "event",
    window: "easter",
    tokens: {
      primary: "#a3e635",
      bg: "#0a0e08",
      surface: "#151d12",
      accent: "#fbbf24",
    },
    decor: "petals",
    greeting: {
      fr: "🐣 Joyeuses Pâques — chasse aux bons scores comme on chasse aux œufs.",
      en: "🐣 Happy Easter — hunting for big scores like hunting for eggs.",
      de: "🐣 Frohe Ostern — Jagd nach großen Scores wie nach Ostereiern.",
    },
  },
  ramadan: {
    id: "ramadan",
    label: "Ramadan",
    kind: "event",
    window: "ramadan",
    tokens: {
      primary: "#a78bfa",
      bg: "#08070f",
      surface: "#13111e",
      accent: "#f59e0b",
    },
    decor: "stars",
    greeting: {
      fr: "🌙 Ramadan Mubarak à toutes les personnes qui jeûnent. La communauté PRONO est avec vous.",
      en: "🌙 Ramadan Mubarak to everyone fasting. The PRONO community stands with you.",
      de: "🌙 Ramadan Mubarak an alle Fastenden. Die PRONO-Community steht mit euch.",
    },
  },
  eidFitr: {
    id: "eidFitr",
    label: "Eid al-Fitr",
    kind: "event",
    window: "eid-fitr",
    tokens: {
      primary: "#22d3ee",
      bg: "#080b14",
      surface: "#111827",
      accent: "#a78bfa",
    },
    decor: "confetti",
    greeting: {
      fr: "🌙✨ Eid Moubarak à toute la communauté musulmane ! Que ce jour soit doux et joyeux pour vous.",
      en: "🌙✨ Eid Mubarak to all the Muslim community! May this day be gentle and joyful for you.",
      de: "🌙✨ Eid Mubarak an die gesamte muslimische Community! Möge dieser Tag sanft und froh sein.",
    },
  },
  eidAdha: {
    id: "eidAdha",
    label: "Eid al-Adha",
    kind: "event",
    window: "eid-adha",
    tokens: {
      primary: "#10b981",
      bg: "#080b0e",
      surface: "#0f1714",
      accent: "#facc15",
    },
    decor: "confetti",
    greeting: {
      fr: "🐪🐏🌙 Eid al-Adha Moubarak — partage, prières et famille.",
      en: "🐪🐏🌙 Eid al-Adha Mubarak — sharing, prayers and family.",
      de: "🐪🐏🌙 Eid al-Adha Mubarak — Teilen, Gebete und Familie.",
    },
  },
  diwali: {
    id: "diwali",
    label: "Diwali",
    kind: "event",
    window: "diwali",
    tokens: {
      primary: "#fbbf24",
      bg: "#0a0a0b",
      surface: "#171210",
      accent: "#ec4899",
    },
    decor: "lights",
    greeting: {
      fr: "🪔✨ Joyeux Diwali — que la lumière l'emporte, sur le terrain comme dans la vie.",
      en: "🪔✨ Happy Diwali — may light win, on the pitch and in life.",
      de: "🪔✨ Frohes Diwali — Licht soll siegen, auf dem Platz und im Leben.",
    },
  },
  yomKippour: {
    id: "yomKippour",
    label: "Yom Kippour",
    kind: "event",
    window: "yom-kippour",
    tokens: {
      primary: "#94a3b8",
      bg: "#08070a",
      surface: "#13121b",
      accent: "#ffffff",
    },
    decor: "sparkles",
    greeting: {
      fr: "✡️ Gmar Hatima Tova à toute la communauté juive.",
      en: "✡️ Gmar Hatima Tova to the entire Jewish community.",
      de: "✡️ Gmar Hatima Tova an die gesamte jüdische Community.",
    },
  },
  hanoucca: {
    id: "hanoucca",
    label: "Hanoucca",
    kind: "event",
    window: "hanoucca",
    tokens: {
      primary: "#3b82f6",
      bg: "#07080f",
      surface: "#11152a",
      accent: "#fbbf24",
    },
    decor: "lights",
    greeting: {
      fr: "🕎 Joyeuse Hanoucca à toute la communauté juive.",
      en: "🕎 Happy Hanukkah to the entire Jewish community.",
      de: "🕎 Frohe Chanukka an die gesamte jüdische Community.",
    },
  },
  // Fête nationale allemande — neutre, applicable à tous (pas religieux, juste local)
  unityDE: {
    id: "unityDE",
    label: "Jour de l'Unité allemande",
    kind: "event",
    window: { start: "10-03", end: "10-03" },
    tokens: {
      primary: "#fbbf24", // or du drapeau
      bg: "#0a0908",
      surface: "#1a1410",
      accent: "#ef4444", // rouge du drapeau
    },
    decor: "confetti",
    greeting: {
      fr: "🇩🇪 Tag der Deutschen Einheit — courage, convivialité et football.",
      en: "🇩🇪 Day of German Unity — courage, togetherness and football.",
      de: "🇩🇪 Tag der Deutschen Einheit — Mut, Miteinander und Fußball.",
    },
  },
  // Fête nationale Camerounaise
  unityCM: {
    id: "unityCM",
    label: "Fête de l'Unité du Cameroun",
    kind: "event",
    window: { start: "05-20", end: "05-20" },
    tokens: {
      primary: "#10b981", // vert du drapeau
      bg: "#08090a",
      surface: "#0f1612",
      accent: "#ef4444", // rouge
    },
    decor: "confetti",
    greeting: {
      fr: "🇨🇲 Bonne fête de l'Unité aux Camerounais et à toute la diaspora !",
      en: "🇨🇲 Happy Unity Day to Cameroonians and the whole diaspora!",
      de: "🇨🇲 Alles Gute zum Tag der Einheit an alle Kameruner und die Diaspora!",
    },
  },
};

export const DEFAULT_THEME: ThemeVariant = {
  id: "default",
  label: "Par défaut",
  kind: "season",
  tokens: {
    primary: "#10b981", // emerald
    bg: "#0a0a0b",
    surface: "#171717",
    accent: "#34d399",
  },
  decor: "none",
};
