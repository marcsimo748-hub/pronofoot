/**
 * Données PRONO-VOYAGE (MODULE 6) — villes, liens plateformes OFFICIELS
 * (tous vérifiés en direct, zéro scraping, zéro copie d'annonces), guides.
 *
 * ⚖️ LÉGALITÉ : PRONO construit des liens de RECHERCHE vers les sites
 * officiels avec les filtres du joueur. Aucun prix ni horaire n'est copié.
 */

// ---------- Villes de départ (ici) ----------
export interface OriginCity {
  name: string;
  iata: string; // pour Kayak
  slug: string; // pour Trainline / FlixBus
  country: string;
}

export const ORIGINS: OriginCity[] = [
  { name: "Berlin", iata: "BER", slug: "berlin", country: "Allemagne" },
  { name: "Hamburg", iata: "HAM", slug: "hamburg", country: "Allemagne" },
  { name: "Frankfurt am Main", iata: "FRA", slug: "frankfurt", country: "Allemagne" },
  { name: "München", iata: "MUC", slug: "munich", country: "Allemagne" },
  { name: "Köln", iata: "CGN", slug: "cologne", country: "Allemagne" },
  { name: "Düsseldorf", iata: "DUS", slug: "dusseldorf", country: "Allemagne" },
  { name: "Stuttgart", iata: "STR", slug: "stuttgart", country: "Allemagne" },
  { name: "Hannover", iata: "HAJ", slug: "hannover", country: "Allemagne" },
  { name: "Leipzig", iata: "LEJ", slug: "leipzig", country: "Allemagne" },
  { name: "Bruxelles", iata: "BRU", slug: "brussels", country: "Belgique" },
  { name: "Paris", iata: "CDG", slug: "paris", country: "France" },
  { name: "Amsterdam", iata: "AMS", slug: "amsterdam", country: "Pays-Bas" },
];

// ---------- Destinations là-bas (avion) ----------
export interface DestCity {
  name: string;
  iata: string;
  country: string;
}

export const DEST_AFRICA: DestCity[] = [
  { name: "Douala", iata: "DLA", country: "Cameroun" },
  { name: "Yaoundé", iata: "NSI", country: "Cameroun" },
  { name: "Dakar", iata: "DSS", country: "Sénégal" },
  { name: "Abidjan", iata: "ABJ", country: "Côte d'Ivoire" },
  { name: "Accra", iata: "ACC", country: "Ghana" },
  { name: "Lagos", iata: "LOS", country: "Nigéria" },
  { name: "Lomé", iata: "LFW", country: "Togo" },
  { name: "Cotonou", iata: "COO", country: "Bénin" },
  { name: "Kinshasa", iata: "FIH", country: "RD Congo" },
  { name: "Brazzaville", iata: "BZV", country: "Congo" },
  { name: "Libreville", iata: "LBV", country: "Gabon" },
  { name: "Casablanca", iata: "CMN", country: "Maroc" },
  { name: "Alger", iata: "ALG", country: "Algérie" },
  { name: "Tunis", iata: "TUN", country: "Tunisie" },
  { name: "Le Caire", iata: "CAI", country: "Égypte" },
  { name: "Nairobi", iata: "NBO", country: "Kenya" },
];

// ---------- Destinations Europe (train & bus) ----------
export const DEST_EUROPE: DestCity[] = [
  { name: "Paris", iata: "CDG", country: "France" },
  { name: "Bruxelles", iata: "BRU", country: "Belgique" },
  { name: "Amsterdam", iata: "AMS", country: "Pays-Bas" },
  { name: "Londres", iata: "LHR", country: "Royaume-Uni" },
  { name: "Prague", iata: "PRG", country: "Tchéquie" },
  { name: "Varsovie", iata: "WAW", country: "Pologne" },
  { name: "Vienne", iata: "VIE", country: "Autriche" },
  { name: "Milan", iata: "MXP", country: "Italie" },
  { name: "Rome", iata: "FCO", country: "Italie" },
  { name: "Barcelone", iata: "BCN", country: "Espagne" },
  { name: "Madrid", iata: "MAD", country: "Espagne" },
  { name: "Lisbonne", iata: "LIS", country: "Portugal" },
  { name: "Zurich", iata: "ZRH", country: "Suisse" },
  { name: "Copenhague", iata: "CPH", country: "Danemark" },
];

/** Slugs Trainline (noms français vérifiés) et FlixBus (noms anglais vérifiés) */
const TRAINLINE_SLUGS: Record<string, string> = {
  "Berlin": "berlin", "Hamburg": "hamburg", "Frankfurt am Main": "frankfurt", "München": "munich",
  "Köln": "cologne", "Düsseldorf": "dusseldorf", "Stuttgart": "stuttgart", "Hannover": "hannover",
  "Leipzig": "leipzig", "Bruxelles": "brussels", "Paris": "paris", "Amsterdam": "amsterdam",
  "Londres": "londres", "Prague": "prague", "Vienne": "vienne", "Milan": "milan",
  "Barcelone": "barcelone", "Zurich": "zurich",
};

/** Date lisible en français : 2026-10-12 -> 12 octobre 2026 */
export function humanDateFr(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export interface FlightLink {
  name: string;
  emoji: string;
  desc: string;
  url: string;
  official: string;
}

/** Liens de recherche AVION officiels (Kayak + Google Flights, vérifiés) */
export function buildFlightLinks(origin: OriginCity, dest: DestCity, date: string): FlightLink[] {
  const links: FlightLink[] = [];
  if (date) {
    links.push({
      name: "Kayak",
      emoji: "🛫",
      desc: "Comparateur de vols, trie les meilleures offres du jour.",
      url: `https://www.kayak.fr/flights/${origin.iata}-${dest.iata}/${date}`,
      official: "kayak.fr",
    });
  }
  links.push({
    name: "Google Flights",
    emoji: "🌐",
    desc: "Vue calendrier des prix les plus bas, dates flexibles.",
    url: `https://www.google.com/travel/flights?q=${encodeURIComponent(
      `vols de ${origin.name} à ${dest.name}${date ? " le " + humanDateFr(date) : ""}`
    )}`,
    official: "google.com/travel",
  });
  return links;
}

/** Liens TRAIN & BUS officiels (Trainline + FlixBus + BlaBlaCar, vérifiés) */
export function buildGroundLinks(origin: OriginCity, dest: DestCity, date: string): FlightLink[] {
  const links: FlightLink[] = [];
  const to = TRAINLINE_SLUGS[dest.name] ?? dest.name.toLowerCase().replace(/[^a-z-]/g, "");
  if (date) {
    links.push({
      name: "Trainline",
      emoji: "🚆",
      desc: "Trains et bus en Europe, billets officiels au meilleur prix.",
      url: `https://www.trainline.fr/search/${origin.slug}/${to}/${date}`,
      official: "trainline.fr",
    });
  }
  links.push({
    name: "FlixBus",
    emoji: "🚌",
    desc: "Réseau de bus européen, trajets longue distance pas chers.",
    url: `https://global.flixbus.com/bus-routes/bus-${origin.slug}-${
      dest.name === "Köln" ? "cologne" : to
    }`,
    official: "global.flixbus.com",
  });
  return links;
}

/** Lien officiel BlaBlaCar (covoiturage externe) */
export const BLABLACAR_LINK: FlightLink = {
  name: "BlaBlaCar",
  emoji: "🚗",
  desc: "La référence du covoiturage, pour comparer avec les trajets de la communauté.",
  url: "https://www.blablacar.fr/",
  official: "blablacar.fr",
};

// ---------- Guides formalités voyage ----------
export interface VoyageGuide {
  emoji: string;
  title: string;
  body: string[];
}

export const VOYAGE_GUIDES: VoyageGuide[] = [
  {
    emoji: "🛂",
    title: "Passeport et documents",
    body: [
      "Ton passeport doit être valide au moins 6 mois après la date de retour, avec au moins une page vierge. Vérifie-le dès que tu prévois le voyage.",
      "Fais des copies papier et une photo de ton passeport, de ton titre de séjour et de ton billet. Garde une copie séparée des originaux et une autre dans ton téléphone.",
      "Si tu voyages avec des enfants, prévois leurs passeports individuels et, si un parent ne voyage pas, une autorisation de sortie du territoire signée.",
    ],
  },
  {
    emoji: "🧳",
    title: "Douane et bagages",
    body: [
      "Tu peux transporter librement tes effets personnels. Les objets neufs de valeur (électronique, matériel) destinés à être laissés sur place peuvent être soumis à des taxes : garde les factures.",
      "L'argent liquide supérieur à 10 000 € (ou équivalent) doit être déclaré à la douane, à l'aller comme au retour. Les transferts par carte ou service en ligne sont souvent plus sûrs.",
      "Certains produits sont interdits ou réglementés (viande, plantes, médicaments sans ordonnance, espèces protégées). Renseigne-toi avant de faire la valise.",
    ],
  },
  {
    emoji: "💉",
    title: "Santé et vaccins",
    body: [
      "Le vaccin contre la fièvre jaune est exigé ou recommandé selon le pays (une seule dose à vie, à faire au minimum 10 jours avant le départ dans un centre agréé).",
      "Prévois une trousse de première urgence, tes traitements habituels avec ordonnance, et une protection antimoustique selon la destination.",
      "Une assurance voyage rapatriement coûte quelques euros et peut tout changer en cas d'hospitalisation. Souscris-la avant le départ.",
    ],
  },
  {
    emoji: "💶",
    title: "Argent pendant le voyage",
    body: [
      "N'emporte pas tout en espèces : une carte internationale sans frais à l'étranger couvre la plupart des besoins.",
      "Préviens ta banque de ton départ à l'étranger pour éviter les blocages de carte.",
      "Change un petit montant à l'arrivée pour les transports et premiers achats, puis compare les taux sur place plutôt qu'à l'aéroport.",
    ],
  },
  {
    emoji: "📋",
    title: "Checklist avant le départ",
    body: [
      "Passeport valide 6 mois, billet, hébergement confirmé, assurance souscrite.",
      "Copies des documents (papier + téléphone), urgences : ambassade, contacts famille.",
      "Billets bus / train intérieurs réservés si besoin, adaptateur de prise, un peu de monnaie locale.",
    ],
  },
];

/** Raisons de signalement d'un trajet (identiques côté serveur) */
export const TRIP_REPORT_REASONS_CLIENT = [
  "Trajet mensonger ou frauduleux",
  "Arnaque / fraude",
  "Faux profil",
  "Contenu inapproprié",
  "Spam / publicité",
  "Autre",
];

export const VOYAGE_LEGAL_NOTE =
  "⚖️ PRONO ne vend aucun billet et ne copie aucune annonce : les recherches s'ouvrent directement sur les plateformes officielles (Kayak, Google Flights, Trainline, FlixBus, BlaBlaCar) où tu compares et achètes en toute sécurité. Les guides formalités sont indicatifs : vérifie toujours les règles auprès de ton ambassade ou consulat avant de voyager.";
