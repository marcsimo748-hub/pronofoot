/**
 * Données du MODULE PRONOVISA — questionnaire, algorithme de score,
 * checklists de documents et articles conseils.
 *
 * ⚖️ IMPORTANT : le score est une ESTIMATION indicative inspirée des
 * critères publics (Chancenkarte, Ausbildung, Studium — make-it-in-germany.com).
 * Ce n'est NI une décision NI un conseil juridique : seule l'ambassade décide.
 */

// ============================================================
// Questionnaire
// ============================================================

export interface VisaAnswers {
  age: string;
  diploma: string;
  german: string;
  english: string;
  visaType: string;
  sector: string;
  situation: string;
  funding: string;
}

export const DEFAULT_ANSWERS: VisaAnswers = {
  age: "", diploma: "", german: "", english: "", visaType: "", sector: "", situation: "", funding: "",
};

export interface VisaQuestion {
  key: keyof VisaAnswers;
  icon: string;
  question: string;
  hint?: string;
  options: { value: string; label: string; sub?: string }[];
}

export const VISA_QUESTIONS: VisaQuestion[] = [
  {
    key: "visaType",
    icon: "🛂",
    question: "Quel est ton projet ?",
    hint: "Le type de visa détermine les critères évalués.",
    options: [
      { value: "ausbildung", label: "Ausbildung", sub: "Formation professionnelle rémunérée (dual)" },
      { value: "studium", label: "Studium", sub: "Études supérieures en Allemagne" },
      { value: "chancenkarte", label: "Chancenkarte", sub: "Carte opportunité : chercher un job sur place" },
      { value: "travail", label: "Visa de travail", sub: "Tu as (ou vises) un contrat en Allemagne" },
      { value: "tourisme", label: "Tourisme / Visite", sub: "Séjour court, famille, découverte" },
    ],
  },
  {
    key: "age",
    icon: "🎂",
    question: "Quel âge as-tu ?",
    options: [
      { value: "-18", label: "Moins de 18 ans" },
      { value: "18-24", label: "18 – 24 ans" },
      { value: "25-30", label: "25 – 30 ans" },
      { value: "31-35", label: "31 – 35 ans" },
      { value: "36-40", label: "36 – 40 ans" },
      { value: "40+", label: "Plus de 40 ans" },
    ],
  },
  {
    key: "diploma",
    icon: "🎓",
    question: "Ton plus haut diplôme ?",
    options: [
      { value: "none", label: "Pas encore de diplôme" },
      { value: "pro", label: "CAP / formation professionnelle" },
      { value: "bac", label: "Baccalauréat" },
      { value: "bac2", label: "BTS / DUT / Bac+2" },
      { value: "licence", label: "Licence / Bac+3" },
      { value: "master", label: "Master ou plus" },
    ],
  },
  {
    key: "german",
    icon: "🇩🇪",
    question: "Ton niveau d'allemand ?",
    hint: "Sois honnête : c'est LE critère n°1 pour la plupart des visas.",
    options: [
      { value: "none", label: "Aucun" },
      { value: "A1", label: "A1 — Premiers mots" },
      { value: "A2", label: "A2 — Bases" },
      { value: "B1", label: "B1 — Intermédiaire" },
      { value: "B2", label: "B2 — Avancé" },
      { value: "C1", label: "C1 / C2 — Autonome" },
    ],
  },
  {
    key: "english",
    icon: "🇬🇧",
    question: "Ton niveau d'anglais ?",
    options: [
      { value: "none", label: "Aucun / débutant" },
      { value: "A2", label: "A2" },
      { value: "B1", label: "B1" },
      { value: "B2", label: "B2 — Avancé" },
      { value: "C1", label: "C1 / C2 — Autonome" },
    ],
  },
  {
    key: "sector",
    icon: "🛠️",
    question: "Quel secteur vises-tu ?",
    hint: "L'Allemagne manque cruellement de personnel dans certains métiers.",
    options: [
      { value: "sante", label: "Santé / Soins / Social" },
      { value: "it", label: "Informatique / Télécoms" },
      { value: "btp", label: "BTP / Artisanat" },
      { value: "industrie", label: "Industrie / Technique" },
      { value: "transport", label: "Transport / Logistique" },
      { value: "hotellerie", label: "Hôtellerie / Restauration" },
      { value: "commerce", label: "Commerce / Services" },
      { value: "autre", label: "Autre / Je ne sais pas encore" },
    ],
  },
  {
    key: "situation",
    icon: "📦",
    question: "Où en es-tu dans ton dossier ?",
    options: [
      { value: "ready", label: "Tout est prêt", sub: "Diplômes traduits, moyens prouvés" },
      { value: "preparing", label: "Dossier en préparation" },
      { value: "starting", label: "Je débute mes recherches" },
      { value: "blocked", label: "Dossier bloqué / refus antérieur", sub: "On t'aide à comprendre" },
    ],
  },
  {
    key: "funding",
    icon: "💰",
    question: "Ton financement pour l'Allemagne ?",
    options: [
      { value: "blocked", label: "Compte bloqué / économies prouvées", sub: "≈ 11 904 €/an (étudiant)" },
      { value: "contract", label: "Contrat (Ausbildung / emploi)" },
      { value: "family", label: "Famille / garant en Allemagne" },
      { value: "none", label: "Pas encore de financement" },
    ],
  },
];

// ============================================================
// Barème (inspiré des critères publics — indicatif)
// ============================================================

const AGE_PTS: Record<string, number> = { "-18": 10, "18-24": 15, "25-30": 15, "31-35": 12, "36-40": 8, "40+": 5 };
const DIPLOMA_PTS: Record<string, number> = { none: 4, pro: 11, bac: 8, bac2: 11, licence: 13, master: 15 };
const GERMAN_PTS: Record<string, number> = { none: 0, A1: 3, A2: 5, B1: 10, B2: 13, C1: 15 };
const ENGLISH_PTS: Record<string, number> = { none: 0, A2: 2, B1: 3, B2: 5, C1: 6 };
const SECTOR_PTS: Record<string, number> = { sante: 10, it: 9, btp: 8, industrie: 8, transport: 7, hotellerie: 7, commerce: 5, autre: 3 };
const SITUATION_PTS: Record<string, number> = { ready: 12, preparing: 8, starting: 5, blocked: 0 };
const FUNDING_PTS: Record<string, number> = { blocked: 12, contract: 12, family: 8, none: 0 };
const MAX_POINTS = 85;

export interface VisaResult {
  score: number;          // 5-92 (jamais 100 : aucune promesse)
  level: "good" | "medium" | "hard" | "very-hard";
  levelLabel: string;
  summary: string;
  advices: string[];
  critical: string[];     // documents CRITIQUES pour ton cas
}

export function computeVisaScore(a: VisaAnswers): VisaResult {
  let pts =
    (AGE_PTS[a.age] ?? 0) +
    (DIPLOMA_PTS[a.diploma] ?? 0) +
    (GERMAN_PTS[a.german] ?? 0) +
    (ENGLISH_PTS[a.english] ?? 0) +
    (SECTOR_PTS[a.sector] ?? 0) +
    (SITUATION_PTS[a.situation] ?? 0) +
    (FUNDING_PTS[a.funding] ?? 0);

  const advices: string[] = [];
  const critical: string[] = [];

  // ----- Ajustements par type de visa -----
  if (a.visaType === "ausbildung" && !["B1", "B2", "C1"].includes(a.german)) {
    pts -= 8;
    advices.push("🗣️ Pour l'Ausbildung, l'allemand B1 est quasi indispensable (A2 parfois accepté pour les métiers en pénurie). Vise un certificat Goethe/telc B1 — c'est l'investissement le plus rentable.");
    critical.push("Attestation d'allemand B1 (Goethe, telc ou ÖSD)");
  }
  if (a.visaType === "studium") {
    if (a.diploma === "none") {
      pts -= 12;
      advices.push("🎓 Sans diplôme final (Bac minimum), l'accès direct aux études allemandes est bloqué. Passe d'abord le Bac, ou oriente-toi vers l'Ausbildung.");
      critical.push("Diplôme donnant accès aux études (Bac + reconnaissance anabin)");
    }
    if (a.funding === "none") {
      pts -= 6;
      advices.push("💰 Le compte bloqué (≈ 11 904 €/an, montant 2024-25 révisé chaque année) est LE critère qui bloque le plus d'étudiants. Commence à épargner ou trouve un garant.");
      critical.push("Compte bloqué (~11 904 €/an) ou garantie financière");
    }
  }
  if (a.visaType === "chancenkarte") {
    if (a.diploma === "none" || a.diploma === "bac") {
      pts -= 10;
      advices.push("📋 La Chancenkarte exige un diplôme reconnu (minimum 2 ans d'études supérieures) OU une qualification professionnelle + expérience. Vérifie ton diplôme sur anabin.kmk.org.");
      critical.push("Diplôme reconnu en Allemagne (vérification anabin)");
    }
    if (a.german === "none" && !["B2", "C1"].includes(a.english)) {
      pts -= 5;
      advices.push("🌐 La Chancenkarte exige au minimum allemand A1 OU anglais B2. Sans cela, la carte est refusée quelle que soit ta situation.");
      critical.push("Preuve de langue : allemand A1 ou anglais B2 minimum");
    }
    if (a.age === "40+") pts -= 4;
  }
  if (a.visaType === "tourisme" && a.funding === "none") {
    advices.push("💳 Pour un visa Schengen, les relevés bancaires des 3 derniers mois sont déterminants. Des réservations figitives + un compte faible = refus quasi certain.");
    critical.push("Relevés bancaires des 3 derniers mois");
  }
  if (a.german === "none" && a.visaType === "studium" && ["B2", "C1"].includes(a.english)) {
    advices.push("🇬🇧 Bonne nouvelle : des centaines de programmes 100% en anglais existent (avec IELTS/TOEFL). Pas besoin d'allemand pour étudier — mais apprends-en les bases pour la vie quotidienne.");
  }
  if (a.situation === "blocked") {
    advices.push("🔓 Un refus antérieur n'est PAS une fin : la lettre de refus indique toujours le motif exact (§ de la loi). Corrige précisément ce motif, ajoute les pièces manquantes et représente le dossier. Beaucoup de visas sont obtenus au 2ᵉ essai.");
  }
  if (a.sector === "sante" || a.sector === "it" || a.sector === "transport") {
    advices.push("⭐ Ton secteur est en pénurie officielle en Allemagne (Fachkräftemangel) : les employeurs accompagnent volontiers les démarches visa, parfois avec contrat de qualification.");
  }
  if (a.funding === "none" && a.visaType !== "tourisme") {
    critical.push("Preuve de moyens financiers (compte bloqué, contrat ou garant)");
  }
  if (a.situation === "starting") {
    advices.push("📆 Commence par les 3 fondations : 1) certificat de langue, 2) reconnaissance de diplôme (anabin/ZAB), 3) constitution d'un dossier physiquement propre. Tout le reste en découle.");
  }

  const score = Math.max(5, Math.min(92, Math.round((pts / MAX_POINTS) * 92)));

  const level: VisaResult["level"] =
    score >= 75 ? "good" : score >= 50 ? "medium" : score >= 25 ? "hard" : "very-hard";
  const levelLabel =
    level === "good"
      ? "🟢 Fort potentiel"
      : level === "medium"
        ? "🟡 Bonnes bases à consolider"
        : level === "hard"
          ? "🟠 Chemin exigeant mais réaliste"
          : "🔴 Difficile aujourd'hui — pas impossible";

  const summary =
    level === "good"
      ? "Ton profil coche les principales cases. Passe dès maintenant à la constitution du dossier et aux candidatures concrètes."
      : level === "medium"
        ? "Tu as de sérieux atouts. Concentre-toi sur les points faibles identifiés ci-dessous et ton score montera vite."
        : level === "hard"
          ? "Le chemin est exigeant mais des milliers de personnes y arrivent chaque année. Renforce les points critiques un par un."
          : "Aujourd'hui, les critères principaux ne sont pas réunis — mais chaque critère peut se travailler : langue, diplôme, financement. Rien n'est figé.";

  if (advices.length === 0) advices.push("✅ Continue : cours de langue réguliers, dossier bien traduit (assermenté) et candidatures ciblées dans ton secteur.");

  return { score, level, levelLabel, summary, advices: advices.slice(0, 5), critical };
}

// ============================================================
// Checklists de documents par type de visa
// ============================================================

export const VISA_CHECKLISTS: Record<string, { title: string; items: string[] }> = {
  ausbildung: {
    title: "📋 Dossier visa Ausbildung (§16a)",
    items: [
      "Passeport valide (+ 2 copies)",
      "Contrat de formation signé (Ausbildungsvertrag)",
      "Diplômes scolaires + traductions assermentées",
      "Attestation d'allemand (B1 recommandé)",
      "Photos biométriques conformes",
      "Formulaire de demande de visa (ambassade/consulat)",
      "Preuve de moyens financiers (salaire de formation ou garantie)",
      "Assurance santé valable dès l'arrivée",
      "CV format allemand (Lebenslauf) + lettre de motivation",
      "Justificatif de logement si déjà trouvé",
    ],
  },
  studium: {
    title: "📋 Dossier visa Étudiant (§16b)",
    items: [
      "Notification d'admission (Zulassungsbescheid) / uni-assist",
      "Diplôme + reconnaissance (anabin / ZAB)",
      "Compte bloqué (~11 904 €/an en 2024-25) ou garantie",
      "Test de langue (TestDaF/DSH) ou IELTS/TOEFL",
      "Passeport + formulaire + photos biométriques",
      "Assurance santé",
      "CV, lettre de motivation, relevés de notes traduits",
      "Certificat APS (selon ton pays — vérifie)",
    ],
  },
  chancenkarte: {
    title: "📋 Dossier Chancenkarte (carte opportunité)",
    items: [
      "Diplôme reconnu (vérification anabin) — la base",
      "Preuve de moyens financiers (subsistance 1 an)",
      "Allemand A1 minimum OU anglais B2 (obligatoire)",
      "Passeport + formulaire + photos",
      "CV détaillé (Lebenslauf)",
      "Justificatifs d'expérience professionnelle",
      "Attestations de langue supplémentaires (points bonus)",
      "Preuve d'un séjour antérieur en Allemagne (points bonus)",
    ],
  },
  travail: {
    title: "📋 Dossier visa Travail (§18)",
    items: [
      "Offre d'emploi concrète (contrat ou promesse d'embauche)",
      "Diplôme reconnu (anabin) ou qualification équivalente",
      "Description du poste (fait par l'employeur)",
      "Passeport + formulaire + photos",
      "CV + lettre de motivation",
      "Preuves d'expérience professionnelle (lettres, contrats)",
      "Assurance santé à l'arrivée",
    ],
  },
  tourisme: {
    title: "📋 Dossier visa Schengen (tourisme / visite)",
    items: [
      "Passeport (+ copies)",
      "Formulaire Schengen + photos biométriques",
      "Réservations d'hébergement + billets aller-retour",
      "Assurance voyage (≥ 30 000 € de couverture)",
      "Relevés bancaires des 3 derniers mois",
      "Invitation / Verpflichtungserklärung si hébergé par un résident",
      "Justificatif d'emploi ou d'études (lien avec le pays d'origine)",
      "Itinéraire approximatif du séjour",
    ],
  },
};

export const VISA_TYPE_LABELS: Record<string, string> = {
  ausbildung: "Ausbildung",
  studium: "Studium",
  chancenkarte: "Chancenkarte",
  travail: "Visa de travail",
  tourisme: "Tourisme / Visite",
};

// ============================================================
// Articles conseils
// ============================================================

export interface VisaArticle {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  sections: { h: string; p?: string; list?: string[] }[];
  links: { label: string; url: string }[];
}

export const VISA_ARTICLES: VisaArticle[] = [
  {
    id: "ausbildung",
    emoji: "🔧",
    title: "L'Ausbildung — la formation duale qui paie",
    summary:
      "Le système allemand de formation en entreprise + école, rémunéré. LA porte d'entrée n°1 pour les profils sans diplôme supérieur.",
    sections: [
      {
        h: "Comment ça marche ?",
        p: "L'Ausbildung dure 2 à 3,5 ans : tu travailles 3-4 jours en entreprise et 1-2 jours en école professionnelle (Berufsschule). Tu es PAYÉ pendant toute la formation — environ 650 à 1 300 €/mois selon le secteur et l'année. À la fin : un diplôme professionnel allemand reconnu, et très souvent un CDI dans l'entreprise.",
      },
      {
        h: "Les conditions",
        list: [
          "Un diplôme scolaire reconnu (le Bac suffit pour la plupart des métiers — vérifie sur anabin.kmk.org)",
          "Un contrat de formation signé par une entreprise allemande — c'est LA pièce maîtresse",
          "L'allemand B1 est quasi indispensable (B2 pour la santé ; A2 parfois accepté pour les métiers en pénurie : bâtiment, cuisine, logistique)",
          "Aucune limite d'âge officielle, mais 16-35 ans est le cœur de cible des entreprises",
        ],
      },
      {
        h: "Les secteurs qui recrutent le plus",
        list: [
          "Santé : infirmier(ère), aide-soignant(e) — pénurie massive",
          "BTP et artisanat : électricien, plombier, menuisier",
          "Hôtellerie-restauration : cuisinier, serveur",
          "Transport et logistique : mécatronicien, technicien",
        ],
      },
      {
        h: "Ta feuille de route",
        list: [
          "1. Atteins un allemand A2 solide, puis B1 (Goethe-Institut, telc, ÖSD)",
          "2. Traduis tes diplômes (traduction assermentée)",
          "3. Postule : make-it-in-germany.com, arbeitsagentur.de, azubi.de, indeed.de — un CV allemand (Lebenslauf) avec photo",
          "4. Décroche l'entretien vidéo, puis le contrat (Ausbildungsvertrag)",
          "5. Demande le visa §16a à l'ambassade 3 à 6 mois avant la rentrée",
          "6. Sur place : Anmeldung (adresse), compte bancaire, sécurité sociale",
        ],
      },
    ],
    links: [
      { label: "Make it in Germany — Ausbildung", url: "https://www.make-it-in-germany.com/fr/formation-professionnelle" },
      { label: "Reconnaissance de diplôme (anabin)", url: "https://anabin.kmk.org" },
    ],
  },
  {
    id: "studium",
    emoji: "🎓",
    title: "Le Studium — étudier en Allemagne",
    summary:
      "Des universités quasi gratuites (≈ 350 €/semestre de frais d'inscription), mais un dossier solide : admission, langue, finances.",
    sections: [
      {
        h: "Pourquoi l'Allemagne ?",
        p: "Les universités publiques allemandes sont presque gratuites (pas de frais de scolarité, seulement ~150-350 €/semestre incluant les transports). Des centaines de masters sont 100% en anglais. Le diplôme allemand est très valorisé sur le marché du travail, et tu peux travailler 140 jours complets par an en parallèle.",
      },
      {
        h: "Les 3 conditions clés",
        list: [
          "Admission : ton Bac doit être reconnu (anabin) ; pour le master, ta licence. Passe par uni-assist.de pour la plupart des universités",
          "Langue : TestDaF/DSH pour les programmes en allemand — IELTS/TOEFL pour les programmes en anglais",
          "Finances : compte bloqué d'environ 11 904 €/an (montant 2024-25, révisé chaque année) — c'est le mur n°1 des étudiants",
        ],
      },
      {
        h: "Bourses à connaître",
        list: [
          "DAAD (deutscher akademischer austauschdienst) — le plus grand organisme de bourses au monde",
          "Bourses des fondations politiques allemandes (Friedrich-Ebert, Konrad-Adenauer…)",
          "Erasmus Mundus (masters conjoints européens, fully funded)",
          "Bourses de ton pays d'origine (ex. bourses nationales, Mastercard Foundation)",
        ],
      },
      {
        h: "Calendrier réaliste",
        p: "Les rentrées sont en octobre (Wintersemester) et avril (Sommersemester). Compte 1 an de préparation : 3 mois pour les candidatures, 2-3 mois pour l'admission, 2-3 mois pour le visa. Demande le visa dès que tu as la notification d'admission (Zulassungsbescheid).",
      },
    ],
    links: [
      { label: "Make it in Germany — Étudier", url: "https://www.make-it-in-germany.com/fr/etudier" },
      { label: "DAAD — bourses", url: "https://www.daad.de/fr/" },
      { label: "uni-assist — candidatures", url: "https://www.uni-assist.de/en/" },
    ],
  },
  {
    id: "chancenkarte",
    emoji: "🎯",
    title: "La Chancenkarte — la carte opportunité",
    summary:
      "Depuis juin 2024 : un système de points pour venir chercher un emploi en Allemagne pendant 1 an, sans contrat préalable.",
    sections: [
      {
        h: "Le principe",
        p: "La Chancenkarte (Opportunity Card) permet de venir en Allemagne pendant 12 mois pour chercher un emploi ou une formation, avec le droit de travailler 20 h/semaine en parallèle. Pas besoin d'offre d'emploi à l'avance — ton profil doit atteindre 6 points.",
      },
      {
        h: "Les conditions de base (obligatoires)",
        list: [
          "Diplôme reconnu : minimum 2 ans d'études supérieures, OU formation professionnelle de 2 ans + 2 ans d'expérience, OU 3 ans d'expérience dans un métier qualifié",
          "Allemand A1 minimum OU anglais B2",
          "Preuve de subsistance pour 1 an (compte bloqué, garantie…)",
          "Reconnaissance du diplôme (anabin / ZAB)",
        ],
      },
      {
        h: "Comment gagner les 6 points",
        list: [
          "Qualification partiellement ou totalement reconnue : 1 à 4 points",
          "Expérience professionnelle (2 ans et +, métier en pénurie) : jusqu'à 3-4 points",
          "Âge : moins de 35 ans = 2 points ; 35-40 ans = 1 point",
          "Langue : allemand A2=1, B1=2, B2 ou + = 3 points ; anglais B2+ = 1 point (cumulable)",
          "Séjour antérieur en Allemagne = 1 point ; conjoint qualifié = 1 point",
        ],
      },
      {
        h: "Le piège à éviter",
        p: "Beaucoup de candidats échouent sur la preuve de subsistance : il faut pouvoir prouver vos moyens pour TOUTE l'année de recherche d'emploi. Sans cela, même 10 points ne suffisent pas.",
      },
    ],
    links: [
      { label: "Make it in Germany — Chancenkarte", url: "https://www.make-it-in-germany.com/fr/cartes-opportunites" },
      { label: "Simulateur officiel (points)", url: "https://www.make-it-in-germany.com/fr/cartes-opportunites/self-assessment" },
    ],
  },
  {
    id: "tourisme",
    emoji: "✈️",
    title: "Visa tourisme & visite familiale (Schengen)",
    summary:
      "Séjour jusqu'à 90 jours. Le refus vient presque toujours des mêmes 3 motifs — évitables.",
    sections: [
      {
        h: "Le dossier type",
        list: [
          "Passeport valide + formulaire Schengen + photos biométriques",
          "Assurance voyage d'au moins 30 000 € de couverture",
          "Réservations d'hébergement et billets aller-retour",
          "Relevés bancaires des 3 derniers mois (compte épargne si possible)",
          "Si hébergé par un résident : invitation formelle (Verpflichtungserklärung) signée à l'Ausländerbehörde",
          "Justificatif d'attache au pays : emploi, études, famille, propriété",
        ],
      },
      {
        h: "Les 3 motifs de refus classiques",
        list: [
          "Moyens financiers jugés insuffisants — prévois un budget clair d'environ 45-60 €/jour",
          "Doute sur le retour : pas assez d'attaches au pays d'origine (emploi stable, famille, loyer…)",
          "Hébergement ou itinéraire flou et incohérent",
        ],
      },
      {
        h: "Conseils pratiques",
        p: "Dépose la demande 1 à 3 mois avant le départ (délais longs dans beaucoup d'ambassades). Réponds honnêtement à l'entretien : la cohérence entre ton dossier et tes réponses est vérifiée. Un historique de voyages respectés (visas précédents bien utilisés) augmente fortement tes chances de visa multi-entrées.",
      },
    ],
    links: [
      { label: "Ministère allemand des Affaires étrangères", url: "https://www.auswaertiges-amt.de/fr" },
      { label: "Infos visa Schengen (Commission UE)", url: "https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_fr" },
    ],
  },
  {
    id: "europe",
    emoji: "🇪🇺",
    title: "Étudier ailleurs en Europe : France, Autriche, Belgique…",
    summary:
      "L'Allemagne n'est pas la seule porte : voici les alternatives européennes et leurs spécificités.",
    sections: [
      {
        h: "France 🇫🇷",
        list: [
          "Procédure Campus France obligatoire dans la plupart des pays africains (entretien + frais)",
          "Preuve financière : environ 615 €/mois (montant révisé régulièrement)",
          "Frais d'inscription universitaires très bas (~170-380 €/an en licence-master public) + CVEC",
          "Bourses : Eiffel, Bourses France Excellence, aides régionales",
          "Autorisation de travail : 964 heures/an (60% temps plein)",
        ],
      },
      {
        h: "Autriche 🇦🇹 / Belgique 🇧🇪 / Pays-Bas 🇳🇱",
        list: [
          "Autriche : qualité de vie excellente, frais modérés (~1 500 €/an hors UE), compte bloqué requis",
          "Belgique : frais sociaux universitaires raisonnables, preuve financière ~800 €/mois",
          "Pays-Bas : beaucoup de programmes en anglais mais frais élevés (2 000-15 000 €/an) — vise les bourses (Holland Scholarship, Orange Tulip)",
        ],
      },
      {
        h: "Pologne, Portugal, Tchéquie — les options économiques",
        p: "Frais entre 1 000 et 3 000 €/an, coût de la vie 30-50% plus bas qu'en Allemagne/France. L'anglais suffit dans beaucoup de programmes. Attention : vérifie toujours l'accréditation de l'établissement et la reconnaissance du diplôme dans l'UE avant de payer quoi que ce soit.",
      },
    ],
    links: [
      { label: "Campus France", url: "https://www.campusfrance.org" },
      { label: "Études en Europe (portail UE)", url: "https://european-union.europa.eu/index_fr" },
    ],
  },
  {
    id: "afrique",
    emoji: "🌍",
    title: "Étudiants africains → Europe : stratégie et pièges",
    summary:
      "Les bourses existent, les arnaques aussi. Comment monter un dossier qui passe et éviter les mauvaises surprises.",
    sections: [
      {
        h: "Les 3 vérités à accepter",
        list: [
          "Le critère n°1 des refus est financier : la preuve de moyens est vérifiée aussi rigoureusement que les diplômes",
          "Un dossier complet se prépare en 9 à 12 mois — pas en 3 semaines",
          "Aucune « agence » ne peut garantir un visa. Celui qui le promet est un fraudeur",
        ],
      },
      {
        h: "Les bourses réelles à cibler",
        list: [
          "Erasmus Mundus Joint Masters : fully funded, critères académiques, pas besoin d'être riche",
          "DAAD (Allemagne) : bourses de master et de recherche",
          "Chevening (Royaume-Uni), Eiffel (France), Mastercard Foundation (panafricain)",
          "Bourses d'excellence des universités elles-mêmes (cherche « scholarship » sur chaque site)",
        ],
      },
      {
        h: "Les pièges classiques",
        list: [
          "Fausses lettres d'admission vendues par des agences — vérifie chaque admission directement sur le site de l'université",
          "Faux comptes bancaires / « prêts » gonflés : l'ambassade vérifie l'origine des fonds — c'est un motif de refus définitif",
          "Établissements non accrédités : le diplôme ne vaudra rien, ni pour un emploi ni pour un renouvellement de titre",
          "« Formations » payantes en ligne sans reconnaissance : exige l'accréditation officielle",
        ],
      },
      {
        h: "Préparer l'entretien d'ambassade",
        p: "Prépare en 3 phrases : pourquoi CE programme, comment tu le finances, et ton projet de retour ou d'insertion régulière. La cohérence entre ta lettre de motivation, tes preuves financières et tes réponses orales fait la différence. Apporte toujours les originaux + copies de chaque document.",
      },
    ],
    links: [
      { label: "Erasmus Mundus (bourses complètes)", url: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en" },
      { label: "DAAD bourses pour l'Afrique", url: "https://www.daad.de/fr/" },
      { label: "Chevening", url: "https://www.chevening.org" },
    ],
  },
];

export const VISA_DISCLAIMER =
  "⚠️ Ceci est une estimation, pas un conseil juridique. Seuls l'ambassade, le consulat et l'Ausländerbehörde décident de l'attribution d'un visa. Les montants et critères évoluent : vérifie toujours les exigences à jour sur les sites officiels.";
