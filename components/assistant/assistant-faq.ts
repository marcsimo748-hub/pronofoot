/**
 * Assistant PRONO — base de connaissances (FR/EN/DE).
 * Réponses courtes, orientées visiteur, avec lien vers la bonne page.
 * La recherche matche les mots-clés de TOUTES les langues : la réponse
 * s'affiche dans la langue choisie par le visiteur.
 */

export interface FaqEntry {
  id: string;
  kw: string[];              // mots-clés (toutes langues, sans accents)
  q: { fr: string; en: string; de: string };
  a: { fr: string; en: string; de: string };
  link?: { href: string; label: { fr: string; en: string; de: string } };
}

export const FAQ: FaqEntry[] = [
  {
    id: "publier",
    kw: ["publier", "annonce", "poster", "vendre", "post", "ad", "anzeigen", "verkaufen", "sale"],
    q: { fr: "Comment publier une annonce ?", en: "How do I post an ad?", de: "Wie erstelle ich eine Anzeige?" },
    a: {
      fr: "Va dans PRONO Annonces et clique « Publier une annonce ». Choisis ta catégorie, ajoute des photos, ton prix, ta ville et ton quartier. C'est gratuit et sans commission. Il faut juste être connecté.",
      en: "Go to PRONO Annonces and click \"Post an ad\". Pick your category, add photos, your price, your city and neighborhood. It's free with no commission. You just need to be logged in.",
      de: "Gehe zu PRONO Anzeigen und klicke auf „Anzeige erstellen“. Wähle die Kategorie, füge Fotos, Preis, Stadt und Viertel hinzu. Kostenlos und ohne Provision. Du musst nur eingeloggt sein.",
    },
    link: { href: "/prono-annonces?publier=1", label: { fr: "Publier maintenant", en: "Post now", de: "Jetzt erstellen" } },
  },
  {
    id: "boutique",
    kw: ["boutique", "shop", "magasin", "store", "creer", "create", "erstellen", "theme", "marque"],
    q: { fr: "Comment créer ma boutique ?", en: "How do I create my shop?", de: "Wie erstelle ich meinen Shop?" },
    a: {
      fr: "Sur la page Boutiques, clique « Créer ma boutique » : choisis ton thème parmi 6 designs, ta photo, ton nom. Tes annonces de services et d'articles y apparaissent automatiquement.",
      en: "On the Shops page, click \"Create my shop\": pick one of 6 themes, your photo, your name. Your service and item ads appear there automatically.",
      de: "Auf der Shop-Seite: „Shop erstellen“ anklicken, eines von 6 Designs wählen, Foto und Name. Deine Service- und Artikelanzeigen erscheinen dort automatisch.",
    },
    link: { href: "/boutiques", label: { fr: "Voir les boutiques", en: "See the shops", de: "Shops ansehen" } },
  },
  {
    id: "gratuit",
    kw: ["gratuit", "prix", "cout", "combien", "frais", "free", "cost", "price", "kosten", "teuer", "commission"],
    q: { fr: "Est-ce que c'est vraiment gratuit ?", en: "Is it really free?", de: "Ist es wirklich kostenlos?" },
    a: {
      fr: "Oui : publier des annonces, créer ta boutique, jouer aux pronos et utiliser les modules (emploi, logement, voyage…) est 100% gratuit, sans commission. Le site vit grâce aux soutiens volontaires et aux partenaires.",
      en: "Yes: posting ads, creating your shop, playing predictions and using the modules (jobs, housing, travel…) is 100% free, no commission. The site lives thanks to voluntary support and partners.",
      de: "Ja: Anzeigen, Shop, Tippspiel und die Module (Job, Wohnen, Reisen…) sind 100% kostenlos, ohne Provision. Die Seite lebt von freiwilliger Unterstützung und Partnern.",
    },
    link: { href: "/soutenir", label: { fr: "Soutenir le site", en: "Support the site", de: "Die Seite unterstützen" } },
  },
  {
    id: "trouver",
    kw: ["trouver", "proche", "quartier", "code postal", "plz", "near", "nearby", "search", "recherche", "finden", "nah"],
    q: { fr: "Comment trouver un service près de moi ?", en: "How do I find a service near me?", de: "Wie finde ich einen Service in meiner Nähe?" },
    a: {
      fr: "Dans PRONO Annonces, tape ta ville, ton quartier ou ton code postal (ex. 13347) dans la recherche. Tu peux aussi filtrer par catégorie : coiffure, déménagement, DJ, chauffeur, garde d'enfants…",
      en: "In PRONO Annonces, type your city, neighborhood or postal code (e.g. 13347) in the search bar. You can also filter by category: hair, moving, DJ, driver, childcare…",
      de: "In PRONO Anzeigen: Stadt, Viertel oder PLZ (z. B. 13347) in die Suche eingeben. Filter auch nach Kategorie: Frisör, Umzug, DJ, Fahrer, Kinderbetreuung…",
    },
    link: { href: "/prono-annonces", label: { fr: "Chercher maintenant", en: "Search now", de: "Jetzt suchen" } },
  },
  {
    id: "prono",
    kw: ["prono", "pronostic", "paris", "jeu", "points", "score", "prediction", "game", "tippspiel", "wetten", "match"],
    q: { fr: "Comment jouer aux pronos ?", en: "How do I play predictions?", de: "Wie spiele ich das Tippspiel?" },
    a: {
      fr: "Crée ton compte (2 minutes), puis fais tes pronostics sur les 6 grands championnats. Score exact : 5 points, bon résultat : 3 points. C'est un jeu à points 100% gratuit, jamais d'argent en jeu.",
      en: "Create your account (2 minutes), then predict the 6 major leagues. Exact score: 5 points, correct outcome: 3 points. It's a 100% free points game, never money.",
      de: "Konto erstellen (2 Minuten), dann die 6 großen Ligen tippen. Exaktes Ergebnis: 5 Punkte, richtige Tendenz: 3 Punkte. Ein 100% kostenloses Punktespiel, nie Geld.",
    },
    link: { href: "/pronos", label: { fr: "Faire mes pronos", en: "Make predictions", de: "Jetzt tippen" } },
  },
  {
    id: "premium",
    kw: ["premium", "abonnement", "subscription", "upgrade", "stats"],
    q: { fr: "Qu'est-ce que le Premium ?", en: "What is Premium?", de: "Was ist Premium?" },
    a: {
      fr: "Le Premium (4,99 € pour 30 jours, paiement unique sans abonnement) débloque des statistiques et du confort en plus. Il ne donne AUCUN avantage dans le jeu : le classement reste équitable pour tous.",
      en: "Premium (€4.99 for 30 days, one-time payment, no subscription) unlocks extra stats and comfort. It gives NO in-game advantage: the ranking stays fair for everyone.",
      de: "Premium (4,99 € für 30 Tage, Einmalzahlung ohne Abo) schaltet zusätzliche Statistiken frei. Kein Vorteil im Spiel: die Rangliste bleibt fair.",
    },
    link: { href: "/tarifs", label: { fr: "Voir le Premium", en: "See Premium", de: "Premium ansehen" } },
  },
  {
    id: "transfert",
    kw: ["transfert", "argent", "envoyer", "afrique", "money", "send", "transfer", "uberweisen", "geld", "cameroun"],
    q: { fr: "Comment envoyer de l'argent en Afrique ?", en: "How do I send money to Africa?", de: "Wie sende ich Geld nach Afrika?" },
    a: {
      fr: "PRONO compare les services légaux (Taptap Send, Sendwave, Western Union…) sur la page Transferts. PRONO ne transfère jamais d'argent : l'envoi passe toujours par un prestataire agréé.",
      en: "PRONO compares legal services (Taptap Send, Sendwave, Western Union…) on the Transfers page. PRONO never transfers money: sending always goes through a licensed provider.",
      de: "PRONO vergleicht legale Dienste (Taptap Send, Sendwave, Western Union…) auf der Transfers-Seite. PRONO überweist nie selbst Geld.",
    },
    link: { href: "/prono-transferts", label: { fr: "Comparer les transferts", en: "Compare transfers", de: "Transfers vergleichen" } },
  },
  {
    id: "envoi",
    kw: ["dedouanement", "douane", "customs", "zoll", "voiture", "car", "auto", "container", "livraison"],
    q: { fr: "Envoi de voiture vers l'Afrique, comment ça marche ?", en: "Shipping a car to Africa, how does it work?", de: "Auto nach Afrika verschiffen, wie geht das?" },
    a: {
      fr: "Dans une annonce voiture, le vendeur indique s'il aide à l'envoi vers l'Afrique et qui s'occupe du dédouanement (lui ou l'acheteur). Cette info s'affiche clairement sur l'annonce pour éviter les malentendus.",
      en: "In a car ad, the seller indicates whether they help with shipping to Africa and who handles customs (seller or buyer). This info is clearly shown on the ad to avoid misunderstandings.",
      de: "In einer Autoanzeige gibt der Verkäufer an, ob er beim Versand hilft und wer den Zoll übernimmt. Diese Info steht klar in der Anzeige.",
    },
    link: { href: "/prono-annonces?cat=voitures", label: { fr: "Voir les voitures", en: "See cars", de: "Autos ansehen" } },
  },
  {
    id: "securite",
    kw: ["securite", "arnaque", "confiance", "safe", "scam", "security", "sicher", "betrug", "fraude"],
    q: { fr: "Est-ce que le site est sécurisé ?", en: "Is the site safe?", de: "Ist die Seite sicher?" },
    a: {
      fr: "Oui : les annonces sont modérées, 3 signalements masquent une annonce automatiquement, et le site ne touche jamais d'argent (aucun paiement entre membres sur le site). Rencontrez toujours en lieu public et signalez tout souci.",
      en: "Yes: ads are moderated, 3 reports auto-hide an ad, and the site never handles money (no member-to-member payments on the site). Always meet in public and report any issue.",
      de: "Ja: Anzeigen werden moderiert, 3 Meldungen blenden eine Anzeige automatisch aus, und die Seite verwaltet nie Geld. Triff dich immer öffentlich und melde Probleme.",
    },
  },
  {
    id: "emploi",
    kw: ["emploi", "job", "travail", "work", "stellen", "arbeit", "jobs"],
    q: { fr: "Comment chercher un emploi ?", en: "How do I search for jobs?", de: "Wie suche ich Jobs?" },
    a: {
      fr: "Le module PRONO Job regroupe des offres d'emploi actualisées automatiquement en Allemagne. Filtre par ville et type de poste.",
      en: "The PRONO Job module gathers job offers updated automatically across Germany. Filter by city and role.",
      de: "Das Modul PRONO Job sammelt automatisch aktualisierte Stellenangebote in Deutschland. Nach Stadt und Rolle filtern.",
    },
    link: { href: "/prono-job", label: { fr: "Voir les offres", en: "See offers", de: "Angebote ansehen" } },
  },
  {
    id: "contact",
    kw: ["contact", "contacter", "whatsapp", "email", "telephone", "phone", "kontakt", "help", "aide", "hilfe"],
    q: { fr: "Comment contacter l'équipe ?", en: "How do I contact the team?", de: "Wie kontaktiere ich das Team?" },
    a: {
      fr: "Par WhatsApp ou Telegram (messages uniquement) au +49 1575 4169524, ou par email : marcsimo748@gmail.com. Réponse rapide, en français.",
      en: "Via WhatsApp or Telegram (messages only) at +49 1575 4169524, or by email: marcsimo748@gmail.com. Fast reply.",
      de: "Per WhatsApp oder Telegram (nur Nachrichten) unter +49 1575 4169524 oder per E-Mail: marcsimo748@gmail.com.",
    },
  },
  {
    id: "langue",
    kw: ["langue", "language", "englisch", "sprache", "english", "deutsch", "traduction", "translate"],
    q: { fr: "Le site est disponible en quelles langues ?", en: "Which languages is the site available in?", de: "In welchen Sprachen gibt es die Seite?" },
    a: {
      fr: "Français, anglais et allemand : change de langue avec le sélecteur FR / EN / DE en haut du site. Les annonces et boutiques suivent la langue choisie.",
      en: "French, English and German: switch with the FR / EN / DE selector at the top of the site. Ads and shops follow the chosen language.",
      de: "Französisch, Englisch und Deutsch: umschalten mit FR / EN / DE oben auf der Seite. Anzeigen und Shops folgen der Sprache.",
    },
  },
];

/** Message d'accueil de l'assistant */
export const ASSISTANT_INTRO = {
  fr: "Salut 👋 Je suis l'assistant PRONO. Pose ta question ou choisis en dessous : je réponds en quelques secondes.",
  en: "Hi 👋 I'm the PRONO assistant. Ask your question or pick one below: I answer in seconds.",
  de: "Hallo 👋 Ich bin der PRONO-Assistent. Stelle deine Frage oder wähle unten: ich antworte in Sekunden.",
};

export const ASSISTANT_FALLBACK = {
  fr: "Je n'ai pas encore la réponse à cette question. Écris-nous directement sur WhatsApp (+49 1575 4169524) et un humain te répondra vite ! En attendant, voici les pages utiles :",
  en: "I don't have the answer to this one yet. Message us directly on WhatsApp (+49 1575 4169524) and a human will reply fast! Meanwhile, here are useful pages:",
  de: "Darauf habe ich noch keine Antwort. Schreib uns direkt auf WhatsApp (+49 1575 4169524)! Hier sind nützliche Seiten:",
};

export const ASSISTANT_SUGGESTIONS = ["publier", "boutique", "trouver", "gratuit", "transfert", "premium"];

/** Normalise un texte : minuscules, sans accents */
export function normTxt(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
