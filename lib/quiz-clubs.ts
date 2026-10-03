// lib/quiz-clubs.ts
// =====================================================================
// Quiz viral "Quel club africain es-tu ?" — 7 questions, 17 résultats.
// Évolutif : ajouter un pays = ajouter un objet RESULT. Ajouter une
// question = compléter les 17 teams avec un score.
// =====================================================================

export interface QuizAnswer {
  /** Texte du choix affiché */
  label: string;
  /** emoji ou icône */
  emoji?: string;
  /** Score à ajouter pour chaque équipe (clé = slug pays) */
  scores: Record<string, number>;
}

export interface QuizQuestion {
  id: string;
  /** Question (FR) */
  q: string;
  /** 4 choix */
  answers: QuizAnswer[];
}

export interface QuizResult {
  /** Clé = country.slug d'AFRICA_FEATURED_TEAMS */
  slug: string;
  /** Description longue du résultat (FR) */
  description: string;
  /** Couleur affichée (de AFRICA_FEATURED_TEAMS.color) */
  color: string;
  /** Drapeau emoji */
  flag: string;
  /** Nom du pays */
  name: string;
  /** Emoji/texte signature */
  signature: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "vibe",
    q: "🎉 Un vendredi soir entre potes, tu choisis quoi ?",
    answers: [
      { label: "Soirée dansante jusqu'à l'aube", emoji: "💃", scores: { cameroun: 2, cote_divo: 2, senegal: 1, nigeria: 1 } },
      { label: "Grillades & discussion foot", emoji: "🍖", scores: { senegal: 2, mali: 2, burkina_faso: 1, guinee: 1 } },
      { label: "Thé à la menthe + calme", emoji: "🍵", scores: { maroc: 2, algerie: 2, tunisie: 2, egypte: 1 } },
      { label: "Café très fort + analyse tactique", emoji: "☕", scores: { egypte: 2, ghana: 2, nigeria: 1, rdc: 1 } },
    ],
  },
  {
    id: "play",
    q: "⚽ Ton poste sur le terrain ?",
    answers: [
      { label: "Gardien (le dernier rempart)", emoji: "🧤", scores: { cameroun: 2, ghana: 1, maroc: 1, burkina_faso: 1 } },
      { label: "Défenseur (costaud, solide)", emoji: "🛡️", scores: { senegal: 2, mali: 2, cote_divo: 1, gabon: 1 } },
      { label: "Milieu (le moteur)", emoji: "⚙️", scores: { nigeria: 2, ghana: 2, algerie: 1, cameroun: 1 } },
      { label: "Attaquant (buteur, dribbleur)", emoji: "🚀", scores: { egypte: 2, maroc: 2, cote_divo: 2, senegal: 1 } },
    ],
  },
  {
    id: "food",
    q: "🍲 Le plat qui te fait vibrer ?",
    answers: [
      { label: "Ndolè + plantain (Cameroun)", emoji: "🍌", scores: { cameroun: 3, gabon: 1, rdc: 1 } },
      { label: "Thieboudienne (Sénégal)", emoji: "🍚", scores: { senegal: 3, guinee: 1, mali: 1 } },
      { label: "Tagine (Maroc)", emoji: "🥘", scores: { maroc: 3, algerie: 1, tunisie: 1 } },
      { label: "Jollof rice (Nigeria/Ghana)", emoji: "🌶️", scores: { nigeria: 2, ghana: 2, cote_divo: 1, cameroun: 1 } },
    ],
  },
  {
    id: "music",
    q: "🎶 Ta playlist pour driver ?",
    answers: [
      { label: "Makossa / Bikutsi", emoji: "🥁", scores: { cameroun: 3, gabon: 1, rdc: 1 } },
      { label: "Mbalax / Youssou Ndour", emoji: "🎤", scores: { senegal: 3, mali: 1, guinee: 1 } },
      { label: "Raï / Chaabi", emoji: "🪕", scores: { algerie: 2, maroc: 2, tunisie: 2, egypte: 1 } },
      { label: "Afrobeats / Afro-house", emoji: "🎧", scores: { nigeria: 3, ghana: 2, cote_divo: 1, cap_vert: 1 } },
    ],
  },
  {
    id: "spirit",
    q: "💪 Ta plus grande qualité ?",
    answers: [
      { label: "Résilience face aux défis", emoji: "🦁", scores: { cameroun: 2, senegal: 2, burkina_faso: 2, mali: 1 } },
      { label: "Créativité et improvisation", emoji: "🎨", scores: { nigeria: 2, ghana: 2, rdc: 2, cote_divo: 1 } },
      { label: "Fierté et panache", emoji: "👑", scores: { maroc: 2, algerie: 2, egypte: 2, tunisie: 1 } },
      { label: "Solidarité et équipe", emoji: "🤝", scores: { senegal: 1, cameroun: 1, mali: 2, guinee: 2, gabon: 1 } },
    ],
  },
  {
    id: "match",
    q: "🏆 Le match qui t'a marqué ?",
    answers: [
      { label: "Cameroun vs Argentine (Italia 90)", emoji: "⭐", scores: { cameroun: 3, senegal: 1, nigeria: 1 } },
      { label: "Sénégal vs France (2002)", emoji: "⚡", scores: { senegal: 3, mali: 1, cote_divo: 1, cameroun: 1 } },
      { label: "Maroc vs Portugal (2022)", emoji: "🌍", scores: { maroc: 3, egypte: 1, senegal: 1, algerie: 1 } },
      { label: "CIV vs Séance tab (2006 finale)", emoji: "🐘", scores: { cote_divo: 3, cameroun: 1, ghana: 1, mali: 1 } },
    ],
  },
  {
    id: "future",
    q: "🚀 Ton objectif diaspora ?",
    answers: [
      { label: "Faire briller mon pays en Europe", emoji: "✈️", scores: { senegal: 2, maroc: 2, nigeria: 2, cameroun: 1, mali: 1 } },
      { label: "Construire un business familial", emoji: "🏪", scores: { cameroun: 2, cote_divo: 2, rdc: 2, gabon: 1, burkina_faso: 1 } },
      { label: "Études + carrière internationale", emoji: "🎓", scores: { ghana: 2, egypte: 2, kenya: 3, cameroun: 1, tunisie: 1 } },
      { label: "Communauté + entraide diaspora", emoji: "🤲", scores: { burkina_faso: 2, mali: 2, guinee: 2, cameroun: 1, senegal: 1 } },
    ],
  },
];

/** Résultats : un par pays africain majeur (17) */
export const QUIZ_RESULTS: QuizResult[] = [
  {
    slug: "cameroun",
    name: "Cameroun",
    flag: "🇨🇲",
    color: "#007a5e",
    description: "Tu es le **Lions Indomptables** 🦁 : résilient, stratège, et tu ne lâches jamais. Comme Samuel Eto'o ou Rigobert Song, tu marques l'histoire avec panache.",
    signature: "🦁 Lions Indomptables",
  },
  {
    slug: "senegal",
    name: "Sénégal",
    flag: "🇸🇳",
    color: "#00853f",
    description: "Tu es la **Téranga** 🦁🇸🇳 : chaleureux, talentueux, tu portes toute une nation sur le terrain. Sadio Mané ? C'est toi, en plus discret.",
    signature: "🦁🇸🇳 Lions de la Téranga",
  },
  {
    slug: "maroc",
    name: "Maroc",
    flag: "🇲🇦",
    color: "#c1272d",
    description: "Tu es l'**Atlas Lion** 🦁🏔️ : fier, discipliné, tu défends tes valeurs. Avec Hakimi et Ziyech, tu portes le Maroc au sommet du monde.",
    signature: "🦁🏔️ Lions de l'Atlas",
  },
  {
    slug: "nigeria",
    name: "Nigeria",
    flag: "🇳🇬",
    color: "#008751",
    description: "Tu es le **Super Eagle** 🦅 : charismatique, tu dynamites tout sur ton passage. Vitesse, technique, charisme — Victor Osimhen est ton jumeau.",
    signature: "🦅 Super Eagles",
  },
  {
    slug: "cote_divoire",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    color: "#f77f00",
    description: "Tu es l'**Éléphant** 🐘 : imposant, créatif, tu fais la différence aux moments clés. Didier Drogba, c'était déjà toi en patron.",
    signature: "🐘 Les Éléphants",
  },
  {
    slug: "egypte",
    name: "Égypte",
    flag: "🇪🇬",
    color: "#ce1126",
    description: "Tu es le **Pharaon** 👑 : stratège, légendaire, tu règnes sur le terrain avec autorité. Mohamed Salah te ressemble : la classe absolue.",
    signature: "👑 Les Pharaons",
  },
  {
    slug: "ghana",
    name: "Ghana",
    flag: "🇬🇭",
    color: "#fcd116",
    description: "Tu es la **Black Star** ⭐ : étincelant, tu brilles dans les grands rendez-vous. Comme Asamoah Gyan, tu marques les esprits.",
    signature: "⭐ Black Stars",
  },
  {
    slug: "algerie",
    name: "Algérie",
    flag: "🇩🇿",
    color: "#006633",
    description: "Tu es le **Fennec** 🦊 : rusé, endurant, tu domptes le désert comme Riyad Mahrez dompte les défenses.",
    signature: "🦊 Les Fennecs",
  },
  {
    slug: "tunisie",
    name: "Tunisie",
    flag: "🇹🇳",
    color: "#e70013",
    description: "Tu es l'**Aigle de Carthage** 🦅 : historique, tu portes les ruines de Carthage en bandoulière. Honorable, combatif.",
    signature: "🦅 Aigles de Carthage",
  },
  {
    slug: "mali",
    name: "Mali",
    flag: "🇲🇱",
    color: "#14b55a",
    description: "Tu es l'**Aigle** 🦅 du Sahel : fier, endurant, tu portes les couleurs du Mali empire.",
    signature: "🦅 Les Aigles",
  },
  {
    slug: "burkina_faso",
    name: "Burkina Faso",
    flag: "🇧🇫",
    color: "#ef2b2d",
    description: "Tu es l'**Étalon** 🐎 : noble, tenace, tu charges comme un vrai étalon. Le cœur solide du continent.",
    signature: "🐎 Les Étalons",
  },
  {
    slug: "guinee",
    name: "Guinée",
    flag: "🇬🇳",
    color: "#ce1126",
    description: "Tu es le **Syli National** 🐘 : national, combatif, tu portes tout un peuple sur tes épaules.",
    signature: "🐘 Syli National",
  },
  {
    slug: "rdc",
    name: "RD Congo",
    flag: "🇨🇩",
    color: "#007fff",
    description: "Tu es le **Léopard** 🐆 : agile, imprévisible, tu surgis de nulle part. Comme Yannick Bolasie, tu électrises le terrain.",
    signature: "🐆 Les Léopards",
  },
  {
    slug: "gabon",
    name: "Gabon",
    flag: "🇬🇦",
    color: "#009e60",
    description: "Tu es la **Panthère** 🐆 : discrète mais redoutable, tu frappes quand on t'attend le moins. Aubameyang te ressemble.",
    signature: "🐆 Les Panthères",
  },
  {
    slug: "cap_vert",
    name: "Cap-Vert",
    flag: "🇨🇻",
    color: "#003893",
    description: "Tu es les **Requins Bleus** 🦈 : rare, talentueux, tu brilles dans les grands océans. Petit pays mais grands rêves.",
    signature: "🦈 Requins Bleus",
  },
  {
    slug: "kenya",
    name: "Kenya",
    flag: "🇰🇪",
    color: "#bb0000",
    description: "Tu es la **Star** ⭐ du marathon africain : endurant, rapide, tu ne t'arrêtes jamais. Le Kenya, c'est ton terrain de jeu.",
    signature: "⭐⭐ Les Stars",
  },
  {
    slug: "ouganda",
    name: "Ouganda",
    flag: "🇺🇬",
    color: "#fcdc04",
    description: "Tu es la **Grue** 🦢 : gracieux, élégant, tu survoles le terrain avec classe. Toujours en hauteur.",
    signature: "🦢 Les Grues",
  },
];

/** Calcule le score total par pays à partir des réponses */
export function computeQuizScores(answers: string[]): Record<string, number> {
  // answers[i] = index de la réponse choisie pour la question i
  const scores: Record<string, number> = {};
  for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
    const idx = parseInt(answers[i] ?? "0", 10);
    const ans = QUIZ_QUESTIONS[i].answers[idx];
    if (!ans) continue;
    for (const [slug, pts] of Object.entries(ans.scores)) {
      scores[slug] = (scores[slug] ?? 0) + pts;
    }
  }
  return scores;
}

/** Trouve le top résultat (slug du pays qui a le score max) */
export function getTopResult(scores: Record<string, number>): QuizResult {
  let bestSlug = "cameroun";
  let bestScore = -1;
  for (const r of QUIZ_RESULTS) {
    const s = scores[r.slug] ?? 0;
    if (s > bestScore) {
      bestScore = s;
      bestSlug = r.slug;
    }
  }
  return QUIZ_RESULTS.find((r) => r.slug === bestSlug) ?? QUIZ_RESULTS[0];
}

/** Trouve le top 3 (pour partage) */
export function getTopThree(scores: Record<string, number>): QuizResult[] {
  return [...QUIZ_RESULTS]
    .map((r) => ({ r, s: scores[r.slug] ?? 0 }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.r);
}