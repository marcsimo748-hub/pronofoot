/**
 * Données du MODULE PRONO-HOUSING — recherche de logement Allemagne.
 *
 * ⚖️ LÉGALITÉ : aucune annonce n'est copiée ni scrapée. Pronofoot construit
 * des LIENS de recherche officiels vers les plateformes (WG-Gesucht,
 * ImmoScout24, Immowelt) avec les filtres de l'utilisateur. Les visiteurs
 * consultent et postulent sur les sites originaux.
 *
 * 🌍 i18n FR/EN/DE : textes traduits via lib/i18n.ts (useT())
 * + textes longs multilingues via getHousingGuides(lang) (ce fichier).
 */

import type { Lang } from "@/lib/i18n";

// ============================================================
// Villes (13 plus grandes villes étudiantes/pro allemandes)
// (Les noms français sont les noms usuels ; EN/DE sont traduits dynamiquement)
// ============================================================

export interface HousingCity {
  /** Nom original allemand — sert de clé stable (usage interne + plateforme) */
  name: string;
  /** Libellé d'affichage par langue */
  labels: { fr: string; en: string; de: string };
  wgSlug: string;
  wgId: number;
  immoweltSlug: string;
  /** Fourchettes par langue */
  wgRoom: { fr: string; en: string; de: string };
  coldRent: { fr: string; en: string; de: string };
}

export const HOUSING_CITIES: HousingCity[] = [
  { name: "Berlin", labels: { fr: "Berlin", en: "Berlin", de: "Berlin" }, wgSlug: "Berlin", wgId: 8, immoweltSlug: "berlin", wgRoom: { fr: "400 – 700 €", en: "€400 – €700", de: "400 – 700 €" }, coldRent: { fr: "12 – 14 €/m²", en: "€12 – €14/m²", de: "12 – 14 €/m²" } },
  { name: "Hamburg", labels: { fr: "Hamburg", en: "Hamburg", de: "Hamburg" }, wgSlug: "Hamburg", wgId: 55, immoweltSlug: "hamburg", wgRoom: { fr: "500 – 850 €", en: "€500 – €850", de: "500 – 850 €" }, coldRent: { fr: "13 – 15 €/m²", en: "€13 – €15/m²", de: "13 – 15 €/m²" } },
  { name: "München", labels: { fr: "Munich", en: "Munich", de: "München" }, wgSlug: "Muenchen", wgId: 90, immoweltSlug: "muenchen", wgRoom: { fr: "600 – 900 €", en: "€600 – €900", de: "600 – 900 €" }, coldRent: { fr: "18 – 21 €/m²", en: "€18 – €21/m²", de: "18 – 21 €/m²" } },
  { name: "Köln", labels: { fr: "Cologne", en: "Cologne", de: "Köln" }, wgSlug: "Koeln", wgId: 73, immoweltSlug: "koeln", wgRoom: { fr: "400 – 700 €", en: "€400 – €700", de: "400 – 700 €" }, coldRent: { fr: "12 – 14 €/m²", en: "€12 – €14/m²", de: "12 – 14 €/m²" } },
  { name: "Frankfurt am Main", labels: { fr: "Francfort-sur-le-Main", en: "Frankfurt am Main", de: "Frankfurt am Main" }, wgSlug: "Frankfurt-am-Main", wgId: 41, immoweltSlug: "frankfurt-am-main", wgRoom: { fr: "450 – 750 €", en: "€450 – €750", de: "450 – 750 €" }, coldRent: { fr: "13 – 16 €/m²", en: "€13 – €16/m²", de: "13 – 16 €/m²" } },
  { name: "Stuttgart", labels: { fr: "Stuttgart", en: "Stuttgart", de: "Stuttgart" }, wgSlug: "Stuttgart", wgId: 124, immoweltSlug: "stuttgart", wgRoom: { fr: "350 – 700 €", en: "€350 – €700", de: "350 – 700 €" }, coldRent: { fr: "14 – 16 €/m²", en: "€14 – €16/m²", de: "14 – 16 €/m²" } },
  { name: "Düsseldorf", labels: { fr: "Düsseldorf", en: "Düsseldorf", de: "Düsseldorf" }, wgSlug: "Duesseldorf", wgId: 30, immoweltSlug: "duesseldorf", wgRoom: { fr: "400 – 800 €", en: "€400 – €800", de: "400 – 800 €" }, coldRent: { fr: "12 – 14 €/m²", en: "€12 – €14/m²", de: "12 – 14 €/m²" } },
  { name: "Leipzig", labels: { fr: "Leipzig", en: "Leipzig", de: "Leipzig" }, wgSlug: "Leipzig", wgId: 77, immoweltSlug: "leipzig", wgRoom: { fr: "250 – 470 €", en: "€250 – €470", de: "250 – 470 €" }, coldRent: { fr: "8 – 10 €/m²", en: "€8 – €10/m²", de: "8 – 10 €/m²" } },
  { name: "Dresden", labels: { fr: "Dresde", en: "Dresden", de: "Dresden" }, wgSlug: "Dresden", wgId: 27, immoweltSlug: "dresden", wgRoom: { fr: "280 – 480 €", en: "€280 – €480", de: "280 – 480 €" }, coldRent: { fr: "8 – 10 €/m²", en: "€8 – €10/m²", de: "8 – 10 €/m²" } },
  { name: "Hannover", labels: { fr: "Hanovre", en: "Hanover", de: "Hannover" }, wgSlug: "Hannover", wgId: 57, immoweltSlug: "hannover", wgRoom: { fr: "300 – 600 €", en: "€300 – €600", de: "300 – 600 €" }, coldRent: { fr: "9 – 11 €/m²", en: "€9 – €11/m²", de: "9 – 11 €/m²" } },
  { name: "Nürnberg", labels: { fr: "Nuremberg", en: "Nuremberg", de: "Nürnberg" }, wgSlug: "Nuernberg", wgId: 96, immoweltSlug: "nuernberg", wgRoom: { fr: "300 – 600 €", en: "€300 – €600", de: "300 – 600 €" }, coldRent: { fr: "10 – 12 €/m²", en: "€10 – €12/m²", de: "10 – 12 €/m²" } },
  { name: "Bremen", labels: { fr: "Brême", en: "Bremen", de: "Bremen" }, wgSlug: "Bremen", wgId: 17, immoweltSlug: "bremen", wgRoom: { fr: "280 – 450 €", en: "€280 – €450", de: "280 – 450 €" }, coldRent: { fr: "9 – 11 €/m²", en: "€9 – €11/m²", de: "9 – 11 €/m²" } },
  { name: "Bonn", labels: { fr: "Bonn", en: "Bonn", de: "Bonn" }, wgSlug: "Bonn", wgId: 13, immoweltSlug: "bonn", wgRoom: { fr: "300 – 600 €", en: "€300 – €600", de: "300 – 600 €" }, coldRent: { fr: "11 – 13 €/m²", en: "€11 – €13/m²", de: "11 – 13 €/m²" } },
];

export type HousingType = "wg" | "apartment" | "studio";

export const HOUSING_TYPES: { value: HousingType; label: Record<Lang, string>; note: Record<Lang, string> }[] = [
  {
    value: "wg",
    label: { fr: "🛏️ WG / Colocation", en: "🛏️ Shared flat (WG)", de: "🛏️ WG / Wohngemeinschaft" },
    note: { fr: "Le plus facile pour débuter en Allemagne", en: "The easiest way to start in Germany", de: "Der einfachste Einstieg in Deutschland" },
  },
  {
    value: "apartment",
    label: { fr: "🏠 Appartement", en: "🏠 Apartment", de: "🏠 Wohnung" },
    note: { fr: "Wohnung · plus de dossier exigé", en: "Wohnung · more paperwork required", de: "Wohnung · mehr Unterlagen nötig" },
  },
  {
    value: "studio",
    label: { fr: "🚪 Studio", en: "🚪 Studio", de: "🚪 Studio" },
    note: { fr: "1-Zimmer-Wohnung", en: "1-room apartment", de: "1-Zimmer-Wohnung" },
  },
];

// ============================================================
// Construction des liens de recherche officiels (100% légal)
// ============================================================

export interface PlatformLink {
  name: string;
  emoji: string;
  url: string;
  /** Texte affiché dans le composant, par langue */
  note: Record<Lang, string>;
  legal: string;
}

export function buildPlatformLinks(
  city: HousingCity,
  type: HousingType,
  rentMax?: number
): PlatformLink[] {
  const wgCategory =
    type === "wg" ? ["wg-zimmer", 0] : type === "studio" ? ["1-zimmer-wohnungen", 1] : ["wohnungen", 2];

  const links: PlatformLink[] = [
    {
      name: "WG-Gesucht",
      emoji: "🛏️",
      url: `https://www.wg-gesucht.de/${wgCategory[0]}-in-${city.wgSlug}.${city.wgId}.${wgCategory[1]}.1.0.html`,
      note: {
        fr: type === "wg" ? "Le n°1 absolu des colocs en Allemagne" : "Colocs, appartements et studios",
        en: type === "wg" ? "The #1 shared flat site in Germany" : "WGs, apartments and studios",
        de: type === "wg" ? "Nr. 1 für WGs in Deutschland" : "WGs, Wohnungen und Apartments",
      },
      legal: "wg-gesucht.de",
    },
    {
      name: "ImmoScout24",
      emoji: "🔎",
      url: `https://www.immobilienscout24.de/Suche/de/wohnung-mieten?searchstring=${encodeURIComponent(city.name)}${rentMax ? `&price=-${rentMax}` : ""}`,
      note: {
        fr: "Le plus grand portail immobilier d'Allemagne",
        en: "Germany's largest real estate portal",
        de: "Deutschlands größtes Immobilien-Portal",
      },
      legal: "immobilienscout24.de",
    },
    {
      name: "Immowelt",
      emoji: "🏘️",
      url: `https://www.immowelt.de/liste/${city.immoweltSlug}/wohnungen/mieten${rentMax ? `?maxmiete=${rentMax}` : ""}`,
      note: {
        fr: "Excellente alternative, souvent moins de concurrence",
        en: "Great alternative, often less competition",
        de: "Gute Alternative, oft weniger Konkurrenz",
      },
      legal: "immowelt.de",
    },
    {
      name: "Kleinanzeigen",
      emoji: "📌",
      url: "https://www.kleinanzeigen.de/s-wohnung-mieten/k0c203",
      note: {
        fr: "Petites annonces entre particuliers (ville à préciser sur place)",
        en: "Classifieds between individuals (city to set on site)",
        de: "Kleinanzeigen unter Privatpersonen (Stadt vor Ort einstellen)",
      },
      legal: "kleinanzeigen.de",
    },
  ];
  return links;
}

// ============================================================
// Générateur d'Anschreiben (lettre de motivation logement)
// 3 langues : texte allemand = natif, français = traduction,
//             anglais = version spécifique.
// ============================================================

export interface LetterData {
  target: "wg" | "apartment";
  name: string;
  age: string;
  country: string;
  profession: string;
  moveIn: string;
  city: string;
  budget: string;
  hobbies: string;
  germanLevel: string;
  otherLanguages: string;
  income: string;
  phone: string;
  email: string;
}

export const DEFAULT_LETTER_DATA: LetterData = {
  target: "wg",
  name: "",
  age: "",
  country: "",
  profession: "",
  moveIn: "",
  city: "Berlin",
  budget: "",
  hobbies: "",
  germanLevel: "B1",
  otherLanguages: "français (langue maternelle), anglais",
  income: "",
  phone: "",
  email: "",
};

function letterDE(d: LetterData): string {
  const occ = d.profession ? `Aktuell bin ich als ${d.profession} tätig.` : "";
  const german =
    d.germanLevel && d.germanLevel !== "none"
      ? ` Meine Deutschkenntnisse liegen auf Niveau ${d.germanLevel}.`
      : "";
  const others = d.otherLanguages ? ` Außerdem spreche ich ${d.otherLanguages}.` : "";
  const hobbies = d.hobbies ? ` In meiner Freizeit ${d.hobbies}.` : "";

  const head = `${d.name || "…"}${d.age ? `, ich bin ${d.age} Jahre alt` : ""}${d.country ? ` und komme aus ${d.country}` : ""}.${occ ? " " + occ : ""}`;
  const contact = `${d.phone}${d.phone && d.email ? " · " : ""}${d.email}`;

  if (d.target === "wg") {
    return `Betreff: Bewerbung um das WG-Zimmer${d.moveIn ? ` ab dem ${d.moveIn}` : ""}

Liebe zukünftige Mitbewohnerinnen und Mitbewohner,

mein Name ist ${head}

Ich suche ${d.moveIn ? `ab dem ${d.moveIn} ` : ""}ein Zimmer in ${d.city || "…"} und bin an einer längeren Aufenthaltsdauer interessiert. Mein Budget liegt bei maximal ${d.budget || "…"} € warm.${german}${others}${hobbies}

Zu mir: Ich bin zuverlässig, ordentlich und respektiere die Privatsphäre meiner Mitbewohner. Die Kaution ist für mich kein Problem, und alle Unterlagen (Einkommensnachweis, Mieterfragebogen) lege ich gerne vor.

Ich freue mich darauf, euch kennenzulernen!

Herzliche Grüße
${d.name || "…"}
${contact}`;
  }

  return `Betreff: Bewerbung um die Wohnung${d.moveIn ? ` ab dem ${d.moveIn}` : ""}

Sehr geehrte Damen und Herren,

mein Name ist ${head}

Ich suche ${d.moveIn ? `ab dem ${d.moveIn} ` : ""}eine Wohnung in ${d.city || "…"} und bin an einer langfristigen Mietdauer interessiert. Mein Budget liegt bei maximal ${d.budget || "…"} € Warmmiete.${german}${others}

Meine finanzielle Situation ist stabil${d.income ? `: ${d.income}` : ""}. Die Kaution (drei Monatsmieten) ist für mich kein Problem. Selbstverständlich lege ich alle erforderlichen Unterlagen (Einkommensnachweise, Mieterfragebogen) gerne sofort vor.

Ich würde mich sehr über die Gelegenheit freuen, die Wohnung zu besichtigen.

Mit freundlichen Grüßen
${d.name || "…"}
${contact}`;
}

function letterFR(d: LetterData): string {
  const occ = d.profession ? ` Actuellement je travaille comme ${d.profession}.` : "";
  const german =
    d.germanLevel && d.germanLevel !== "none" ? ` Mon allemand est de niveau ${d.germanLevel}.` : "";
  const others = d.otherLanguages ? ` Je parle aussi ${d.otherLanguages}.` : "";
  const hobbies = d.hobbies ? ` Pendant mon temps libre, ${d.hobbies}.` : "";
  const head = `${d.name || "…"}${d.age ? `, j'ai ${d.age} ans` : ""}${d.country ? ` et je viens de ${d.country}` : ""}.${occ}`;
  const contact = `${d.phone}${d.phone && d.email ? " · " : ""}${d.email}`;

  if (d.target === "wg") {
    return `Objet : Candidature pour la chambre en colocation${d.moveIn ? ` à partir du ${d.moveIn}` : ""}

Chers futurs colocataires,

Je m'appelle ${head}

Je cherche ${d.moveIn ? `à partir du ${d.moveIn} ` : ""}une chambre à ${d.city || "…"} et je souhaite m'installer durablement. Mon budget est de ${d.budget || "…"} € maximum charges comprises.${german}${others}${hobbies}

Sur moi : je suis fiable, ordonné et je respecte l'espace de mes colocataires. Le dépôt de garantie ne me pose aucun problème et je fournis tous les documents (justificatif de revenus, questionnaire locataire) sur demande.

Je serais ravi(e) de vous rencontrer !

Bien cordialement,
${d.name || "…"}
${contact}`;
  }

  return `Objet : Candidature pour l'appartement${d.moveIn ? ` à partir du ${d.moveIn}` : ""}

Madame, Monsieur,

Je m'appelle ${head}

Je cherche ${d.moveIn ? `à partir du ${d.moveIn} ` : ""}un appartement à ${d.city || "…"} et je souhaite une location durable. Mon budget est de ${d.budget || "…"} € maximum charges comprises.${german}${others}

Ma situation financière est stable${d.income ? ` : ${d.income}` : ""}. Le dépôt de garantie (trois mois de loyer) ne me pose aucun problème. Je fournis bien entendu immédiatement tous les documents demandés (justificatifs de revenus, questionnaire locataire).

Je serais très heureux(se) de pouvoir visiter l'appartement.

Cordialement,
${d.name || "…"}
${contact}`;
}

function letterEN(d: LetterData): string {
  const occ = d.profession ? ` I'm currently working as a ${d.profession}.` : "";
  const german =
    d.germanLevel && d.germanLevel !== "none" ? ` My German is at level ${d.germanLevel}.` : "";
  const others = d.otherLanguages ? ` I also speak ${d.otherLanguages}.` : "";
  const hobbies = d.hobbies ? ` In my free time, ${d.hobbies}.` : "";
  const head = `${d.name || "…"}${d.age ? `, I'm ${d.age} years old` : ""}${d.country ? ` and I'm from ${d.country}` : ""}.${occ}`;
  const contact = `${d.phone}${d.phone && d.email ? " · " : ""}${d.email}`;

  if (d.target === "wg") {
    return `Subject: Application for the shared room${d.moveIn ? ` from ${d.moveIn}` : ""}

Dear future flatmates,

My name is ${head}

I'm looking ${d.moveIn ? `from ${d.moveIn} ` : ""}for a room in ${d.city || "…"} and I'm interested in a longer stay. My budget is a maximum of ${d.budget || "…"} € warm.${german}${others}${hobbies}

About me: I'm reliable, tidy and I respect the privacy of my flatmates. The deposit is no problem for me, and I'm happy to provide all the documents (proof of income, tenant questionnaire) on request.

I look forward to meeting you!

Kind regards,
${d.name || "…"}
${contact}`;
  }

  return `Subject: Application for the apartment${d.moveIn ? ` from ${d.moveIn}` : ""}

Dear Sir or Madam,

My name is ${head}

I'm looking ${d.moveIn ? `from ${d.moveIn} ` : ""}for an apartment in ${d.city || "…"} and I'm interested in a long-term rental. My budget is a maximum of ${d.budget || "…"} € warm (all charges included).${german}${others}

My financial situation is stable${d.income ? `: ${d.income}` : ""}. The deposit (three months' rent) is no problem for me. I'll gladly provide all required documents (proof of income, tenant questionnaire) right away.

I would really appreciate the opportunity to visit the apartment.

Yours faithfully,
${d.name || "…"}
${contact}`;
}

/** Renvoie la lettre dans la langue demandée. */
export function generateLetter(d: LetterData, lang: Lang): string {
  if (lang === "de") return letterDE(d);
  if (lang === "en") return letterEN(d);
  return letterFR(d);
}

// Backward-compat : noms historiques utilisés par AnschreibenGenerator
export const generateLetterDe = (d: LetterData) => letterDE(d);
export const generateLetterFr = (d: LetterData) => letterFR(d);

// ============================================================
// Guides logement (multilingues)
// ============================================================

export interface HousingGuide {
  id: string;
  emoji: string;
  title: Record<Lang, string>;
  summary: Record<Lang, string>;
  sections: { h: Record<Lang, string>; p?: Record<Lang, string>; list?: Record<Lang, string>[] }[];
}

/** Variante résolue par le sélecteur de langue : tous les champs sont des strings. */
export interface HousingGuideResolved extends Omit<HousingGuide, "title" | "summary" | "sections"> {
  title: string;
  summary: string;
  sections: { h: string; p?: string; list?: string[] }[];
}

const HOUSING_GUIDES_BASE: HousingGuide[] = [
  {
    id: "methode",
    emoji: "🎯",
    title: {
      fr: "Trouver un logement en Allemagne · la méthode",
      en: "Find a place in Germany · the method",
      de: "Wohnung in Deutschland finden · die Methode",
    },
    summary: {
      fr: "Les bonnes plateformes, le bon calendrier et le bon rythme d'envoi des candidatures.",
      en: "The right platforms, the right calendar and the right pace for sending applications.",
      de: "Die richtigen Plattformen, der richtige Zeitplan und das richtige Bewerbungstempo.",
    },
    sections: [
      {
        h: {
          fr: "Par où commencer ?",
          en: "Where to start?",
          de: "Wo anfangen?",
        },
        list: [
          {
            fr: "WG-Gesucht : LE site des colocs · crée un profil complet AVEC photo, ça double les réponses",
            en: "WG-Gesucht: THE shared flat site · create a complete profile WITH photo, it doubles responses",
            de: "WG-Gesucht: DIE WG-Seite · erstelle ein vollständiges Profil MIT Foto, das verdoppelt die Antworten",
          },
          {
            fr: "ImmoScout24 et Immowelt : pour les appartements · active les alertes recherche (Suchauftrag)",
            en: "ImmoScout24 and Immowelt: for apartments · set up search alerts (Suchauftrag)",
            de: "ImmoScout24 und Immowelt: für Wohnungen · Suchauftrag aktivieren",
          },
          {
            fr: "Kleinanzeigen : des pépites entre particuliers, sans agents",
            en: "Kleinanzeigen: hidden gems between individuals, no agencies",
            de: "Kleinanzeigen: Schätze von Privat an Privat, ohne Makler",
          },
          {
            fr: "Facebook Groups (« Wohnen in Berlin », « WG Zimmer + Stadt ») et les tableaux d'affichage des universités",
            en: "Facebook Groups (« Wohnen in Berlin », « WG Zimmer + Stadt ») and university notice boards",
            de: "Facebook-Gruppen (« Wohnen in Berlin », « WG Zimmer + Stadt ») und Uni-Schwarze Bretter",
          },
        ],
      },
      {
        h: { fr: "Le rythme qui marche", en: "The pace that works", de: "Das richtige Tempo" },
        p: {
          fr: "À Berlin, Munich ou Hambourg, une annonce de coloc reçoit 50-200 messages dans les premières heures. Réponds dans les 30 minutes suivant la publication : active les notifications, envoie ta lettre type (générée ici même !) personnalisée d'une phrase, et rappelle par message si pas de réponse sous 24 h. Compte 30-80 candidatures pour décrocher un logement dans les villes tendues · c'est normal, ne lâche pas.",
          en: "In Berlin, Munich or Hamburg, a shared flat listing gets 50-200 messages in the first hours. Reply within 30 minutes of posting: turn on notifications, send your template letter (generated right here!) with one custom line, and follow up if no answer after 24 h. Expect 30-80 applications to land a flat in tight cities · it's normal, don't give up.",
          de: "In Berlin, München oder Hamburg bekommt eine WG-Anzeige in den ersten Stunden 50-200 Nachrichten. Antworte innerhalb von 30 Minuten nach der Veröffentlichung: aktiviere Benachrichtigungen, schicke dein Standardschreiben (hier generiert!) mit einer persönlichen Zeile, und erinnere nach 24 h wenn keine Antwort kam. Rechne mit 30-80 Bewerbungen, um in angespannten Städten eine Wohnung zu bekommen · das ist normal, gib nicht auf.",
        },
      },
      {
        h: {
          fr: "La Bewerbung (candidature) parfaite",
          en: "The perfect application (Bewerbung)",
          de: "Die perfekte Bewerbung",
        },
        list: [
          {
            fr: "Une lettre courte et chaleureuse (le générateur Anschreiben de PRONO l'a écrite pour toi)",
            en: "A short and warm cover letter (PRONO's Anschreiben generator writes it for you)",
            de: "Ein kurzes, warmes Anschreiben (PRONOs Anschreiben-Generator hat es für dich geschrieben)",
          },
          {
            fr: "Un profil WG-Gesucht complété : photo souriante, âge, profession, hobbies",
            en: "A complete WG-Gesucht profile: smiling photo, age, profession, hobbies",
            de: "Ein vollständiges WG-Gesucht-Profil: lächelndes Foto, Alter, Beruf, Hobbys",
          },
          {
            fr: "Tes disponibilités pour la visite (Besichtigung) dès le premier message",
            en: "Your availability for the visit (Besichtigung) right from the first message",
            de: "Deine Verfügbarkeit für die Besichtigung ab der ersten Nachricht",
          },
          {
            fr: "Les documents prêts en PDF (voir le guide « dossier parfait »)",
            en: "Documents ready in PDF (see the « perfect file » guide)",
            de: "Unterlagen als PDF bereit (siehe Ratgeber « perfekte Bewerbungsunterlagen »)",
          },
        ],
      },
    ],
  },
  {
    id: "dossier",
    emoji: "📁",
    title: {
      fr: "Le dossier de candidature parfait (Unterlagen)",
      en: "The perfect application file (Unterlagen)",
      de: "Die perfekten Bewerbungsunterlagen (Unterlagen)",
    },
    summary: {
      fr: "Les documents qu'un propriétaire allemand attend · prépare-les AVANT de chercher.",
      en: "Documents a German landlord expects · prepare them BEFORE searching.",
      de: "Unterlagen, die ein deutscher Vermieter erwartet · bereite sie VOR der Suche vor.",
    },
    sections: [
      {
        h: { fr: "Les classiques demandés", en: "Standard requirements", de: "Die Klassiker" },
        list: [
          {
            fr: "Mieterfragebogen (questionnaire locataire) : rempli soigneusement",
            en: "Mieterfragebogen (tenant questionnaire): filled in carefully",
            de: "Mieterfragebogen (Mieter-Fragebogen): sorgfältig ausgefüllt",
          },
          {
            fr: "Justificatifs de revenus : 3 derniers bulletins de salaire (Einkommensnachweise) ou contrat de travail",
            en: "Proof of income: last 3 payslips (Einkommensnachweise) or employment contract",
            de: "Einkommensnachweise: die letzten 3 Lohnabrechnungen oder Arbeitsvertrag",
          },
          {
            fr: "SCHUFA-Auskunft : ton « score de crédit » allemand · vierge au début, ce n'est pas éliminatoire si tes revenus sont bons",
            en: "SCHUFA-Auskunft: your German credit score · empty at the start, it's not a deal-breaker if your income is good",
            de: "SCHUFA-Auskunft: dein deutscher Schufa-Score · am Anfang leer, das ist kein Ausschluss wenn dein Einkommen stimmt",
          },
          {
            fr: "Copie du passeport / pièce d'identité",
            en: "Copy of passport / ID",
            de: "Kopie des Reisepasses / Personalausweises",
          },
          {
            fr: "Attestation de l'ancien propriétaire (Mietschuldenfreiheitsbescheinigung) si tu en as une",
            en: "Reference from previous landlord (Mietschuldenfreiheitsbescheinigung) if you have one",
            de: "Bescheinigung des Vorvermieters (Mietschuldenfreiheitsbescheinigung) wenn vorhanden",
          },
        ],
      },
      {
        h: {
          fr: "Sans CDI ni historique allemand ?",
          en: "No permanent contract or German history?",
          de: "Ohne Festvertrag oder deutsche Historie?",
        },
        list: [
          {
            fr: "Un garant (Bürge) : parent ou famille qui s'engage · son dossier remplace le tien",
            en: "A guarantor (Bürge): parent or family member who co-signs · their file replaces yours",
            de: "Ein Bürge: Elternteil oder Verwandter, der bürgt · seine Unterlagen ersetzen deine",
          },
          {
            fr: "Preuve d'épargne : relevé montrant 6-12 mois de loyer",
            en: "Proof of savings: statement showing 6-12 months of rent",
            de: "Ersparnis-Nachweis: Kontoauszug mit 6-12 Monaten Miete",
          },
          {
            fr: "Pour les étudiants : notification de bourse (BAföG, DAAD…) ou compte bloqué",
            en: "For students: grant notification (BAföG, DAAD…) or blocked account",
            de: "Für Studenten: Stipendienbescheid (BAföG, DAAD…) oder Sperrkonto",
          },
          {
            fr: "Une lettre de motivation sincère : pour une coloc, l'humain compte autant que les chiffres",
            en: "A sincere cover letter: for a shared flat, the human side counts as much as the numbers",
            de: "Ein aufrichtiges Anschreiben: bei einer WG zählt das Menschliche genauso wie die Zahlen",
          },
        ],
      },
      {
        h: { fr: "Astuce pro", en: "Pro tip", de: "Profi-Tipp" },
        p: {
          fr: "Prépare un seul PDF de 5-6 pages (lettre + questionnaire + revenus + pièce d'identité) prêt à envoyer en 10 secondes. La rapidité est ton meilleur avantage face aux autres candidats.",
          en: "Prepare a single 5-6 page PDF (letter + questionnaire + income + ID) ready to send in 10 seconds. Speed is your best advantage over other applicants.",
          de: "Bereite ein einziges PDF mit 5-6 Seiten vor (Schreiben + Fragebogen + Einkommen + Ausweis), das in 10 Sekunden verschickt ist. Schnelligkeit ist dein größter Vorteil gegenüber anderen Bewerbern.",
        },
      },
    ],
  },
  {
    id: "loyers",
    emoji: "💶",
    title: {
      fr: "Comprendre les loyers allemands",
      en: "Understanding German rents",
      de: "Deutsche Mieten verstehen",
    },
    summary: {
      fr: "Kaltmiete, Warmmiete, Nebenkosten, Kaution : le vrai coût d'un toit en Allemagne.",
      en: "Kaltmiete, Warmmiete, Nebenkosten, Kaution: the real cost of a roof in Germany.",
      de: "Kaltmiete, Warmmiete, Nebenkosten, Kaution: die echten Kosten eines Dachs in Deutschland.",
    },
    sections: [
      {
        h: {
          fr: "Kaltmiete vs Warmmiete",
          en: "Kaltmiete vs Warmmiete",
          de: "Kaltmiete vs Warmmiete",
        },
        list: [
          {
            fr: "Kaltmiete (loyer froid) : le loyer de base, SANS charges",
            en: "Kaltmiete (cold rent): base rent, WITHOUT charges",
            de: "Kaltmiete: die Grundmiete, OHNE Nebenkosten",
          },
          {
            fr: "Nebenkosten (charges) : chauffage, eau, électricité, assurance immeuble, poubelles · souvent 2-4 €/m² en plus",
            en: "Nebenkosten: heating, water, electricity, building insurance, trash · often €2-4/m² extra",
            de: "Nebenkosten: Heizung, Wasser, Strom, Gebäudeversicherung, Müll · oft 2-4 €/m² extra",
          },
          {
            fr: "Warmmiete (loyer chaud) : Kaltmiete + Nebenkosten = ce que tu paies réellement. TOUJOURS comparer en Warmmiete",
            en: "Warmmiete: Kaltmiete + Nebenkosten = what you actually pay. ALWAYS compare in Warmmiete",
            de: "Warmmiete: Kaltmiete + Nebenkosten = das, was du wirklich zahlst. IMMER in Warmmiete vergleichen",
          },
        ],
      },
      {
        h: { fr: "La Kaution (dépôt de garantie)", en: "Kaution (security deposit)", de: "Die Kaution" },
        p: {
          fr: "Maximum 3 mois de Kaltmiete, souvent déposée sur un compte séquestre (Kautionskonto). Elle te est restituée avec intérêts au départ, moins les éventuels dégâts. Un propriétaire ne peut JAMAIS exiger la kaution en espèces ni avant la signature.",
          en: "Maximum 3 months of Kaltmiete, usually deposited on an escrow account (Kautionskonto). It's returned to you with interest when you leave, minus any damages. A landlord can NEVER ask for the deposit in cash or before signing.",
          de: "Höchstens 3 Monatsmieten Kalt, oft auf einem Kautionskonto hinterlegt. Bei Auszug bekommst du sie mit Zinsen zurück, abzüglich eventueller Schäden. Ein Vermieter darf die Kaution NIEMALS bar oder vor der Unterschrift verlangen.",
        },
      },
      {
        h: { fr: "Les autres coûts à prévoir", en: "Other costs to plan", de: "Weitere Kosten" },
        list: [
          {
            fr: "Rundfunkbeitrag : la redevance radio/TV, ~18 €/mois par logement (obligatoire)",
            en: "Rundfunkbeitrag: the radio/TV fee, ~€18/month per household (mandatory)",
            de: "Rundfunkbeitrag: die Rundfunkgebühr, ~18 €/Monat pro Wohnung (Pflicht)",
          },
          {
            fr: "Strom (électricité) : 30-60 €/mois si non inclus",
            en: "Strom (electricity): €30-60/month if not included",
            de: "Strom: 30-60 €/Monat falls nicht inklusive",
          },
          {
            fr: "Internet : 25-45 €/mois (à souscrire, souvent 1-2 semaines de délai)",
            en: "Internet: €25-45/month (subscribe early, often 1-2 weeks of delay)",
            de: "Internet: 25-45 €/Monat (früh buchen, oft 1-2 Wochen Wartezeit)",
          },
          {
            fr: "Provision d'agent : 0 € légalement pour la location simple (Bestellerprovision payée par le propriétaire) · si un agent te demande une provision pour une location simple, c'est suspect",
            en: "Agent fee: €0 by law for simple rentals (Bestellerprovision paid by the landlord) · if an agent asks you for a fee on a simple rental, it's suspicious",
            de: "Maklerprovision: 0 € gesetzlich bei einfacher Vermietung (Bestellerprovision zahlt der Vermieter) · wenn ein Makler für eine einfache Vermietung Provision verlangt, ist das verdächtig",
          },
        ],
      },
      {
        h: { fr: "Budget réaliste par ville", en: "Realistic budget by city", de: "Realistisches Budget pro Stadt" },
        p: {
          fr: "Utilise le tableau de référence de cette page : une chambre en coloc à Leipzig ou Dresde coûte souvent 2 fois moins cher qu'à Munich. Si ton budget est serré, élargis ta recherche aux villes de taille moyenne (région de la Ruhr, Saxe, villes du Nord) où le marché est plus détendu.",
          en: "Use the reference table on this page: a shared room in Leipzig or Dresden often costs half as much as in Munich. If your budget is tight, widen your search to medium-sized cities (Ruhr area, Saxony, northern cities) where the market is softer.",
          de: "Nutze die Referenztabelle auf dieser Seite: ein WG-Zimmer in Leipzig oder Dresden kostet oft halb so viel wie in München. Wenn dein Budget knapp ist, weite die Suche auf mittelgroße Städte aus (Ruhrgebiet, Sachsen, Nordstädte), wo der Markt entspannter ist.",
        },
      },
    ],
  },
  {
    id: "arnaques",
    emoji: "🚨",
    title: {
      fr: "Les arnaques à éviter absolument",
      en: "Scams to absolutely avoid",
      de: "Betrügereien unbedingt vermeiden",
    },
    summary: {
      fr: "Un logement « trop beau » à un prix cassé ? Voici les 4 pièges les plus courants.",
      en: "A listing « too good to be true » at a low price? Here are the 4 most common traps.",
      de: "Eine « zu schöne » Wohnung zum Schnäppchenpreis? Hier sind die 4 häufigsten Fallen.",
    },
    sections: [
      {
        h: { fr: "Les signaux d'alarme", en: "Red flags", de: "Warnzeichen" },
        list: [
          {
            fr: "On te demande un virement (Western Union, Crypto, comptes étrangers) AVANT la visite · JAMAIS payer avant d'avoir visité et signé",
            en: "You are asked for a transfer (Western Union, crypto, foreign accounts) BEFORE the visit · NEVER pay before visiting and signing",
            de: "Man bittet dich um eine Überweisung (Western Union, Krypto, ausländische Konten) VOR der Besichtigung · NIEMALS vor Besichtigung und Unterschrift zahlen",
          },
          {
            fr: "Le « propriétaire » est « à l'étranger » et veut t'envoyer les clés par la poste contre caution",
            en: "The « landlord » is « abroad » and wants to send you the keys by mail against a deposit",
            de: "Der « Vermieter » ist « im Ausland » und will dir die Schlüssel per Post gegen Kaution schicken",
          },
          {
            fr: "Des photos trop parfaites (souvent volées sur Airbnb), prix 40% sous le marché",
            en: "Too-perfect photos (often stolen from Airbnb), price 40% below market",
            de: "Zu perfekte Fotos (oft von Airbnb geklaut), Preis 40% unter dem Markt",
          },
          {
            fr: "Refus de tout contact vidéo ou téléphonique",
            en: "Refusal of any video or phone contact",
            de: "Jeglicher Video- oder Telefonkontakt wird verweigert",
          },
        ],
      },
      {
        h: { fr: "Les règles d'or", en: "Golden rules", de: "Goldene Regeln" },
        list: [
          {
            fr: "Visite physique (ou visio en direct avec l'occupant) AVANT toute somme d'argent",
            en: "Physical visit (or live video with the current occupant) BEFORE any money changes hands",
            de: "Persönliche Besichtigung (oder Live-Video mit dem Bewohner) BEVOR Geld fließt",
          },
          {
            fr: "Paiement de la kaution uniquement après signature du bail, sur un compte allemand au nom du propriétaire",
            en: "Pay the deposit only AFTER signing the lease, to a German account in the landlord's name",
            de: "Kaution erst NACH Mietvertragsunterschrift auf ein deutsches Konto im Namen des Vermieters zahlen",
          },
          {
            fr: "Vérifie le propriétaire : nom sur le bail = nom du compte bancaire = nom sur l'annonce",
            en: "Verify the landlord: name on the lease = name on the bank account = name on the listing",
            de: "Vermieter prüfen: Name im Mietvertrag = Name des Bankkontos = Name in der Anzeige",
          },
          {
            fr: "Sur Kleinanzeigen, l'option « paiement sécurisé » native protège les achats, PAS les locations",
            en: "On Kleinanzeigen, the native « secure payment » option protects purchases, NOT rentals",
            de: "Auf Kleinanzeigen schützt die native « sichere Bezahlung » Käufe, NICHT Vermietungen",
          },
        ],
      },
      {
        h: { fr: "Si tu as été victime", en: "If you've been scammed", de: "Wenn du betrogen wurdest" },
        p: {
          fr: "Ne paye plus rien, conserve toutes les preuves (messages, IBAN, annonces) et dépose plainte à la police (Anzeige erstatten). En Allemagne, la Verbraucherzentrale (centre de protection du consommateur) conseille gratuitement les victimes d'arnaques au logement.",
          en: "Don't pay anything else, keep all evidence (messages, IBAN, listings) and file a police report (Anzeige erstatten). In Germany, the Verbraucherzentrale (consumer protection centre) advises housing scam victims for free.",
          de: "Zahle nichts weiter, sichere alle Beweise (Nachrichten, IBAN, Anzeigen) und erstattet Anzeige bei der Polizei. In Deutschland berät die Verbraucherzentrale Opfer von Wohnungsbetrug kostenlos.",
        },
      },
    ],
  },
  {
    id: "wbs",
    emoji: "🏛️",
    title: {
      fr: "WBS, logement social et alternatives",
      en: "WBS, social housing and alternatives",
      de: "WBS, Sozialwohnungen und Alternativen",
    },
    summary: {
      fr: "Le Wohnberechtigungsschein, les résidences étudiantes et autres solutions abordables.",
      en: "The Wohnberechtigungsschein, student residences and other affordable options.",
      de: "Der Wohnberechtigungsschein, Studentenwohnheime und andere bezahlbare Lösungen.",
    },
    sections: [
      {
        h: { fr: "Le WBS (Wohnberechtigungsschein)", en: "The WBS (Wohnberechtigungsschein)", de: "Der WBS (Wohnberechtigungsschein)" },
        p: {
          fr: "Le titre d'accès au logement social (municipal). Les logements WBS coûtent souvent 30-50% de moins que le marché, mais il faut remplir des conditions de revenus et l'obtenir auprès de ta mairie (Bürgeramt) AVANT de postuler. À Berlin, le WBS est délivré selon des plafonds de revenus · renseigne-toi dès ton arrivée, les listes d'attente sont longues mais ça vaut l'effort.",
          en: "The municipal title to access social housing. WBS flats often cost 30-50% less than the market, but you must meet income conditions and obtain it from your city hall (Bürgeramt) BEFORE applying. In Berlin, the WBS is granted within income ceilings · ask as soon as you arrive, waiting lists are long but it's worth it.",
          de: "Der kommunale Berechtigungsschein für Sozialwohnungen. WBS-Wohnungen kosten oft 30-50% weniger als der Markt, aber du musst Einkommensgrenzen erfüllen und ihn VOR der Bewerbung bei deinem Bürgeramt holen. In Berlin wird der WBS nach Einkommensgrenzen ausgestellt · informiere dich direkt nach deiner Ankunft, die Wartelisten sind lang, aber es lohnt sich.",
        },
      },
      {
        h: { fr: "Résidences étudiantes (Studentenwohnheim)", en: "Student residences", de: "Studentenwohnheime" },
        list: [
          {
            fr: "Les Studierendenwerke gèrent des chambres à prix fixes (200-450 € selon la ville)",
            en: "Studierendenwerke run rooms at fixed prices (€200-450 depending on the city)",
            de: "Studierendenwerke bieten Zimmer zu festen Preisen (200-450 € je nach Stadt)",
          },
          {
            fr: "Inscris-toi dès que tu as ta confirmation d'études · les listes d'attente font 1-3 semestres",
            en: "Sign up as soon as you have your study confirmation · waiting lists run 1-3 semesters",
            de: "Melde dich an, sobald du deine Studienzusage hast · die Wartelisten betragen 1-3 Semester",
          },
          {
            fr: "Ouvert à beaucoup d'Azubis (apprentis) aussi dans certaines villes",
            en: "Open to many Azubis (apprentices) too in some cities",
            de: "In manchen Städten auch für viele Azubis offen",
          },
        ],
      },
      {
        h: { fr: "Solutions d'appoint pendant la recherche", en: "Stop-gap solutions while searching", de: "Übergangslösungen während der Suche" },
        list: [
          {
            fr: "Auberges de jeunesse et pensions à la semaine (le temps de visiter)",
            en: "Youth hostels and weekly pensions (while visiting)",
            de: "Jugendherbergen und Wochenpensionen (für Besichtigungen)",
          },
          {
            fr: "Sous-location (Untermiete) à court terme sur WG-Gesucht ou Kleinanzeigen",
            en: "Short-term sublet (Untermiete) on WG-Gesucht or Kleinanzeigen",
            de: "Kurzzeit-Untermiete auf WG-Gesucht oder Kleinanzeigen",
          },
          {
            fr: "Wohnung auf Zeit (location temporaire meublée) : plus cher mais sans dossier lourd",
            en: "Temporary furnished rentals: more expensive but lighter paperwork",
            de: "Möblierte Zwischenmiete: teurer, aber weniger Papierkram",
          },
        ],
      },
    ],
  },
];

/** Sélectionne la collection dans la bonne langue. */
export function getHousingGuides(lang: Lang): HousingGuideResolved[] {
  return HOUSING_GUIDES_BASE.map((g) => ({
    id: g.id,
    emoji: g.emoji,
    title: (g.title[lang] ?? g.title.fr) as string,
    summary: (g.summary[lang] ?? g.summary.fr) as string,
    sections: g.sections.map((s) => ({
      h: (s.h[lang] ?? s.h.fr) as string,
      p: s.p ? ((s.p[lang] ?? s.p.fr) as string) : undefined,
      list: s.list ? s.list.map((li) => (li[lang] ?? li.fr) as string) : undefined,
    })),
  }));
}

// Exports rétrocompatibles (la valeur FR par défaut)
export const HOUSING_GUIDES = HOUSING_GUIDES_BASE.map((g) => ({
  id: g.id,
  emoji: g.emoji,
  title: g.title.fr,
  summary: g.summary.fr,
  sections: g.sections.map((s) => ({
    h: s.h.fr,
    p: s.p?.fr,
    list: s.list?.map((li) => li.fr),
  })),
}));

export const HOUSING_LEGAL_NOTE_BY_LANG: Record<Lang, string> = {
  fr: "⚖️ PRONO ne copie et ne scrape aucune annonce : les recherches s'ouvrent directement sur les plateformes officielles (WG-Gesucht, ImmoScout24, Immowelt, Kleinanzeigen) où tu consultes et postules. Les fourchettes de loyers sont indicatives (constats 2025-2026 sur les annonces publiques) et varient selon le quartier.",
  en: "⚖️ PRONO doesn't copy or scrape any listing: searches open directly on the official platforms (WG-Gesucht, ImmoScout24, Immowelt, Kleinanzeigen) where you browse and apply. Rent ranges are indicative (2025-2026 observations on public listings) and vary by neighborhood.",
  de: "⚖️ PRONO kopiert und scrapt keine Anzeigen: Suchen öffnen sich direkt auf den offiziellen Plattformen (WG-Gesucht, ImmoScout24, Immowelt, Kleinanzeigen), wo du suchst und bewirbst. Mietpreisbereiche sind Richtwerte (2025-2026 aus öffentlichen Anzeigen) und variieren je nach Stadtteil.",
};
