/**
 * Données du MODULE PRONO-HOUSING — recherche de logement Allemagne.
 *
 * ⚖️ LÉGALITÉ : aucune annonce n'est copiée ni scrapée. Pronofoot construit
 * des LIENS de recherche officiels vers les plateformes (WG-Gesucht,
 * ImmoScout24, Immowelt) avec les filtres de l'utilisateur. Les visiteurs
 * consultent et postulent sur les sites originaux.
 *
 * Les IDs de villes WG-Gesucht et les slugs Immowelt ont été vérifiés
 * sur les URLs canoniques officielles (2026). Les fourchettes de loyers
 * sont des constats indicatifs issus des annonces publiques.
 */

// ============================================================
// Villes (13 plus grandes villes étudiantes/pro allemandes)
// ============================================================

export interface HousingCity {
  name: string;          // affichage FR
  wgSlug: string;        // slug WG-Gesucht (vérifié)
  wgId: number;          // ID ville WG-Gesucht (vérifié)
  immoweltSlug: string;  // slug Immowelt (vérifié)
  wgRoom: string;        // fourchette chambre en coloc (constat indicatif)
  coldRent: string;      // loyer froid indicatif €/m²
}

export const HOUSING_CITIES: HousingCity[] = [
  { name: "Berlin", wgSlug: "Berlin", wgId: 8, immoweltSlug: "berlin", wgRoom: "400 – 700 €", coldRent: "12 – 14 €/m²" },
  { name: "Hamburg", wgSlug: "Hamburg", wgId: 55, immoweltSlug: "hamburg", wgRoom: "500 – 850 €", coldRent: "13 – 15 €/m²" },
  { name: "München", wgSlug: "Muenchen", wgId: 90, immoweltSlug: "muenchen", wgRoom: "600 – 900 €", coldRent: "18 – 21 €/m²" },
  { name: "Köln", wgSlug: "Koeln", wgId: 73, immoweltSlug: "koeln", wgRoom: "400 – 700 €", coldRent: "12 – 14 €/m²" },
  { name: "Frankfurt am Main", wgSlug: "Frankfurt-am-Main", wgId: 41, immoweltSlug: "frankfurt-am-main", wgRoom: "450 – 750 €", coldRent: "13 – 16 €/m²" },
  { name: "Stuttgart", wgSlug: "Stuttgart", wgId: 124, immoweltSlug: "stuttgart", wgRoom: "350 – 700 €", coldRent: "14 – 16 €/m²" },
  { name: "Düsseldorf", wgSlug: "Duesseldorf", wgId: 30, immoweltSlug: "duesseldorf", wgRoom: "400 – 800 €", coldRent: "12 – 14 €/m²" },
  { name: "Leipzig", wgSlug: "Leipzig", wgId: 77, immoweltSlug: "leipzig", wgRoom: "250 – 470 €", coldRent: "8 – 10 €/m²" },
  { name: "Dresden", wgSlug: "Dresden", wgId: 27, immoweltSlug: "dresden", wgRoom: "280 – 480 €", coldRent: "8 – 10 €/m²" },
  { name: "Hannover", wgSlug: "Hannover", wgId: 57, immoweltSlug: "hannover", wgRoom: "300 – 600 €", coldRent: "9 – 11 €/m²" },
  { name: "Nürnberg", wgSlug: "Nuernberg", wgId: 96, immoweltSlug: "nuernberg", wgRoom: "300 – 600 €", coldRent: "10 – 12 €/m²" },
  { name: "Bremen", wgSlug: "Bremen", wgId: 17, immoweltSlug: "bremen", wgRoom: "280 – 450 €", coldRent: "9 – 11 €/m²" },
  { name: "Bonn", wgSlug: "Bonn", wgId: 13, immoweltSlug: "bonn", wgRoom: "300 – 600 €", coldRent: "11 – 13 €/m²" },
];

export type HousingType = "wg" | "apartment" | "studio";

export const HOUSING_TYPES: { value: HousingType; label: string; note: string }[] = [
  { value: "wg", label: "🛏️ WG / Colocation", note: "Le plus facile pour débuter en Allemagne" },
  { value: "apartment", label: "🏠 Appartement", note: "Wohnung — plus de dossier exigé" },
  { value: "studio", label: "🚪 Studio", note: "1-Zimmer-Wohnung" },
];

// ============================================================
// Construction des liens de recherche officiels (100% légal)
// ============================================================

export interface PlatformLink {
  name: string;
  emoji: string;
  url: string;
  note: string;
  legal: string;
}

export function buildPlatformLinks(
  city: HousingCity,
  type: HousingType,
  rentMax?: number
): PlatformLink[] {
  // WG-Gesucht : catégories 0=wg-zimmer, 1=1-zimmer-wohnungen, 2=wohnungen
  const wgCategory =
    type === "wg" ? ["wg-zimmer", 0] : type === "studio" ? ["1-zimmer-wohnungen", 1] : ["wohnungen", 2];

  const links: PlatformLink[] = [
    {
      name: "WG-Gesucht",
      emoji: "🛏️",
      url: `https://www.wg-gesucht.de/${wgCategory[0]}-in-${city.wgSlug}.${city.wgId}.${wgCategory[1]}.1.0.html`,
      note: type === "wg" ? "Le n°1 absolu des colocs en Allemagne" : "Colocs, appartements et studios",
      legal: "wg-gesucht.de",
    },
    {
      name: "ImmoScout24",
      emoji: "🔎",
      url: `https://www.immobilienscout24.de/Suche/de/wohnung-mieten?searchstring=${encodeURIComponent(city.name)}${rentMax ? `&price=-${rentMax}` : ""}`,
      note: "Le plus grand portail immobilier d'Allemagne",
      legal: "immobilienscout24.de",
    },
    {
      name: "Immowelt",
      emoji: "🏘️",
      url: `https://www.immowelt.de/liste/${city.immoweltSlug}/wohnungen/mieten${rentMax ? `?maxmiete=${rentMax}` : ""}`,
      note: "Excellente alternative, souvent moins de concurrence",
      legal: "immowelt.de",
    },
    {
      name: "Kleinanzeigen",
      emoji: "📌",
      url: "https://www.kleinanzeigen.de/s-wohnung-mieten/k0c203",
      note: "Petites annonces entre particuliers (ville à préciser sur place)",
      legal: "kleinanzeigen.de",
    },
  ];
  return links;
}

// ============================================================
// Générateur d'Anschreiben (lettre de motivation logement)
// ============================================================

export interface LetterData {
  target: "wg" | "apartment";
  name: string;
  age: string;
  country: string;
  profession: string; // ex : "cuisinier dans un restaurant" / "étudiant en informatique"
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

export function generateLetterDe(d: LetterData): string {
  const occ = d.profession
    ? `Aktuell bin ich als ${d.profession} tätig.`
    : "";
  const langs = [d.germanLevel !== "none" ? null : null].filter(Boolean).join("");
  const german = d.germanLevel && d.germanLevel !== "none" ? ` Meine Deutschkenntnisse liegen auf Niveau ${d.germanLevel}.` : "";
  const others = d.otherLanguages ? ` Außerdem spreche ich ${d.otherLanguages}.` : "";
  const hobbies = d.hobbies ? ` In meiner Freizeit ${d.hobbies}.` : "";

  if (d.target === "wg") {
    return `Betreff: Bewerbung um das WG-Zimmer${d.moveIn ? ` ab dem ${d.moveIn}` : ""}

Liebe zukünftige Mitbewohnerinnen und Mitbewohner,

mein Name ist ${d.name || "…"}${d.age ? `, ich bin ${d.age} Jahre alt` : ""}${d.country ? ` und komme aus ${d.country}` : ""}.${occ ? " " + occ : ""}

Ich suche ${d.moveIn ? `ab dem ${d.moveIn} ` : ""}ein Zimmer in ${d.city || "…"} und bin an einer längeren Aufenthaltsdauer interessiert. Mein Budget liegt bei maximal ${d.budget || "…"} € warm.${german}${others}${hobbies}

Zu mir: Ich bin zuverlässig, ordentlich und respektiere die Privatsphäre meiner Mitbewohner. Die Kaution ist für mich kein Problem, und alle Unterlagen (Einkommensnachweis, Mieterfragebogen) lege ich gerne vor.

Ich freue mich darauf, euch kennenzulernen!

Herzliche Grüße
${d.name || "…"}
${d.phone}${d.phone && d.email ? " · " : ""}${d.email}`;
  }

  return `Betreff: Bewerbung um die Wohnung${d.moveIn ? ` ab dem ${d.moveIn}` : ""}

Sehr geehrte Damen und Herren,

mein Name ist ${d.name || "…"}${d.age ? `, ich bin ${d.age} Jahre alt` : ""}${d.country ? ` und komme aus ${d.country}` : ""}.${occ ? " " + occ : ""}

Ich suche ${d.moveIn ? `ab dem ${d.moveIn} ` : ""}eine Wohnung in ${d.city || "…"} und bin an einer langfristigen Mietdauer interessiert. Mein Budget liegt bei maximal ${d.budget || "…"} € Warmmiete.${german}${others}

Meine finanzielle Situation ist stabil${d.income ? `: ${d.income}` : ""}. Die Kaution (drei Monatsmieten) ist für mich kein Problem. Selbstverständlich lege ich alle erforderlichen Unterlagen (Einkommensnachweise, Mieterfragebogen) gerne sofort vor.

Ich würde mich sehr über die Gelegenheit freuen, die Wohnung zu besichtigen.

Mit freundlichen Grüßen
${d.name || "…"}
${d.phone}${d.phone && d.email ? " · " : ""}${d.email}`;
}

export function generateLetterFr(d: LetterData): string {
  const occ = d.profession ? ` Actuellement je travaille comme ${d.profession}.` : "";
  const german = d.germanLevel && d.germanLevel !== "none" ? ` Mon allemand est de niveau ${d.germanLevel}.` : "";
  const others = d.otherLanguages ? ` Je parle aussi ${d.otherLanguages}.` : "";
  const hobbies = d.hobbies ? ` Pendant mon temps libre, ${d.hobbies}.` : "";

  if (d.target === "wg") {
    return `Objet : Candidature pour la chambre en colocation${d.moveIn ? ` à partir du ${d.moveIn}` : ""}

Chers futurs colocataires,

Je m'appelle ${d.name || "…"}${d.age ? `, j'ai ${d.age} ans` : ""}${d.country ? ` et je viens de ${d.country}` : ""}.${occ}

Je cherche ${d.moveIn ? `à partir du ${d.moveIn} ` : ""}une chambre à ${d.city || "…"} et je souhaite m'installer durablement. Mon budget est de ${d.budget || "…"} € maximum charges comprises.${german}${others}${hobbies}

Sur moi : je suis fiable, ordonné et je respecte l'espace de mes colocataires. Le dépôt de garantie ne me pose aucun problème et je fournis tous les documents (justificatif de revenus, questionnaire locataire) sur demande.

Je serais ravi(e) de vous rencontrer !

Bien cordialement,
${d.name || "…"}
${d.phone}${d.phone && d.email ? " · " : ""}${d.email}`;
  }

  return `Objet : Candidature pour l'appartement${d.moveIn ? ` à partir du ${d.moveIn}` : ""}

Madame, Monsieur,

Je m'appelle ${d.name || "…"}${d.age ? `, j'ai ${d.age} ans` : ""}${d.country ? ` et je viens de ${d.country}` : ""}.${occ}

Je cherche ${d.moveIn ? `à partir du ${d.moveIn} ` : ""}un appartement à ${d.city || "…"} et je souhaite une location durable. Mon budget est de ${d.budget || "…"} € maximum charges comprises.${german}${others}

Ma situation financière est stable${d.income ? ` : ${d.income}` : ""}. Le dépôt de garantie (trois mois de loyer) ne me pose aucun problème. Je fournis bien entendu immédiatement tous les documents demandés (justificatifs de revenus, questionnaire locataire).

Je serais très heureux(se) de pouvoir visiter l'appartement.

Cordialement,
${d.name || "…"}
${d.phone}${d.phone && d.email ? " · " : ""}${d.email}`;
}

// ============================================================
// Guides logement
// ============================================================

export interface HousingGuide {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  sections: { h: string; p?: string; list?: string[] }[];
}

export const HOUSING_GUIDES: HousingGuide[] = [
  {
    id: "methode",
    emoji: "🎯",
    title: "Trouver un logement en Allemagne — la méthode",
    summary: "Les bonnes plateformes, le bon calendrier et le bon rythme d'envoi des candidatures.",
    sections: [
      {
        h: "Par où commencer ?",
        list: [
          "WG-Gesucht : LE site des colocs — crée un profil complet AVEC photo, ça double les réponses",
          "ImmoScout24 et Immowelt : pour les appartements — active les alertes recherche (Suchauftrag)",
          "Kleinanzeigen : des pépites entre particuliers, sans agents",
          "Facebook Groups (« Wohnen in Berlin », « WG Zimmer + Stadt ») et les tableaux d'affichage des universités",
        ],
      },
      {
        h: "Le rythme qui marche",
        p: "À Berlin, Munich ou Hambourg, une annonce de coloc reçoit 50-200 messages dans les premières heures. Réponds dans les 30 minutes suivant la publication : active les notifications, envoie ta lettre type (générée ici même !) personnalisée d'une phrase, et rappelle par message si pas de réponse sous 24 h. Compte 30-80 candidatures pour décrocher un logement dans les villes tendues — c'est normal, ne lâche pas.",
      },
      {
        h: "La Bewerbung (candidature) parfaite",
        list: [
          "Une lettre courte et chaleureuse (le générateur Anschreiben de PRONO l'a écrite pour toi)",
          "Un profil WG-Gesucht complété : photo souriante, âge, profession, hobbies",
          "Tes disponibilités pour la visite (Besichtigung) dès le premier message",
          "Les documents prêts en PDF (voir le guide « dossier parfait »)",
        ],
      },
    ],
  },
  {
    id: "dossier",
    emoji: "📁",
    title: "Le dossier de candidature parfait (Unterlagen)",
    summary: "Les documents qu'un propriétaire allemand attend — prépare-les AVANT de chercher.",
    sections: [
      {
        h: "Les classiques demandés",
        list: [
          "Mieterfragebogen (questionnaire locataire) : rempli soigneusement",
          "Justificatifs de revenus : 3 derniers bulletins de salaire (Einkommensnachweise) ou contrat de travail",
          "SCHUFA-Auskunft : ton « score de crédit » allemand — vierge au début, ce n'est pas éliminatoire si tes revenus sont bons",
          "Copie du passeport / pièce d'identité",
          "Attestation de l'ancien propriétaire (Mietschuldenfreiheitsbescheinigung) si tu en as une",
        ],
      },
      {
        h: "Sans CDI ni historique allemand ?",
        list: [
          "Un garant (Bürge) : parent ou famille qui s'engage — son dossier remplace le tien",
          "Preuve d'épargne : relevé montrant 6-12 mois de loyer",
          "Pour les étudiants : notification de bourse (BAföG, DAAD…) ou compte bloqué",
          "Une lettre de motivation sincère : pour une coloc, l'humain compte autant que les chiffres",
        ],
      },
      {
        h: "Astuce pro",
        p: "Prépare un seul PDF de 5-6 pages (lettre + questionnaire + revenus + pièce d'identité) prêt à envoyer en 10 secondes. La rapidité est ton meilleur avantage face aux autres candidats.",
      },
    ],
  },
  {
    id: "loyers",
    emoji: "💶",
    title: "Comprendre les loyers allemands",
    summary: "Kaltmiete, Warmmiete, Nebenkosten, Kaution : le vrai coût d'un toit en Allemagne.",
    sections: [
      {
        h: "Kaltmiete vs Warmmiete",
        list: [
          "Kaltmiete (loyer froid) : le loyer de base, SANS charges",
          "Nebenkosten (charges) : chauffage, eau, électricité, assurance immeuble, poubelles — souvent 2-4 €/m² en plus",
          "Warmmiete (loyer chaud) : Kaltmiete + Nebenkosten = ce que tu paies réellement. TOUJOURS comparer en Warmmiete",
        ],
      },
      {
        h: "La Kaution (dépôt de garantie)",
        p: "Maximum 3 mois de Kaltmiete, souvent déposée sur un compte séquestre (Kautionskonto). Elle te est restituée avec intérêts au départ, moins les éventuels dégâts. Un propriétaire ne peut JAMAIS exiger la kaution en espèces ni avant la signature.",
      },
      {
        h: "Les autres coûts à prévoir",
        list: [
          "Rundfunkbeitrag : la redevance radio/TV, ~18 €/mois par logement (obligatoire)",
          "Strom (électricité) : 30-60 €/mois si non inclus",
          "Internet : 25-45 €/mois (à souscrire, souvent 1-2 semaines de délai)",
          "Provision d'agent : 0 € légalement pour la location simple (Bestellerprovision payée par le propriétaire) — si un agent te demande une provision pour une location simple, c'est suspect",
        ],
      },
      {
        h: "Budget réaliste par ville",
        p: "Utilise le tableau de référence de cette page : une chambre en coloc à Leipzig ou Dresde coûte souvent 2 fois moins cher qu'à Munich. Si ton budget est serré, élargis ta recherche aux villes de taille moyenne (région de la Ruhr, Saxe, villes du Nord) où le marché est plus détendu.",
      },
    ],
  },
  {
    id: "arnaques",
    emoji: "🚨",
    title: "Les arnaques à éviter absolument",
    summary: "Un logement « trop beau » à un prix cassé ? Voici les 4 pièges les plus courants.",
    sections: [
      {
        h: "Les signaux d'alarme",
        list: [
          "On te demande un virement (Western Union, Crypto, comptes étrangers) AVANT la visite — JAMAIS payer avant d'avoir visité et signé",
          "Le « propriétaire » est « à l'étranger » et veut t'envoyer les clés par la poste contre caution",
          "Des photos trop parfaites (souvent volées sur Airbnb), prix 40% sous le marché",
          "Refus de tout contact vidéo ou téléphonique",
        ],
      },
      {
        h: "Les règles d'or",
        list: [
          "Visite physique (ou visio en direct avec l'occupant) AVANT toute somme d'argent",
          "Paiement de la kaution uniquement après signature du bail, sur un compte allemand au nom du propriétaire",
          "Vérifie le propriétaire : nom sur le bail = nom du compte bancaire = nom sur l'annonce",
          "Sur Kleinanzeigen, l'option « paiement sécurisé » native protège les achats, PAS les locations",
        ],
      },
      {
        h: "Si tu as été victime",
        p: "Ne paye plus rien, conserve toutes les preuves (messages, IBAN, annonces) et dépose plainte à la police (Anzeige erstatten). En Allemagne, la Verbraucherzentrale (centre de protection du consommateur) conseille gratuitement les victimes d'arnaques au logement.",
      },
    ],
  },
  {
    id: "wbs",
    emoji: "🏛️",
    title: "WBS, logement social et alternatives",
    summary: "Le Wohnberechtigungsschein, les résidences étudiantes et autres solutions abordables.",
    sections: [
      {
        h: "Le WBS (Wohnberechtigungsschein)",
        p: "Le titre d'accès au logement social (municipal). Les logements WBS coûtent souvent 30-50% de moins que le marché, mais il faut remplir des conditions de revenus et l'obtenir auprès de ta mairie (Bürgeramt) AVANT de postuler. À Berlin, le WBS est délivré selon des plafonds de revenus — renseigne-toi dès ton arrivée, les listes d'attente sont longues mais ça vaut l'effort.",
      },
      {
        h: "Résidences étudiantes (Studentenwohnheim)",
        list: [
          "Les Studierendenwerke gèrent des chambres à prix fixes (200-450 € selon la ville)",
          "Inscris-toi dès que tu as ta confirmation d'études — les listes d'attente font 1-3 semestres",
          "Ouvert à beaucoup d'Azubis (apprentis) aussi dans certaines villes",
        ],
      },
      {
        h: "Solutions d'appoint pendant la recherche",
        list: [
          "Auberges de jeunesse et pensions à la semaine (le temps de visiter)",
          "Sous-location (Untermiete) à court terme sur WG-Gesucht ou Kleinanzeigen",
          "Wohnung auf Zeit (location temporaire meublée) : plus cher mais sans dossier lourd",
        ],
      },
    ],
  },
];

export const HOUSING_LEGAL_NOTE =
  "⚖️ PRONO ne copie et ne scrape aucune annonce : les recherches s'ouvrent directement sur les plateformes officielles (WG-Gesucht, ImmoScout24, Immowelt, Kleinanzeigen) où tu consultes et postules. Les fourchettes de loyers sont indicatives (constats 2025-2026 sur les annonces publiques) et varient selon le quartier.";
