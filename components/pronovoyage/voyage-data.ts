/**
 * Données PRONO-VOYAGE (MODULE 6) — villes, liens plateformes OFFICIELS
 * (tous vérifiés en direct, zéro scraping, zéro copie d'annonces), guides.
 *
 * ⚖️ LÉGALITÉ : PRONO construit des liens de RECHERCHE vers les sites
 * officiels avec les filtres du joueur. Aucun prix ni horaire n'est copié.
 *
 * 🌍 Trilingue : noms de villes + guides traduits via getVoyageGuides(lang).
 */

import type { Lang } from "@/lib/i18n";

// ---------- Villes de départ (ici) ----------
export interface OriginCity {
  /** Identifiant technique (stable pour les URLs) */
  key: string;
  /** Nom français (affichage par défaut) */
  nameFr: string;
  /** Libellé par langue */
  labels: { fr: string; en: string; de: string };
  iata: string;
  slug: string;
  country: { fr: string; en: string; de: string };
}

export const ORIGINS: OriginCity[] = [
  { key: "berlin", nameFr: "Berlin", labels: { fr: "Berlin", en: "Berlin", de: "Berlin" }, iata: "BER", slug: "berlin", country: { fr: "Allemagne", en: "Germany", de: "Deutschland" } },
  { key: "hamburg", nameFr: "Hamburg", labels: { fr: "Hamburg", en: "Hamburg", de: "Hamburg" }, iata: "HAM", slug: "hamburg", country: { fr: "Allemagne", en: "Germany", de: "Deutschland" } },
  { key: "frankfurt", nameFr: "Frankfurt am Main", labels: { fr: "Francfort-sur-le-Main", en: "Frankfurt am Main", de: "Frankfurt am Main" }, iata: "FRA", slug: "frankfurt", country: { fr: "Allemagne", en: "Germany", de: "Deutschland" } },
  { key: "munich", nameFr: "München", labels: { fr: "Munich", en: "Munich", de: "München" }, iata: "MUC", slug: "munich", country: { fr: "Allemagne", en: "Germany", de: "Deutschland" } },
  { key: "cologne", nameFr: "Köln", labels: { fr: "Cologne", en: "Cologne", de: "Köln" }, iata: "CGN", slug: "cologne", country: { fr: "Allemagne", en: "Germany", de: "Deutschland" } },
  { key: "dusseldorf", nameFr: "Düsseldorf", labels: { fr: "Düsseldorf", en: "Düsseldorf", de: "Düsseldorf" }, iata: "DUS", slug: "dusseldorf", country: { fr: "Allemagne", en: "Germany", de: "Deutschland" } },
  { key: "stuttgart", nameFr: "Stuttgart", labels: { fr: "Stuttgart", en: "Stuttgart", de: "Stuttgart" }, iata: "STR", slug: "stuttgart", country: { fr: "Allemagne", en: "Germany", de: "Deutschland" } },
  { key: "hannover", nameFr: "Hannover", labels: { fr: "Hanovre", en: "Hanover", de: "Hannover" }, iata: "HAJ", slug: "hannover", country: { fr: "Allemagne", en: "Germany", de: "Deutschland" } },
  { key: "leipzig", nameFr: "Leipzig", labels: { fr: "Leipzig", en: "Leipzig", de: "Leipzig" }, iata: "LEJ", slug: "leipzig", country: { fr: "Allemagne", en: "Germany", de: "Deutschland" } },
  { key: "brussels", nameFr: "Bruxelles", labels: { fr: "Bruxelles", en: "Brussels", de: "Brüssel" }, iata: "BRU", slug: "brussels", country: { fr: "Belgique", en: "Belgium", de: "Belgien" } },
  { key: "paris", nameFr: "Paris", labels: { fr: "Paris", en: "Paris", de: "Paris" }, iata: "CDG", slug: "paris", country: { fr: "France", en: "France", de: "Frankreich" } },
  { key: "amsterdam", nameFr: "Amsterdam", labels: { fr: "Amsterdam", en: "Amsterdam", de: "Amsterdam" }, iata: "AMS", slug: "amsterdam", country: { fr: "Pays-Bas", en: "Netherlands", de: "Niederlande" } },
];

// ---------- Destinations là-bas (avion) ----------
export interface DestCity {
  key: string;
  nameFr: string;
  labels: { fr: string; en: string; de: string };
  iata: string;
  country: { fr: string; en: string; de: string };
}

export const DEST_AFRICA: DestCity[] = [
  { key: "douala", nameFr: "Douala", labels: { fr: "Douala", en: "Douala", de: "Douala" }, iata: "DLA", country: { fr: "Cameroun", en: "Cameroon", de: "Kamerun" } },
  { key: "yaounde", nameFr: "Yaoundé", labels: { fr: "Yaoundé", en: "Yaoundé", de: "Yaoundé" }, iata: "NSI", country: { fr: "Cameroun", en: "Cameroon", de: "Kamerun" } },
  { key: "dakar", nameFr: "Dakar", labels: { fr: "Dakar", en: "Dakar", de: "Dakar" }, iata: "DSS", country: { fr: "Sénégal", en: "Senegal", de: "Senegal" } },
  { key: "abidjan", nameFr: "Abidjan", labels: { fr: "Abidjan", en: "Abidjan", de: "Abidjan" }, iata: "ABJ", country: { fr: "Côte d'Ivoire", en: "Côte d'Ivoire", de: "Elfenbeinküste" } },
  { key: "accra", nameFr: "Accra", labels: { fr: "Accra", en: "Accra", de: "Accra" }, iata: "ACC", country: { fr: "Ghana", en: "Ghana", de: "Ghana" } },
  { key: "lagos", nameFr: "Lagos", labels: { fr: "Lagos", en: "Lagos", de: "Lagos" }, iata: "LOS", country: { fr: "Nigéria", en: "Nigeria", de: "Nigeria" } },
  { key: "lome", nameFr: "Lomé", labels: { fr: "Lomé", en: "Lomé", de: "Lomé" }, iata: "LFW", country: { fr: "Togo", en: "Togo", de: "Togo" } },
  { key: "cotonou", nameFr: "Cotonou", labels: { fr: "Cotonou", en: "Cotonou", de: "Cotonou" }, iata: "COO", country: { fr: "Bénin", en: "Benin", de: "Benin" } },
  { key: "kinshasa", nameFr: "Kinshasa", labels: { fr: "Kinshasa", en: "Kinshasa", de: "Kinshasa" }, iata: "FIH", country: { fr: "RD Congo", en: "DR Congo", de: "DR Kongo" } },
  { key: "brazzaville", nameFr: "Brazzaville", labels: { fr: "Brazzaville", en: "Brazzaville", de: "Brazzaville" }, iata: "BZV", country: { fr: "Congo", en: "Congo", de: "Kongo" } },
  { key: "libreville", nameFr: "Libreville", labels: { fr: "Libreville", en: "Libreville", de: "Libreville" }, iata: "LBV", country: { fr: "Gabon", en: "Gabon", de: "Gabon" } },
  { key: "casablanca", nameFr: "Casablanca", labels: { fr: "Casablanca", en: "Casablanca", de: "Casablanca" }, iata: "CMN", country: { fr: "Maroc", en: "Morocco", de: "Marokko" } },
  { key: "alger", nameFr: "Alger", labels: { fr: "Alger", en: "Algiers", de: "Algier" }, iata: "ALG", country: { fr: "Algérie", en: "Algeria", de: "Algerien" } },
  { key: "tunis", nameFr: "Tunis", labels: { fr: "Tunis", en: "Tunis", de: "Tunis" }, iata: "TUN", country: { fr: "Tunisie", en: "Tunisia", de: "Tunesien" } },
  { key: "cairo", nameFr: "Le Caire", labels: { fr: "Le Caire", en: "Cairo", de: "Kairo" }, iata: "CAI", country: { fr: "Égypte", en: "Egypt", de: "Ägypten" } },
  { key: "nairobi", nameFr: "Nairobi", labels: { fr: "Nairobi", en: "Nairobi", de: "Nairobi" }, iata: "NBO", country: { fr: "Kenya", en: "Kenya", de: "Kenia" } },
];

// ---------- Destinations Europe (train & bus) ----------
export const DEST_EUROPE: DestCity[] = [
  { key: "paris", nameFr: "Paris", labels: { fr: "Paris", en: "Paris", de: "Paris" }, iata: "CDG", country: { fr: "France", en: "France", de: "Frankreich" } },
  { key: "brussels", nameFr: "Bruxelles", labels: { fr: "Bruxelles", en: "Brussels", de: "Brüssel" }, iata: "BRU", country: { fr: "Belgique", en: "Belgium", de: "Belgien" } },
  { key: "amsterdam", nameFr: "Amsterdam", labels: { fr: "Amsterdam", en: "Amsterdam", de: "Amsterdam" }, iata: "AMS", country: { fr: "Pays-Bas", en: "Netherlands", de: "Niederlande" } },
  { key: "london", nameFr: "Londres", labels: { fr: "Londres", en: "London", de: "London" }, iata: "LHR", country: { fr: "Royaume-Uni", en: "United Kingdom", de: "Großbritannien" } },
  { key: "prague", nameFr: "Prague", labels: { fr: "Prague", en: "Prague", de: "Prag" }, iata: "PRG", country: { fr: "Tchéquie", en: "Czechia", de: "Tschechien" } },
  { key: "warsaw", nameFr: "Varsovie", labels: { fr: "Varsovie", en: "Warsaw", de: "Warschau" }, iata: "WAW", country: { fr: "Pologne", en: "Poland", de: "Polen" } },
  { key: "vienna", nameFr: "Vienne", labels: { fr: "Vienne", en: "Vienna", de: "Wien" }, iata: "VIE", country: { fr: "Autriche", en: "Austria", de: "Österreich" } },
  { key: "milan", nameFr: "Milan", labels: { fr: "Milan", en: "Milan", de: "Mailand" }, iata: "MXP", country: { fr: "Italie", en: "Italy", de: "Italien" } },
  { key: "rome", nameFr: "Rome", labels: { fr: "Rome", en: "Rome", de: "Rom" }, iata: "FCO", country: { fr: "Italie", en: "Italy", de: "Italien" } },
  { key: "barcelona", nameFr: "Barcelone", labels: { fr: "Barcelone", en: "Barcelona", de: "Barcelona" }, iata: "BCN", country: { fr: "Espagne", en: "Spain", de: "Spanien" } },
  { key: "madrid", nameFr: "Madrid", labels: { fr: "Madrid", en: "Madrid", de: "Madrid" }, iata: "MAD", country: { fr: "Espagne", en: "Spain", de: "Spanien" } },
  { key: "lisbon", nameFr: "Lisbonne", labels: { fr: "Lisbonne", en: "Lisbon", de: "Lissabon" }, iata: "LIS", country: { fr: "Portugal", en: "Portugal", de: "Portugal" } },
  { key: "zurich", nameFr: "Zurich", labels: { fr: "Zurich", en: "Zurich", de: "Zürich" }, iata: "ZRH", country: { fr: "Suisse", en: "Switzerland", de: "Schweiz" } },
  { key: "copenhagen", nameFr: "Copenhague", labels: { fr: "Copenhague", en: "Copenhagen", de: "Kopenhagen" }, iata: "CPH", country: { fr: "Danemark", en: "Denmark", de: "Dänemark" } },
];

/** Slugs Trainline (vérifiés) */
const TRAINLINE_SLUGS: Record<string, string> = {
  "Berlin": "berlin", "Hamburg": "hamburg", "Frankfurt am Main": "frankfurt", "München": "munich",
  "Köln": "cologne", "Düsseldorf": "dusseldorf", "Stuttgart": "stuttgart", "Hannover": "hannover",
  "Leipzig": "leipzig", "Bruxelles": "brussels", "Paris": "paris", "Amsterdam": "amsterdam",
  "Londres": "londres", "Prague": "prague", "Vienne": "vienne", "Milan": "milan",
  "Barcelone": "barcelone", "Zurich": "zurich",
};

const LOCALE_MAP: Record<Lang, string> = { fr: "fr-FR", en: "en-GB", de: "de-DE" };

/** Date lisible dans la langue courante. */
export function humanDate(iso: string, lang: Lang): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(LOCALE_MAP[lang], { day: "numeric", month: "long", year: "numeric" });
}

/** Rétrocompatibilité — humanDateFr utilise toujours fr. */
export function humanDateFr(iso: string): string {
  return humanDate(iso, "fr");
}

export interface FlightLink {
  name: string;
  emoji: string;
  desc: { fr: string; en: string; de: string };
  url: string;
  official: string;
}

/** Liens de recherche AVION officiels (Kayak + Google Flights, vérifiés). */
export function buildFlightLinks(origin: OriginCity, dest: DestCity, date: string): FlightLink[] {
  const links: FlightLink[] = [];
  if (date) {
    links.push({
      name: "Kayak",
      emoji: "🛫",
      desc: {
        fr: "Comparateur de vols, trie les meilleures offres du jour.",
        en: "Flight comparator, sorts out the best deals of the day.",
        de: "Flugvergleich, sortiert die besten Angebote des Tages.",
      },
      url: `https://www.kayak.fr/flights/${origin.iata}-${dest.iata}/${date}`,
      official: "kayak.fr",
    });
  }
  links.push({
    name: "Google Flights",
    emoji: "🌐",
    desc: {
      fr: "Vue calendrier des prix les plus bas, dates flexibles.",
      en: "Calendar view of the lowest prices, flexible dates.",
      de: "Kalenderansicht der niedrigsten Preise, flexible Daten.",
    },
    url: `https://www.google.com/travel/flights?q=${encodeURIComponent(
      `flights from ${origin.nameFr} to ${dest.nameFr}${date ? " on " + humanDate(date, "en") : ""}`
    )}`,
    official: "google.com/travel",
  });
  return links;
}

/** Liens TRAIN & BUS officiels (Trainline + FlixBus, vérifiés). */
export function buildGroundLinks(origin: OriginCity, dest: DestCity, date: string): FlightLink[] {
  const links: FlightLink[] = [];
  const to = TRAINLINE_SLUGS[dest.nameFr] ?? dest.nameFr.toLowerCase().replace(/[^a-z-]/g, "");
  if (date) {
    links.push({
      name: "Trainline",
      emoji: "🚆",
      desc: {
        fr: "Trains et bus en Europe, billets officiels au meilleur prix.",
        en: "Trains and buses in Europe, official tickets at the best price.",
        de: "Züge und Busse in Europa, offizielle Tickets zum besten Preis.",
      },
      url: `https://www.trainline.fr/search/${origin.slug}/${to}/${date}`,
      official: "trainline.fr",
    });
  }
  links.push({
    name: "FlixBus",
    emoji: "🚌",
    desc: {
      fr: "Réseau de bus européen, trajets longue distance pas chers.",
      en: "European bus network, cheap long-distance trips.",
      de: "Europäisches Busnetz, günstige Langstrecken.",
    },
    url: `https://global.flixbus.com/bus-routes/bus-${origin.slug}-${
      dest.nameFr === "Köln" ? "cologne" : to
    }`,
    official: "global.flixbus.com",
  });
  return links;
}

/** Lien officiel BlaBlaCar (covoiturage externe). */
export const BLABLACAR_LINK: FlightLink = {
  name: "BlaBlaCar",
  emoji: "🚗",
  desc: {
    fr: "La référence du covoiturage, pour comparer avec les trajets de la communauté.",
    en: "The carpool reference, to compare with the community rides.",
    de: "Die Mitfahrgelegenheit-Referenz, zum Vergleich mit den Community-Fahrten.",
  },
  url: "https://www.blablacar.fr/",
  official: "blablacar.fr",
};

// ---------- Guides formalités voyage (multilingues) ----------

export interface VoyageGuide {
  emoji: string;
  title: Record<Lang, string>;
  body: Record<Lang, string>[];
}

/** Variante résolue : chaînes (pas Records). */
export interface VoyageGuideResolved {
  emoji: string;
  title: string;
  body: string[];
}

const VOYAGE_GUIDES_BASE: VoyageGuide[] = [
  {
    emoji: "🛂",
    title: {
      fr: "Passeport et documents",
      en: "Passport and documents",
      de: "Reisepass und Dokumente",
    },
    body: [
      {
        fr: "Ton passeport doit être valide au moins 6 mois après la date de retour, avec au moins une page vierge. Vérifie-le dès que tu prévois le voyage.",
        en: "Your passport must be valid at least 6 months after your return date, with at least one blank page. Check it as soon as you start planning.",
        de: "Dein Reisepass muss mindestens 6 Monate über das Rückreisedatum hinaus gültig sein, mit mindestens einer freien Seite. Prüfe ihn, sobald du die Reise planst.",
      },
      {
        fr: "Fais des copies papier et une photo de ton passeport, de ton titre de séjour et de ton billet. Garde une copie séparée des originaux et une autre dans ton téléphone.",
        en: "Make paper copies and a photo of your passport, residence permit and ticket. Keep one copy separate from the originals and another on your phone.",
        de: "Mach Papierkopien und ein Foto von deinem Reisepass, Aufenthaltstitel und Ticket. Bewahre eine Kopie getrennt von den Originalen auf und eine weitere auf deinem Handy.",
      },
      {
        fr: "Si tu voyages avec des enfants, prévois leurs passeports individuels et, si un parent ne voyage pas, une autorisation de sortie du territoire signée.",
        en: "If you travel with children, make sure they have their own passports and, if one parent doesn't travel, a signed parental authorisation.",
        de: "Wenn du mit Kindern reist: eigene Reisepässe und, falls ein Elternteil nicht mitreist, eine unterschriebene Reisevollmacht des anderen Elternteils.",
      },
    ],
  },
  {
    emoji: "🧳",
    title: {
      fr: "Douane et bagages",
      en: "Customs and luggage",
      de: "Zoll und Gepäck",
    },
    body: [
      {
        fr: "Tu peux transporter librement tes effets personnels. Les objets neufs de valeur (électronique, matériel) destinés à être laissés sur place peuvent être soumis à des taxes : garde les factures.",
        en: "You can freely carry your personal belongings. New valuable items (electronics, equipment) intended to be left behind may be subject to duties: keep the receipts.",
        de: "Persönliche Gegenstände darfst du frei mitführen. Neuwertige Objekte (Elektronik, Geräte), die vor Ort bleiben sollen, können besteuert werden: Bewahre die Rechnungen auf.",
      },
      {
        fr: "L'argent liquide supérieur à 10 000 € (ou équivalent) doit être déclaré à la douane, à l'aller comme au retour. Les transferts par carte ou service en ligne sont souvent plus sûrs.",
        en: "Cash over €10,000 (or equivalent) must be declared to customs, both ways. Card or online transfers are usually safer.",
        de: "Bargeld über 10.000 € (oder gleichwertig) muss beim Zoll deklariert werden, hin und zurück. Karten- oder Online-Überweisungen sind in der Regel sicherer.",
      },
      {
        fr: "Certains produits sont interdits ou réglementés (viande, plantes, médicaments sans ordonnance, espèces protégées). Renseigne-toi avant de faire la valise.",
        en: "Some products are banned or regulated (meat, plants, prescription drugs, protected species). Check before packing.",
        de: "Einige Produkte sind verboten oder reguliert (Fleisch, Pflanzen, rezeptpflichtige Medikamente, geschützte Arten). Informiere dich vor dem Packen.",
      },
    ],
  },
  {
    emoji: "💉",
    title: {
      fr: "Santé et vaccins",
      en: "Health and vaccines",
      de: "Gesundheit und Impfungen",
    },
    body: [
      {
        fr: "Le vaccin contre la fièvre jaune est exigé ou recommandé selon le pays (une seule dose à vie, à faire au minimum 10 jours avant le départ dans un centre agréé).",
        en: "The yellow fever vaccine is required or recommended depending on the country (a single dose for life, given at least 10 days before departure at an approved centre).",
        de: "Die Gelbfieber-Impfung ist je nach Land erforderlich oder empfohlen (eine Dosis lebenslang, mindestens 10 Tage vor der Abreise in einem zugelassenen Zentrum).",
      },
      {
        fr: "Prévois une trousse de première urgence, tes traitements habituels avec ordonnance, et une protection antimoustique selon la destination.",
        en: "Pack a basic first-aid kit, your usual medication with prescription, and mosquito protection depending on the destination.",
        de: "Packe ein Erste-Hilfe-Set, deine üblichen Medikamente mit Rezept und Mückenschutz je nach Ziel.",
      },
      {
        fr: "Une assurance voyage rapatriement coûte quelques euros et peut tout changer en cas d'hospitalisation. Souscris-la avant le départ.",
        en: "Repatriation travel insurance costs a few euros and can make all the difference in case of hospitalisation. Subscribe before departure.",
        de: "Eine Reiserückführungsversicherung kostet wenige Euro und kann im Falle einer Krankenhauseinweisung alles verändern. Schließe sie vor der Abreise ab.",
      },
    ],
  },
  {
    emoji: "💶",
    title: {
      fr: "Argent pendant le voyage",
      en: "Money while travelling",
      de: "Geld auf Reisen",
    },
    body: [
      {
        fr: "N'emporte pas tout en espèces : une carte internationale sans frais à l'étranger couvre la plupart des besoins.",
        en: "Don't carry everything in cash: an international card with no foreign fees covers most needs.",
        de: "Nicht alles in bar mitnehmen: eine internationale Karte ohne Auslandsgebühren deckt die meisten Bedürfnisse ab.",
      },
      {
        fr: "Préviens ta banque de ton départ à l'étranger pour éviter les blocages de carte.",
        en: "Notify your bank of your trip abroad to avoid card blocks.",
        de: "Informiere deine Bank über deine Auslandsreise, um Kartensperren zu vermeiden.",
      },
      {
        fr: "Change un petit montant à l'arrivée pour les transports et premiers achats, puis compare les taux sur place plutôt qu'à l'aéroport.",
        en: "Change a small amount on arrival for transport and first purchases, then compare rates locally rather than at the airport.",
        de: "Wechsle einen kleinen Betrag bei der Ankunft für Transport und erste Einkäufe und vergleiche die Kurse vor Ort statt am Flughafen.",
      },
    ],
  },
  {
    emoji: "📋",
    title: {
      fr: "Checklist avant le départ",
      en: "Pre-departure checklist",
      de: "Checkliste vor der Abreise",
    },
    body: [
      {
        fr: "Passeport valide 6 mois, billet, hébergement confirmé, assurance souscrite.",
        en: "Passport valid 6 months, ticket, accommodation confirmed, insurance subscribed.",
        de: "Reisepass 6 Monate gültig, Ticket, Unterkunft bestätigt, Versicherung abgeschlossen.",
      },
      {
        fr: "Copies des documents (papier + téléphone), urgences : ambassade, contacts famille.",
        en: "Document copies (paper + phone), emergencies: embassy, family contacts.",
        de: "Dokumentkopien (Papier + Handy), Notfälle: Botschaft, Familienkontakte.",
      },
      {
        fr: "Billets bus / train intérieurs réservés si besoin, adaptateur de prise, un peu de monnaie locale.",
        en: "Internal bus/train tickets booked if needed, plug adapter, a little local currency.",
        de: "Inlandes-Bus-/Zugtickets bei Bedarf, Reiseadapter, etwas Landeswährung.",
      },
    ],
  },
];

export function getVoyageGuides(lang: Lang): VoyageGuideResolved[] {
  return VOYAGE_GUIDES_BASE.map((g) => ({
    emoji: g.emoji,
    title: g.title[lang] ?? g.title.fr,
    body: g.body.map((p) => p[lang] ?? p.fr),
  }));
}

// Rétrocompatibilité (FR par défaut)
export const VOYAGE_GUIDES: VoyageGuideResolved[] = VOYAGE_GUIDES_BASE.map((g) => ({
  emoji: g.emoji,
  title: g.title.fr,
  body: g.body.map((p) => p.fr),
}));

/** Raisons de signalement d'un trajet — identiques côté serveur (multi-langues). */
export const TRIP_REPORT_REASONS: Record<Lang, string[]> = {
  fr: ["Trajet mensonger ou frauduleux", "Arnaque / fraude", "Faux profil", "Contenu inapproprié", "Spam / publicité", "Autre"],
  en: ["Misleading or fraudulent ride", "Scam / fraud", "Fake profile", "Inappropriate content", "Spam / advertising", "Other"],
  de: ["Irreführende oder betrügerische Fahrt", "Betrug", "Gefälschtes Profil", "Unangemessene Inhalte", "Spam / Werbung", "Andere"],
};

export const VOYAGE_LEGAL_NOTE_BY_LANG: Record<Lang, string> = {
  fr: "⚖️ PRONO ne vend aucun billet et ne copie aucune annonce : les recherches s'ouvrent directement sur les plateformes officielles (Kayak, Google Flights, Trainline, FlixBus, BlaBlaCar) où tu compares et achètes en toute sécurité. Les guides formalités sont indicatifs : vérifie toujours les règles auprès de ton ambassade ou consulat avant de voyager.",
  en: "⚖️ PRONO doesn't sell tickets or copy any listing: searches open directly on official platforms (Kayak, Google Flights, Trainline, FlixBus, BlaBlaCar) where you compare and buy safely. Formalities guides are indicative: always check the rules with your embassy or consulate before travelling.",
  de: "⚖️ PRONO verkauft keine Tickets und kopiert keine Anzeigen: Suchen öffnen sich direkt auf den offiziellen Plattformen (Kayak, Google Flights, Trainline, FlixBus, BlaBlaCar), wo du sicher vergleichst und kaufst. Formalitäten-Ratgeber sind Richtwerte: prüfe die Regeln vor der Reise bei deiner Botschaft oder deinem Konsulat.",
};
