/**
 * Internationalisation (i18n) — PRONOFOOT.
 *
 * Trois langues : FR (défaut), EN, DE.
 * Le choix de langue est stocké côté navigateur (uiStore, localStorage) et
 * s'applique aux composants clients principaux : en-tête, accueil (Hero,
 * fonctionnalités, à propos) et pied de page.
 *
 * ⚠️ Grâce à skipHydration (uiStore), le premier rendu utilise toujours le
 * français (identique serveur/client) : aucune erreur d'hydratation React.
 * La langue choisie s'applique juste après le montage.
 */

import { useUiStore } from "@/lib/store/uiStore";

export type Lang = "fr" | "en" | "de";

/** Sélecteur de langue (FR / EN / DE) */
export const LANGS: { code: Lang; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

/** Dictionnaire français (langue de référence) */
const fr = {
  // --- Navigation (Header) ---
  "nav.pronos": "Pronos",
  "nav.scores": "Scores",
  "nav.news": "News",
  "nav.music": "Musique",
  "nav.classement": "Classement",
  "nav.job": "Emploi",
  "nav.profile": "Profil",
  "nav.visa": "Visa",
  "nav.housing": "Logement",
  "nav.space": "Mon espace",
  "nav.login": "Connexion",
  "nav.playFree": "Jouer gratuitement",
  "nav.admin": "⚙️ Admin",

  // --- Hero (accueil) ---
  "hero.badge": "⚡ PRONOFOOT — 100% gratuit · propulsé par Leprince Matt",
  "hero.t1": "PRÉDICT.",
  "hero.t2": "COMPÈTE.",
  "hero.t3": "DOMINE.",
  "hero.subtitle":
    "Pronostique les matchs des 19 plus grands clubs européens, suis les scores en direct, écoute ta playlist et chatte avec l'assistant IA — tout-en-un, gratuit pour toujours.",
  "hero.ctaPronos": "Faire mes pronostics",
  "hero.ctaStart": "Commencer gratuitement",
  "hero.ctaScores": "Voir les scores",
  "hero.statPlayers": "joueurs",
  "hero.statMatches": "matchs 2026-27",
  "hero.statTeams": "équipes vedettes",

  // --- Grille des fonctionnalités ---
  "features.titleA": "Tout ce qu'il faut.",
  "features.titleB": "Rien de superflu.",
  "features.sub": "Une plateforme complète pensée pour les passionnés de foot.",
  "features.f1t": "Pronostics football",
  "features.f1d":
    "Score exact, vainqueur ou nul : pronostique les matchs de la Ligue des Champions et des 5 grands championnats. Verrouillage automatique au coup d'envoi.",
  "features.f1g": "5 pts score exact",
  "features.f2t": "Scores live instantanés",
  "features.f2d":
    "Résultats en direct rafraîchis toutes les 90 secondes. Le site lit son cache Supabase, jamais l'API directement.",
  "features.f2g": "maj 90 s",
  "features.f3t": "Actus monde en direct",
  "features.f3d":
    "Un bandeau défilant avec les dernières actualités internationales, mis à jour toutes les 10 minutes.",
  "features.f3g": "10 min",
  "features.f4t": "Lecteur de musique",
  "features.f4d":
    "Playlist intégrée avec lecture aléatoire, répétition et barre de progression. La musique continue pendant que tu navigues !",
  "features.f4g": "global",
  "features.f5t": "Assistant IA",
  "features.f5d":
    "Pose tes questions à l'assistant du site : prochains matchs, barème, scores, navigation. Groq Llama 3.1 + Gemini en secours.",
  "features.f5g": "24/7",
  "features.f6t": "Classements & groupes",
  "features.f6d":
    "Classement général, par championnat, mensuel et entre amis avec des groupes privés à code d'invitation.",
  "features.f6g": "entre amis",

  // --- À propos (texte professionnel) ---
  "about.title": "À propos de",
  "about.p1":
    "PRONOFOOT est une plateforme de pronostics football entièrement gratuite, pensée pour les passionnés du jeu et du ballon rond. Chaque semaine, vous pronostiquez les grands matchs de la Ligue des Champions et des cinq grands championnats européens, puis vous cumulez des points selon la justesse de vos résultats.",
  "about.p2":
    "Le site vous offre des scores en direct, des actualités du football mondial, un lecteur de musique intégré et un assistant intelligent disponible en permanence. Tout est réuni pour vivre la compétition entre amis, du coup d'envoi au coup de sifflet final.",
  "about.p3":
    "Développée par Leprince Matt pour MalihaprodBerlin, la plateforme ne cache aucun frais et aucune surprise. Pas d'abonnement, pas de publicité, pas de données revendues. Vous jouez, vous suivez vos matchs, vous grimpez au classement.",
  "about.p4":
    "Créez votre compte en deux minutes, faites vos premiers pronostics et invitez vos amis à vous défier. Le prochain grand match n'attend que vous.",

  // --- Pied de page ---
  "footer.tagline":
    "Pronostics football, scores live, actualités, musique et assistant IA. 100% gratuit, propulsé par Leprince Matt.",
  "footer.navTitle": "Navigation",
  "footer.linkPronos": "Pronostics",
  "footer.linkScores": "Scores live",
  "footer.linkNews": "Actualités",
  "footer.linkMusic": "Musique",
  "footer.linkRank": "Classements",
  "footer.scoringTitle": "Barème",
  "footer.exact": "Score exact",
  "footer.outcome": "Bon résultat",
  "footer.champion": "Champion",
  "footer.ldc": "LDC",
  "footer.scorer": "Meilleur buteur",
  "footer.madeBy": "Développé par",
  "footer.for": "pour",
};

/** Type imposant les mêmes clés dans toutes les langues */
export type Dict = { [K in keyof typeof fr]: string };

const en: Dict = {
  "nav.pronos": "Predictions",
  "nav.scores": "Scores",
  "nav.news": "News",
  "nav.music": "Music",
  "nav.classement": "Rankings",
  "nav.job": "Jobs",
  "nav.profile": "Profile",
  "nav.visa": "Visa",
  "nav.housing": "Housing",
  "nav.space": "My space",
  "nav.login": "Log in",
  "nav.playFree": "Play for free",
  "nav.admin": "⚙️ Admin",

  "hero.badge": "⚡ PRONOFOOT — 100% free · powered by Leprince Matt",
  "hero.t1": "PREDICT.",
  "hero.t2": "COMPETE.",
  "hero.t3": "DOMINATE.",
  "hero.subtitle":
    "Predict matches of the 19 biggest European clubs, follow live scores, listen to your playlist and chat with the AI assistant. All in one, free forever.",
  "hero.ctaPronos": "Make my predictions",
  "hero.ctaStart": "Start for free",
  "hero.ctaScores": "View scores",
  "hero.statPlayers": "players",
  "hero.statMatches": "matches 2026-27",
  "hero.statTeams": "featured teams",

  "features.titleA": "Everything you need.",
  "features.titleB": "Nothing extra.",
  "features.sub": "A complete platform built for football fans.",
  "features.f1t": "Football predictions",
  "features.f1d":
    "Exact score, winner or draw: predict Champions League and top 5 league matches. Predictions lock automatically at kickoff.",
  "features.f1g": "5 pts exact score",
  "features.f2t": "Instant live scores",
  "features.f2d":
    "Live results refreshed every 90 seconds. The site reads its Supabase cache, never the API directly.",
  "features.f2g": "90 s refresh",
  "features.f3t": "Live world news",
  "features.f3d":
    "A scrolling ticker with the latest international news, updated every 10 minutes.",
  "features.f3g": "10 min",
  "features.f4t": "Music player",
  "features.f4d":
    "Built-in playlist with shuffle, repeat and a progress bar. The music keeps playing while you browse!",
  "features.f4g": "global",
  "features.f5t": "AI assistant",
  "features.f5d":
    "Ask the site assistant anything: upcoming matches, scoring rules, scores, navigation. Groq Llama 3.1 with Gemini as backup.",
  "features.f5g": "24/7",
  "features.f6t": "Rankings & groups",
  "features.f6d":
    "Overall, per-league and monthly rankings, plus private friend groups with invitation codes.",
  "features.f6g": "with friends",

  "about.title": "About",
  "about.p1":
    "PRONOFOOT is a completely free football prediction platform designed for fans of the beautiful game. Every week, you predict the biggest matches of the Champions League and the five major European leagues, then collect points based on the accuracy of your results.",
  "about.p2":
    "The site gives you live scores, world football news, a built-in music player and a smart assistant available around the clock. Everything you need to enjoy the competition with friends, from kickoff to the final whistle.",
  "about.p3":
    "Developed by Leprince Matt for MalihaprodBerlin, the platform has no hidden fees and no surprises. No subscription, no advertising, no data reselling. You play, you follow your matches, you climb the leaderboard.",
  "about.p4":
    "Create your account in two minutes, place your first predictions and challenge your friends. The next big match is waiting for you.",

  "footer.tagline":
    "Football predictions, live scores, news, music and an AI assistant. 100% free, powered by Leprince Matt.",
  "footer.navTitle": "Navigation",
  "footer.linkPronos": "Predictions",
  "footer.linkScores": "Live scores",
  "footer.linkNews": "News",
  "footer.linkMusic": "Music",
  "footer.linkRank": "Rankings",
  "footer.scoringTitle": "Scoring",
  "footer.exact": "Exact score",
  "footer.outcome": "Correct outcome",
  "footer.champion": "Champion",
  "footer.ldc": "UCL",
  "footer.scorer": "Top scorer",
  "footer.madeBy": "Developed by",
  "footer.for": "for",
};

const de: Dict = {
  "nav.pronos": "Tipps",
  "nav.scores": "Scores",
  "nav.news": "News",
  "nav.music": "Musik",
  "nav.classement": "Rangliste",
  "nav.job": "Jobs",
  "nav.profile": "Profil",
  "nav.visa": "Visum",
  "nav.housing": "Wohnen",
  "nav.space": "Mein Bereich",
  "nav.login": "Anmelden",
  "nav.playFree": "Kostenlos spielen",
  "nav.admin": "⚙️ Admin",

  "hero.badge": "⚡ PRONOFOOT — 100% kostenlos · präsentiert von Leprince Matt",
  "hero.t1": "TIPP.",
  "hero.t2": "KÄMPFE.",
  "hero.t3": "DOMINIERE.",
  "hero.subtitle":
    "Tippe die Spiele der 19 größten europäischen Clubs, verfolge Live-Scores, höre deine Playlist und chatte mit dem KI-Assistenten. Alles in einem, für immer kostenlos.",
  "hero.ctaPronos": "Jetzt tippen",
  "hero.ctaStart": "Kostenlos starten",
  "hero.ctaScores": "Scores ansehen",
  "hero.statPlayers": "Spieler",
  "hero.statMatches": "Spiele 2026-27",
  "hero.statTeams": "Top-Clubs",

  "features.titleA": "Alles, was du brauchst.",
  "features.titleB": "Nichts Überflüssiges.",
  "features.sub": "Eine komplette Plattform für Fußball-Fans.",
  "features.f1t": "Fußball-Tipps",
  "features.f1d":
    "Exaktes Ergebnis, Sieger oder Unentschieden: tippe die Spiele der Champions League und der 5 Top-Ligen. Tipps sperren automatisch beim Anpfiff.",
  "features.f1g": "5 Pkt exakt",
  "features.f2t": "Sofortige Live-Scores",
  "features.f2d":
    "Live-Ergebnisse, alle 90 Sekunden aktualisiert. Die Seite liest ihren Supabase-Cache, nie die API direkt.",
  "features.f2g": "90-Sek-Update",
  "features.f3t": "Welt-News live",
  "features.f3d":
    "Ein Laufband mit den neuesten internationalen Nachrichten, alle 10 Minuten aktualisiert.",
  "features.f3g": "10 Min",
  "features.f4t": "Musikplayer",
  "features.f4d":
    "Integrierte Playlist mit Zufallswiedergabe, Wiederholung und Fortschrittsbalken. Die Musik läuft weiter, während du surfst!",
  "features.f4g": "global",
  "features.f5t": "KI-Assistent",
  "features.f5d":
    "Frag den Assistenten der Seite: kommende Spiele, Punktesystem, Scores, Navigation. Groq Llama 3.1, Gemini als Backup.",
  "features.f5g": "24/7",
  "features.f6t": "Rankings & Gruppen",
  "features.f6d":
    "Gesamt-, Liga- und Monatsrankings sowie private Freundesgruppen mit Einladungscodes.",
  "features.f6g": "mit Freunden",

  "about.title": "Über",
  "about.p1":
    "PRONOFOOT ist eine komplett kostenlose Fußball-Tipp-Plattform, gemacht für Fans des schönen Spiels. Jede Woche tippst du die großen Spiele der Champions League und der fünf wichtigsten europäischen Ligen und sammelst Punkte für die Genauigkeit deiner Ergebnisse.",
  "about.p2":
    "Die Seite bietet dir Live-Scores, Fußball-News aus aller Welt, einen integrierten Musikplayer und einen intelligenten Assistenten, der rund um die Uhr verfügbar ist. Alles, was du für den Wettkampf mit Freunden brauchst, vom Anpfiff bis zum Abpfiff.",
  "about.p3":
    "Entwickelt von Leprince Matt für MalihaprodBerlin, ohne versteckte Kosten und ohne Überraschungen. Kein Abo, keine Werbung, keine Weitergabe deiner Daten. Du spielst, du verfolgst deine Spiele, du kletterst im Ranking.",
  "about.p4":
    "Erstelle dein Konto in zwei Minuten, gib deine ersten Tipps und fordere deine Freunde heraus. Das nächste große Spiel wartet auf dich.",

  "footer.tagline":
    "Fußball-Tipps, Live-Scores, News, Musik und ein KI-Assistent. 100% kostenlos, präsentiert von Leprince Matt.",
  "footer.navTitle": "Navigation",
  "footer.linkPronos": "Tipps",
  "footer.linkScores": "Live-Scores",
  "footer.linkNews": "News",
  "footer.linkMusic": "Musik",
  "footer.linkRank": "Rankings",
  "footer.scoringTitle": "Punktesystem",
  "footer.exact": "Exaktes Ergebnis",
  "footer.outcome": "Richtiger Ausgang",
  "footer.champion": "Meister",
  "footer.ldc": "CL",
  "footer.scorer": "Torschützenkönig",
  "footer.madeBy": "Entwickelt von",
  "footer.for": "für",
};

const DICTS: Record<Lang, Dict> = { fr, en, de };

/**
 * Hook d'accès aux traductions (composants clients uniquement).
 * Retourne la langue courante, la fonction t() et le setter de langue.
 */
export function useT(): {
  lang: Lang;
  t: (key: keyof Dict) => string;
  setLang: (lang: Lang) => void;
} {
  const lang = useUiStore((s) => s.lang);
  const setLang = useUiStore((s) => s.setLang);
  return {
    lang,
    t: (key) => DICTS[lang][key] ?? DICTS.fr[key],
    setLang,
  };
}
