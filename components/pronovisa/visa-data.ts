/**
 * Données du MODULE PRONOVISA — questionnaire, algorithme de score,
 * checklists de documents et articles conseils.
 *
 * ⚖️ IMPORTANT : le score est une ESTIMATION indicative inspirée des
 * critères publics (Chancenkarte, Ausbildung, Studium — make-it-in-germany.com).
 * Ce n'est NI une décision NI un conseil juridique : seule l'ambassade décide.
 *
 * 🌍 Le contenu texte est disponible en 3 langues (FR / EN / DE).
 * `pickVisa(lang)` retourne le bon jeu de données.
 */

import type { Lang } from "@/lib/i18n";

// ============================================================
// Questionnaire (les valeurs sont partagées, les libellés sont traduits)
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

// Libellés des options par clé de question (les "values" restent les mêmes)
type QuestionsByLang = Record<Lang, VisaQuestion[]>;

// Chaque entrée "by lang" partage les mêmes values ; les libellés sont traduits via cette table
export const QUESTIONS_BY_LANG: QuestionsByLang = {
  fr: [
    { key: "visaType", icon: "🛂", question: "Quel est ton projet ?", hint: "Le type de visa détermine les critères évalués.",
      options: [
        { value: "ausbildung", label: "Ausbildung", sub: "Formation professionnelle rémunérée (dual)" },
        { value: "studium", label: "Studium", sub: "Études supérieures en Allemagne" },
        { value: "chancenkarte", label: "Chancenkarte", sub: "Carte opportunité : chercher un job sur place" },
        { value: "travail", label: "Visa de travail", sub: "Tu as (ou vises) un contrat en Allemagne" },
        { value: "tourisme", label: "Tourisme / Visite", sub: "Séjour court, famille, découverte" },
      ]},
    { key: "age", icon: "🎂", question: "Quel âge as-tu ?",
      options: [
        { value: "-18", label: "Moins de 18 ans" },
        { value: "18-24", label: "18 – 24 ans" },
        { value: "25-30", label: "25 – 30 ans" },
        { value: "31-35", label: "31 – 35 ans" },
        { value: "36-40", label: "36 – 40 ans" },
        { value: "40+", label: "Plus de 40 ans" },
      ]},
    { key: "diploma", icon: "🎓", question: "Ton plus haut diplôme ?",
      options: [
        { value: "none", label: "Pas encore de diplôme" },
        { value: "pro", label: "CAP / formation professionnelle" },
        { value: "bac", label: "Baccalauréat" },
        { value: "bac2", label: "BTS / DUT / Bac+2" },
        { value: "licence", label: "Licence / Bac+3" },
        { value: "master", label: "Master ou plus" },
      ]},
    { key: "german", icon: "🇩🇪", question: "Ton niveau d'allemand ?", hint: "Sois honnête : c'est LE critère n°1 pour la plupart des visas.",
      options: [
        { value: "none", label: "Aucun" },
        { value: "A1", label: "A1 · Premiers mots" },
        { value: "A2", label: "A2 · Bases" },
        { value: "B1", label: "B1 · Intermédiaire" },
        { value: "B2", label: "B2 · Avancé" },
        { value: "C1", label: "C1 / C2 · Autonome" },
      ]},
    { key: "english", icon: "🇬🇧", question: "Ton niveau d'anglais ?",
      options: [
        { value: "none", label: "Aucun / débutant" },
        { value: "A2", label: "A2" },
        { value: "B1", label: "B1" },
        { value: "B2", label: "B2 · Avancé" },
        { value: "C1", label: "C1 / C2 · Autonome" },
      ]},
    { key: "sector", icon: "🛠️", question: "Quel secteur vises-tu ?", hint: "L'Allemagne manque cruellement de personnel dans certains métiers.",
      options: [
        { value: "sante", label: "Santé / Soins / Social" },
        { value: "it", label: "Informatique / Télécoms" },
        { value: "btp", label: "BTP / Artisanat" },
        { value: "industrie", label: "Industrie / Technique" },
        { value: "transport", label: "Transport / Logistique" },
        { value: "hotellerie", label: "Hôtellerie / Restauration" },
        { value: "commerce", label: "Commerce / Services" },
        { value: "autre", label: "Autre / Je ne sais pas encore" },
      ]},
    { key: "situation", icon: "📦", question: "Où en es-tu dans ton dossier ?",
      options: [
        { value: "ready", label: "Tout est prêt", sub: "Diplômes traduits, moyens prouvés" },
        { value: "preparing", label: "Dossier en préparation" },
        { value: "starting", label: "Je débute mes recherches" },
        { value: "blocked", label: "Dossier bloqué / refus antérieur", sub: "On t'aide à comprendre" },
      ]},
    { key: "funding", icon: "💰", question: "Ton financement pour l'Allemagne ?",
      options: [
        { value: "blocked", label: "Compte bloqué / économies prouvées", sub: "≈ 11 904 €/an (étudiant)" },
        { value: "contract", label: "Contrat (Ausbildung / emploi)" },
        { value: "family", label: "Famille / garant en Allemagne" },
        { value: "none", label: "Pas encore de financement" },
      ]},
  ],
  en: [
    { key: "visaType", icon: "🛂", question: "What's your plan?", hint: "The visa type determines the criteria.",
      options: [
        { value: "ausbildung", label: "Ausbildung", sub: "Paid dual vocational training" },
        { value: "studium", label: "Studium", sub: "University studies in Germany" },
        { value: "chancenkarte", label: "Chancenkarte", sub: "Opportunity Card: look for a job on site" },
        { value: "travail", label: "Work visa", sub: "You have (or want) a contract in Germany" },
        { value: "tourisme", label: "Tourism / Visit", sub: "Short stay, family, discovery" },
      ]},
    { key: "age", icon: "🎂", question: "How old are you?",
      options: [
        { value: "-18", label: "Under 18" },
        { value: "18-24", label: "18 – 24 years" },
        { value: "25-30", label: "25 – 30 years" },
        { value: "31-35", label: "31 – 35 years" },
        { value: "36-40", label: "36 – 40 years" },
        { value: "40+", label: "Over 40" },
      ]},
    { key: "diploma", icon: "🎓", question: "Your highest diploma?",
      options: [
        { value: "none", label: "No diploma yet" },
        { value: "pro", label: "Vocational certificate" },
        { value: "bac", label: "High school diploma" },
        { value: "bac2", label: "Bachelor / Associate degree" },
        { value: "licence", label: "Bachelor (3+ years)" },
        { value: "master", label: "Master's or higher" },
      ]},
    { key: "german", icon: "🇩🇪", question: "Your German level?", hint: "Be honest: it's THE #1 criterion for most visas.",
      options: [
        { value: "none", label: "None" },
        { value: "A1", label: "A1 · First words" },
        { value: "A2", label: "A2 · Basics" },
        { value: "B1", label: "B1 · Intermediate" },
        { value: "B2", label: "B2 · Advanced" },
        { value: "C1", label: "C1 / C2 · Independent" },
      ]},
    { key: "english", icon: "🇬🇧", question: "Your English level?",
      options: [
        { value: "none", label: "None / beginner" },
        { value: "A2", label: "A2" },
        { value: "B1", label: "B1" },
        { value: "B2", label: "B2 · Advanced" },
        { value: "C1", label: "C1 / C2 · Independent" },
      ]},
    { key: "sector", icon: "🛠️", question: "Which sector are you targeting?", hint: "Germany is short of staff in several fields.",
      options: [
        { value: "sante", label: "Healthcare / Care / Social" },
        { value: "it", label: "IT / Telecom" },
        { value: "btp", label: "Construction / Crafts" },
        { value: "industrie", label: "Industry / Technical" },
        { value: "transport", label: "Transport / Logistics" },
        { value: "hotellerie", label: "Hotel / Restaurant" },
        { value: "commerce", label: "Retail / Services" },
        { value: "autre", label: "Other / Not sure yet" },
      ]},
    { key: "situation", icon: "📦", question: "Where are you in the process?",
      options: [
        { value: "ready", label: "Everything is ready", sub: "Translated diplomas, proof of funds" },
        { value: "preparing", label: "File in preparation" },
        { value: "starting", label: "Just starting research" },
        { value: "blocked", label: "Stuck / previous refusal", sub: "We'll help you understand" },
      ]},
    { key: "funding", icon: "💰", question: "Your funding for Germany?",
      options: [
        { value: "blocked", label: "Blocked account / proven savings", sub: "≈ €11,904/year (student)" },
        { value: "contract", label: "Contract (Ausbildung / job)" },
        { value: "family", label: "Family / sponsor in Germany" },
        { value: "none", label: "No funding yet" },
      ]},
  ],
  de: [
    { key: "visaType", icon: "🛂", question: "Was ist dein Plan?", hint: "Der Visumtyp bestimmt die Kriterien.",
      options: [
        { value: "ausbildung", label: "Ausbildung", sub: "Bezahlte duale Berufsausbildung" },
        { value: "studium", label: "Studium", sub: "Studium in Deutschland" },
        { value: "chancenkarte", label: "Chancenkarte", sub: "Chancenkarte: Jobsuche vor Ort" },
        { value: "travail", label: "Arbeitsvisum", sub: "Du hast (oder suchst) einen Vertrag in DE" },
        { value: "tourisme", label: "Tourismus / Besuch", sub: "Kurzurlaub, Familie, Entdeckung" },
      ]},
    { key: "age", icon: "🎂", question: "Wie alt bist du?",
      options: [
        { value: "-18", label: "Unter 18" },
        { value: "18-24", label: "18 – 24 Jahre" },
        { value: "25-30", label: "25 – 30 Jahre" },
        { value: "31-35", label: "31 – 35 Jahre" },
        { value: "36-40", label: "36 – 40 Jahre" },
        { value: "40+", label: "Über 40" },
      ]},
    { key: "diploma", icon: "🎓", question: "Dein höchster Abschluss?",
      options: [
        { value: "none", label: "Noch kein Abschluss" },
        { value: "pro", label: "Berufsabschluss" },
        { value: "bac", label: "Abitur / Matura" },
        { value: "bac2", label: "Bachelor / 2 Jahre Studium" },
        { value: "licence", label: "Bachelor (3+ Jahre)" },
        { value: "master", label: "Master oder höher" },
      ]},
    { key: "german", icon: "🇩🇪", question: "Dein Deutschlevel?", hint: "Sei ehrlich: das ist DAS Kriterium Nr. 1 für die meisten Visa.",
      options: [
        { value: "none", label: "Keine" },
        { value: "A1", label: "A1 · Erste Wörter" },
        { value: "A2", label: "A2 · Grundlagen" },
        { value: "B1", label: "B1 · Mittelstufe" },
        { value: "B2", label: "B2 · Fortgeschritten" },
        { value: "C1", label: "C1 / C2 · Selbstständig" },
      ]},
    { key: "english", icon: "🇬🇧", question: "Dein Englischlevel?",
      options: [
        { value: "none", label: "Keine / Anfänger" },
        { value: "A2", label: "A2" },
        { value: "B1", label: "B1" },
        { value: "B2", label: "B2 · Fortgeschritten" },
        { value: "C1", label: "C1 / C2 · Selbstständig" },
      ]},
    { key: "sector", icon: "🛠️", question: "Welcher Bereich?", hint: "In Deutschland fehlt in vielen Bereichen Personal.",
      options: [
        { value: "sante", label: "Gesundheit / Pflege / Soziales" },
        { value: "it", label: "IT / Telekommunikation" },
        { value: "btp", label: "Bau / Handwerk" },
        { value: "industrie", label: "Industrie / Technik" },
        { value: "transport", label: "Transport / Logistik" },
        { value: "hotellerie", label: "Hotel / Restaurant" },
        { value: "commerce", label: "Handel / Dienstleistungen" },
        { value: "autre", label: "Andere / Noch unklar" },
      ]},
    { key: "situation", icon: "📦", question: "Wie weit bist du?",
      options: [
        { value: "ready", label: "Alles bereit", sub: "Übersetzte Abschlüsse, Geldnachweis" },
        { value: "preparing", label: "Unterlagen in Vorbereitung" },
        { value: "starting", label: "Beginne gerade zu suchen" },
        { value: "blocked", label: "Blockiert / frühere Ablehnung", sub: "Wir helfen beim Verstehen" },
      ]},
    { key: "funding", icon: "💰", question: "Deine Finanzierung für Deutschland?",
      options: [
        { value: "blocked", label: "Sperrkonto / Ersparnisse nachgewiesen", sub: "≈ 11.904 €/Jahr (Student)" },
        { value: "contract", label: "Vertrag (Ausbildung / Job)" },
        { value: "family", label: "Familie / Bürge in Deutschland" },
        { value: "none", label: "Noch keine Finanzierung" },
      ]},
  ],
};

/** Helper rétrocompatible : renvoie les questions dans la langue courante. */
export function pickQuestions(lang: Lang): VisaQuestion[] {
  return QUESTIONS_BY_LANG[lang] ?? QUESTIONS_BY_LANG.fr;
}

// ============================================================
// Barème (les codes sont partagés ; les conseils sont traduits)
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

/** Conseils critiques par type de visa — version FR / EN / DE */
type AdviceItem = string[] | { advice: string[]; critical: string };
const ADVICE_TEMPLATES: Record<Lang, Record<string, AdviceItem>> = {
  fr: {
    ausbildung_noB1: {
      advice: ["🗣️ Pour l'Ausbildung, l'allemand B1 est quasi indispensable (A2 parfois accepté pour les métiers en pénurie). Vise un certificat Goethe/telc B1 · c'est l'investissement le plus rentable."],
      critical: "Attestation d'allemand B1 (Goethe, telc ou ÖSD)",
    },
    studium_noDiploma: {
      advice: ["🎓 Sans diplôme final (Bac minimum), l'accès direct aux études allemandes est bloqué. Passe d'abord le Bac, ou oriente-toi vers l'Ausbildung."],
      critical: "Diplôme donnant accès aux études (Bac + reconnaissance anabin)",
    },
    studium_noFunding: {
      advice: ["💰 Le compte bloqué (≈ 11 904 €/an, montant 2024-25 révisé chaque année) est LE critère qui bloque le plus d'étudiants. Commence à épargner ou trouve un garant."],
      critical: "Compte bloqué (~11 904 €/an) ou garantie financière",
    },
    chancenkarte_lowDiploma: {
      advice: ["📋 La Chancenkarte exige un diplôme reconnu (minimum 2 ans d'études supérieures) OU une qualification professionnelle + expérience. Vérifie ton diplôme sur anabin.kmk.org."],
      critical: "Diplôme reconnu en Allemagne (vérification anabin)",
    },
    chancenkarte_noLang: {
      advice: ["🌐 La Chancenkarte exige au minimum allemand A1 OU anglais B2. Sans cela, la carte est refusée quelle que soit ta situation."],
      critical: "Preuve de langue : allemand A1 ou anglais B2 minimum",
    },
    tourisme_noFunding: {
      advice: ["💳 Pour un visa Schengen, les relevés bancaires des 3 derniers mois sont déterminants. Des réservations figitives + un compte faible = refus quasi certain."],
      critical: "Relevés bancaires des 3 derniers mois",
    },
    generic_enOK: ["🇬🇧 Bonne nouvelle : des centaines de programmes 100% en anglais existent (avec IELTS/TOEFL). Pas besoin d'allemand pour étudier · mais apprends-en les bases pour la vie quotidienne."],
    generic_blocked: ["🔓 Un refus antérieur n'est PAS une fin : la lettre de refus indique toujours le motif exact (§ de la loi). Corrige précisément ce motif, ajoute les pièces manquantes et représente le dossier. Beaucoup de visas sont obtenus au 2ᵉ essai."],
    generic_shortage: ["⭐ Ton secteur est en pénurie officielle en Allemagne (Fachkräftemangel) : les employeurs accompagnent volontiers les démarches visa, parfois avec contrat de qualification."],
    generic_noFunding: {
      advice: ["Preuve de moyens financiers (compte bloqué, contrat ou garant)"],
      critical: "",
    },
    generic_starting: ["📆 Commence par les 3 fondations : 1) certificat de langue, 2) reconnaissance de diplôme (anabin/ZAB), 3) constitution d'un dossier physiquement propre. Tout le reste en découle."],
    generic_default: ["✅ Continue : cours de langue réguliers, dossier bien traduit (assermenté) et candidatures ciblées dans ton secteur."],
  },
  en: {
    ausbildung_noB1: {
      advice: ["🗣️ For Ausbildung, German B1 is almost mandatory (A2 is sometimes accepted for shortage jobs). Aim for a Goethe/telc B1 certificate · it's the smartest investment."],
      critical: "German B1 certificate (Goethe, telc or ÖSD)",
    },
    studium_noDiploma: {
      advice: ["🎓 Without a final diploma (high school minimum), direct access to German universities is blocked. Get your high school diploma first, or go for Ausbildung."],
      critical: "Diploma giving access to university (high school + anabin recognition)",
    },
    studium_noFunding: {
      advice: ["💰 The blocked account (≈ €11,904/year, 2024-25 amount, revised yearly) is THE criterion that blocks most students. Start saving or find a sponsor."],
      critical: "Blocked account (~€11,904/year) or financial guarantee",
    },
    chancenkarte_lowDiploma: {
      advice: ["📋 The Chancenkarte requires a recognized diploma (at least 2 years of higher studies) OR a vocational qualification + experience. Check your diploma on anabin.kmk.org."],
      critical: "Diploma recognized in Germany (anabin check)",
    },
    chancenkarte_noLang: {
      advice: ["🌐 The Chancenkarte requires at least German A1 OR English B2. Without it, the card is refused regardless of your situation."],
      critical: "Language proof: German A1 or English B2 minimum",
    },
    tourisme_noFunding: {
      advice: ["💳 For a Schengen visa, 3-month bank statements are decisive. Fake reservations + weak account = near-certain refusal."],
      critical: "Bank statements for the last 3 months",
    },
    generic_enOK: ["🇬🇧 Good news: hundreds of 100% English-taught programs exist (with IELTS/TOEFL). You don't need German to study · but learn the basics for daily life."],
    generic_blocked: ["🔓 A previous refusal is NOT the end: the refusal letter always states the exact reason (section of the law). Fix that specific issue, add the missing documents and re-apply. Many visas come on the 2nd try."],
    generic_shortage: ["⭐ Your sector is officially a shortage field in Germany (Fachkräftemangel): employers are happy to support visa procedures, sometimes with qualification contracts."],
    generic_noFunding: { advice: ["Proof of financial means (blocked account, contract, or sponsor)"], critical: "" },
    generic_starting: ["📆 Start with the 3 foundations: 1) language certificate, 2) diploma recognition (anabin/ZAB), 3) a clean physical file. Everything else follows."],
    generic_default: ["✅ Keep going: regular language classes, properly sworn-translated file, and targeted applications in your sector."],
  },
  de: {
    ausbildung_noB1: {
      advice: ["🗣️ Für die Ausbildung ist B1 fast unverzichtbar (A2 wird manchmal in Mangelberufen akzeptiert). Strebe ein Goethe/telc B1 an · das ist die sinnvollste Investition."],
      critical: "Deutschnachweis B1 (Goethe, telc oder ÖSD)",
    },
    studium_noDiploma: {
      advice: ["🎓 Ohne Abschluss (mindestens Abitur) ist der direkte Zugang zum deutschen Studium blockiert. Hol zuerst dein Abitur oder mach eine Ausbildung."],
      critical: "Studienzugangsberechtigung (Abitur + anabin-Anerkennung)",
    },
    studium_noFunding: {
      advice: ["💰 Das Sperrkonto (≈ 11.904 €/Jahr, Betrag 2024-25, wird jährlich angepasst) ist DAS Kriterium, das die meisten Studenten ausbremst. Fang an zu sparen oder finde einen Bürgen."],
      critical: "Sperrkonto (~11.904 €/Jahr) oder Bürgschaft",
    },
    chancenkarte_lowDiploma: {
      advice: ["📋 Die Chancenkarte verlangt einen anerkannten Abschluss (mindestens 2 Jahre Hochschule) ODER Berufsabschluss + Erfahrung. Prüfe deinen Abschluss auf anabin.kmk.org."],
      critical: "Anerkannter Abschluss in Deutschland (anabin-Prüfung)",
    },
    chancenkarte_noLang: {
      advice: ["🌐 Die Chancenkarte verlangt mindestens Deutsch A1 ODER Englisch B2. Ohne diesen Nachweis wird die Karte unabhängig von deiner Situation abgelehnt."],
      critical: "Sprachnachweis: Deutsch A1 oder Englisch B2 mindestens",
    },
    tourisme_noFunding: {
      advice: ["💳 Für ein Schengen-Visum sind Kontoauszüge der letzten 3 Monate entscheidend. Gefälschte Reservierungen + schwaches Konto = fast sicher Ablehnung."],
      critical: "Kontoauszüge der letzten 3 Monate",
    },
    generic_enOK: ["🇬🇧 Gute Nachricht: Hunderte 100% englischsprachige Programme existieren (mit IELTS/TOEFL). Du brauchst kein Deutsch zum Studieren · lerne aber die Basics für den Alltag."],
    generic_blocked: ["🔓 Eine frühere Ablehnung ist KEIN Ende: Der Ablehnungsbescheid nennt immer den genauen Grund (§ des Gesetzes). Behebe genau das, fehlende Unterlagen ergänzen, neu einreichen. Viele Visa kommen im 2. Versuch."],
    generic_shortage: ["⭐ Dein Bereich ist in Deutschland offiziell ein Mangelberuf (Fachkräftemangel): Arbeitgeber unterstützen das Visumsverfahren gern, manchmal mit Qualifizierungsvertrag."],
    generic_noFunding: { advice: ["Finanzierungsnachweis (Sperrkonto, Vertrag oder Bürge)"], critical: "" },
    generic_starting: ["📆 Fang mit den 3 Grundlagen an: 1) Sprachzertifikat, 2) Abschlussanerkennung (anabin/ZAB), 3) sauberes Dossier. Alles andere folgt."],
    generic_default: ["✅ Weiter so: regelmäßige Sprachkurse, sauber übersetztes Dossier und gezielte Bewerbungen in deinem Bereich."],
  },
};

/** Récupère le tableau de conseils d'un template (string ou objet {advice}). */
function adv(tpl: AdviceItem | undefined): string[] {
  if (!tpl) return [];
  if (Array.isArray(tpl)) return tpl;
  return tpl.advice;
}
/** Récupère le "critical" d'un template (string vide si pas applicable). */
function crit(tpl: AdviceItem | undefined): string {
  if (!tpl || Array.isArray(tpl)) return "";
  return tpl.critical ?? "";
}

export function computeVisaScore(a: VisaAnswers, lang: Lang = "fr"): VisaResult {
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
  const T = ADVICE_TEMPLATES[lang] ?? ADVICE_TEMPLATES.fr;

  // ----- Ajustements par type de visa -----
  if (a.visaType === "ausbildung" && !["B1", "B2", "C1"].includes(a.german)) {
    pts -= 8;
    advices.push(...adv(T.ausbildung_noB1));
    critical.push(crit(T.ausbildung_noB1));
  }
  if (a.visaType === "studium") {
    if (a.diploma === "none") {
      pts -= 12;
      advices.push(...adv(T.studium_noDiploma));
      critical.push(crit(T.studium_noDiploma));
    }
    if (a.funding === "none") {
      pts -= 6;
      advices.push(...adv(T.studium_noFunding));
      critical.push(crit(T.studium_noFunding));
    }
  }
  if (a.visaType === "chancenkarte") {
    if (a.diploma === "none" || a.diploma === "bac") {
      pts -= 10;
      advices.push(...adv(T.chancenkarte_lowDiploma));
      critical.push(crit(T.chancenkarte_lowDiploma));
    }
    if (a.german === "none" && !["B2", "C1"].includes(a.english)) {
      pts -= 5;
      advices.push(...adv(T.chancenkarte_noLang));
      critical.push(crit(T.chancenkarte_noLang));
    }
    if (a.age === "40+") pts -= 4;
  }
  if (a.visaType === "tourisme" && a.funding === "none") {
    advices.push(...adv(T.tourisme_noFunding));
    critical.push(crit(T.tourisme_noFunding));
  }
  if (a.german === "none" && a.visaType === "studium" && ["B2", "C1"].includes(a.english)) {
    advices.push(...adv(T.generic_enOK));
  }
  if (a.situation === "blocked") {
    advices.push(...adv(T.generic_blocked));
  }
  if (a.sector === "sante" || a.sector === "it" || a.sector === "transport") {
    advices.push(...adv(T.generic_shortage));
  }
  if (a.funding === "none" && a.visaType !== "tourisme") {
    critical.push(adv(T.generic_noFunding)[0] ?? '');
  }
  if (a.situation === "starting") {
    advices.push(...adv(T.generic_starting));
  }

  const score = Math.max(5, Math.min(92, Math.round((pts / MAX_POINTS) * 92)));

  const level: VisaResult["level"] =
    score >= 75 ? "good" : score >= 50 ? "medium" : score >= 25 ? "hard" : "very-hard";

  const labels = {
    good: { fr: "🟢 Fort potentiel", en: "🟢 Strong potential", de: "🟢 Starkes Potenzial" },
    medium: { fr: "🟡 Bonnes bases à consolider", en: "🟡 Good bases to build on", de: "🟡 Gute Grundlagen ausbauen" },
    hard: { fr: "🟠 Chemin exigeant mais réaliste", en: "🟠 Demanding but realistic", de: "🟠 Anspruchsvoll, aber realistisch" },
    "very-hard": { fr: "🔴 Difficile aujourd'hui · pas impossible", en: "🔴 Hard today · not impossible", de: "🔴 Heute schwierig · nicht unmöglich" },
  }[level] as Record<Lang, string>;

  const summary = ({
    good: { fr: "Ton profil coche les principales cases. Passe dès maintenant à la constitution du dossier et aux candidatures concrètes.",
            en: "Your profile hits the main boxes. Move now to assembling your file and applying concretely.",
            de: "Dein Profil passt zu den Hauptpunkten. Geh jetzt zur Dossier-Zusammenstellung und konkreten Bewerbungen." },
    medium: { fr: "Tu as de sérieux atouts. Concentre-toi sur les points faibles identifiés ci-dessous et ton score montera vite.",
              en: "You have strong assets. Focus on the weak points below and your score will rise fast.",
              de: "Du hast ernsthafte Stärken. Konzentriere dich auf die Schwächen unten und dein Score steigt schnell." },
    hard: { fr: "Le chemin est exigeant mais des milliers de personnes y arrivent chaque année. Renforce les points critiques un par un.",
            en: "The path is demanding, but thousands make it every year. Strengthen the critical points one by one.",
            de: "Der Weg ist anspruchsvoll, aber jedes Jahr schaffen ihn Tausende. Stärke die kritischen Punkte einzeln." },
    "very-hard": { fr: "Aujourd'hui, les critères principaux ne sont pas réunis · mais chaque critère peut se travailler : langue, diplôme, financement. Rien n'est figé.",
                   en: "Today the main criteria aren't met · but each can be worked on: language, diploma, funding. Nothing is set.",
                   de: "Heute sind die Hauptkriterien nicht erfüllt · aber jedes Kriterium lässt sich erarbeiten: Sprache, Abschluss, Finanzierung. Nichts ist fix." },
  }[level] as Record<Lang, string>);

  if (advices.length === 0) advices.push(...adv(T.generic_default));

  return { score, level, levelLabel: labels[lang] ?? labels.fr, summary: summary[lang] ?? summary.fr, advices: advices.slice(0, 5), critical };
}

// ============================================================
// Checklists de documents par type de visa (multilangues)
// ============================================================

type ItemList = { title: string; items: string[] };

export const VISA_CHECKLISTS: Record<Lang, Record<string, ItemList>> = {
  fr: {
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
        "Certificat APS (selon ton pays · vérifie)",
      ],
    },
    chancenkarte: {
      title: "📋 Dossier Chancenkarte (carte opportunité)",
      items: [
        "Diplôme reconnu (vérification anabin) · la base",
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
  },
  en: {
    ausbildung: {
      title: "📋 Ausbildung visa file (§16a)",
      items: ["Valid passport (+ 2 copies)", "Signed training contract (Ausbildungsvertrag)", "School diplomas + sworn translations", "German certificate (B1 recommended)", "Compliant biometric photos", "Visa application form (embassy/consulate)", "Proof of funds (training salary or guarantee)", "Health insurance valid on arrival", "German CV (Lebenslauf) + cover letter", "Housing proof if already found"],
    },
    studium: {
      title: "📋 Student visa file (§16b)",
      items: ["Admission notice (Zulassungsbescheid) / uni-assist", "Diploma + recognition (anabin / ZAB)", "Blocked account (~€11,904/year in 2024-25) or guarantee", "Language test (TestDaF/DSH) or IELTS/TOEFL", "Passport + form + biometric photos", "Health insurance", "CV, cover letter, transcripts translated", "APS certificate (depending on your country · check)"],
    },
    chancenkarte: {
      title: "📋 Chancenkarte file (opportunity card)",
      items: ["Recognized diploma (anabin check) · the base", "Proof of funds (1 year of subsistence)", "German A1 minimum OR English B2 (required)", "Passport + form + photos", "Detailed CV (Lebenslauf)", "Proof of work experience", "Additional language certificates (bonus points)", "Proof of prior stay in Germany (bonus points)"],
    },
    travail: {
      title: "📋 Work visa file (§18)",
      items: ["Concrete job offer (contract or promise)", "Recognized diploma (anabin) or equivalent qualification", "Job description (provided by employer)", "Passport + form + photos", "CV + cover letter", "Proof of work experience (letters, contracts)", "Health insurance on arrival"],
    },
    tourisme: {
      title: "📋 Schengen visa file (tourism / visit)",
      items: ["Passport (+ copies)", "Schengen form + biometric photos", "Accommodation bookings + round-trip tickets", "Travel insurance (≥ €30,000 coverage)", "Bank statements for the last 3 months", "Invitation / Verpflichtungserklärung if hosted", "Proof of employment or studies (ties to home country)", "Approximate itinerary"],
    },
  },
  de: {
    ausbildung: {
      title: "📋 Ausbildung-Visaakte (§16a)",
      items: ["Gültiger Reisepass (+ 2 Kopien)", "Unterzeichneter Ausbildungsvertrag", "Schulabschlüsse + beglaubigte Übersetzungen", "Deutschnachweis (B1 empfohlen)", "Biometrische Passfotos", "Visumsantragsformular (Botschaft/Konsulat)", "Finanzierungsnachweis (Ausbildungsgehalt oder Bürgschaft)", "Krankenversicherung ab Ankunft", "Deutscher Lebenslauf + Anschreiben", "Wohnungsnachweis, falls vorhanden"],
    },
    studium: {
      title: "📋 Studentenvisum (§16b)",
      items: ["Zulassungsbescheid / uni-assist", "Abschluss + Anerkennung (anabin / ZAB)", "Sperrkonto (~11.904 €/Jahr 2024-25) oder Bürgschaft", "Sprachtest (TestDaF/DSH) oder IELTS/TOEFL", "Reisepass + Formular + biometrische Fotos", "Krankenversicherung", "Lebenslauf, Anschreiben, übersetzte Noten", "APS-Zertifikat (je nach Land · prüfen)"],
    },
    chancenkarte: {
      title: "📋 Chancenkarte-Akte",
      items: ["Anerkannter Abschluss (anabin-Prüfung) · die Basis", "Finanzierungsnachweis (1 Jahr Unterhalt)", "Deutsch A1 mindestens ODER Englisch B2 (Pflicht)", "Reisepass + Formular + Fotos", "Detaillierter Lebenslauf", "Berufserfahrungsnachweise", "Weitere Sprachzertifikate (Bonuspunkte)", "Nachweis früherer Aufenthalte in Deutschland (Bonuspunkte)"],
    },
    travail: {
      title: "📋 Arbeitsvisum (§18)",
      items: ["Konkrete Stelle (Vertrag oder Zusicherung)", "Anerkannter Abschluss (anabin) oder gleichwertig", "Stellenbeschreibung (vom Arbeitgeber)", "Reisepass + Formular + Fotos", "Lebenslauf + Anschreiben", "Berufserfahrungsnachweise", "Krankenversicherung ab Ankunft"],
    },
    tourisme: {
      title: "📋 Schengen-Visum (Tourismus / Besuch)",
      items: ["Reisepass (+ Kopien)", "Schengen-Formular + biometrische Fotos", "Unterkunftsbuchungen + Hin- und Rückflugtickets", "Reiseversicherung (≥ 30.000 € Deckung)", "Kontoauszüge der letzten 3 Monate", "Einladung / Verpflichtungserklärung bei Privatunterkunft", "Beschäftigungs- oder Studiennachweis (Bindung zum Heimatland)", "Vorläufige Reiseroute"],
    },
  },
};

export const VISA_TYPE_LABELS: Record<Lang, Record<string, string>> = {
  fr: { ausbildung: "Ausbildung", studium: "Studium", chancenkarte: "Chancenkarte", travail: "Visa de travail", tourisme: "Tourisme / Visite" },
  en: { ausbildung: "Ausbildung", studium: "Studium", chancenkarte: "Chancenkarte", travail: "Work visa", tourisme: "Tourism / Visit" },
  de: { ausbildung: "Ausbildung", studium: "Studium", chancenkarte: "Chancenkarte", travail: "Arbeitsvisum", tourisme: "Tourismus / Besuch" },
};

// ============================================================
// Articles conseils (multilangues)
// ============================================================

export interface VisaArticle {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  sections: { h: string; p?: string; list?: string[] }[];
  links: { label: string; url: string }[];
}

const COMMON_LINKS = {
  makeitAusbildung: { label: { fr: "Make it in Germany · Ausbildung", en: "Make it in Germany · Ausbildung", de: "Make it in Germany · Ausbildung" }, url: "https://www.make-it-in-germany.com/fr/formation-professionnelle" },
  anabin: { label: { fr: "Reconnaissance de diplôme (anabin)", en: "Diploma recognition (anabin)", de: "Anerkennung von Abschlüssen (anabin)" }, url: "https://anabin.kmk.org" },
  makeitStudium: { label: { fr: "Make it in Germany · Étudier", en: "Make it in Germany · Studying", de: "Make it in Germany · Studium" }, url: "https://www.make-it-in-germany.com/fr/etudier" },
  daad: { label: { fr: "DAAD · bourses", en: "DAAD · scholarships", de: "DAAD · Stipendien" }, url: "https://www.daad.de/fr/" },
  uniAssist: { label: { fr: "uni-assist · candidatures", en: "uni-assist · applications", de: "uni-assist · Bewerbungen" }, url: "https://www.uni-assist.de/en/" },
  makeitChancen: { label: { fr: "Make it in Germany · Chancenkarte", en: "Make it in Germany · Chancenkarte", de: "Make it in Germany · Chancenkarte" }, url: "https://www.make-it-in-germany.com/fr/cartes-opportunites" },
  chancenSimu: { label: { fr: "Simulateur officiel (points)", en: "Official simulator (points)", de: "Offizieller Simulator (Punkte)" }, url: "https://www.make-it-in-germany.com/fr/cartes-opportunites/self-assessment" },
  aaa: { label: { fr: "Ministère allemand des Affaires étrangères", en: "German Foreign Office", de: "Auswärtiges Amt" }, url: "https://www.auswaertiges-amt.de/fr" },
  schengen: { label: { fr: "Infos visa Schengen (Commission UE)", en: "Schengen visa info (EU Commission)", de: "Schengen-Visa-Infos (EU-Kommission)" }, url: "https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_fr" },
  campusfr: { label: { fr: "Campus France", en: "Campus France", de: "Campus France" }, url: "https://www.campusfrance.org" },
  euPortal: { label: { fr: "Études en Europe (portail UE)", en: "Studying in Europe (EU portal)", de: "Studium in Europa (EU-Portal)" }, url: "https://european-union.europa.eu/index_fr" },
  erasmus: { label: { fr: "Erasmus Mundus (bourses complètes)", en: "Erasmus Mundus (full scholarships)", de: "Erasmus Mundus (volle Stipendien)" }, url: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en" },
  daadAfric: { label: { fr: "DAAD bourses pour l'Afrique", en: "DAAD scholarships for Africa", de: "DAAD-Stipendien für Afrika" }, url: "https://www.daad.de/fr/" },
  chevening: { label: { fr: "Chevening", en: "Chevening", de: "Chevening" }, url: "https://www.chevening.org" },
};

const link = (key: keyof typeof COMMON_LINKS, lang: Lang) => ({
  label: COMMON_LINKS[key].label[lang],
  url: COMMON_LINKS[key].url,
});

function buildArticles(lang: Lang): VisaArticle[] {
  const L = { fr: "fr", en: "en", de: "de" } as const;
  const LANG = lang;
  return [
    {
      id: "ausbildung",
      emoji: "🔧",
      title: LANG === "fr" ? "L'Ausbildung · la formation duale qui paie" : LANG === "en" ? "Ausbildung · the dual training that pays" : "Ausbildung · die duale Ausbildung, die sich auszahlt",
      summary: LANG === "fr" ? "Le système allemand de formation en entreprise + école, rémunéré. LA porte d'entrée n°1 pour les profils sans diplôme supérieur."
            : LANG === "en" ? "German in-company + school training, paid. THE #1 entry path for profiles without higher education."
            : "Deutsches System aus Betrieb + Schule, bezahlt. DER Einstiegsweg Nr. 1 für Profile ohne Hochschulabschluss.",
      sections: LANG === "fr" ? [
        { h: "Comment ça marche ?", p: "L'Ausbildung dure 2 à 3,5 ans : tu travailles 3-4 jours en entreprise et 1-2 jours en école professionnelle (Berufsschule). Tu es PAYÉ pendant toute la formation : environ 650 à 1 300 €/mois selon le secteur et l'année. À la fin : un diplôme professionnel allemand reconnu, et très souvent un CDI dans l'entreprise." },
        { h: "Les conditions", list: ["Un diplôme scolaire reconnu (le Bac suffit pour la plupart des métiers : vérifie sur anabin.kmk.org)", "Un contrat de formation signé par une entreprise allemande : c'est LA pièce maîtresse", "L'allemand B1 est quasi indispensable (B2 pour la santé ; A2 parfois accepté pour les métiers en pénurie : bâtiment, cuisine, logistique)", "Aucune limite d'âge officielle, mais 16-35 ans est le cœur de cible des entreprises"] },
        { h: "Les secteurs qui recrutent le plus", list: ["Santé : infirmier(ère), aide-soignant(e) : pénurie massive", "BTP et artisanat : électricien, plombier, menuisier", "Hôtellerie-restauration : cuisinier, serveur", "Transport et logistique : mécatronicien, technicien"] },
        { h: "Ta feuille de route", list: ["1. Atteins un allemand A2 solide, puis B1 (Goethe-Institut, telc, ÖSD)", "2. Traduis tes diplômes (traduction assermentée)", "3. Postule : make-it-in-germany.com, arbeitsagentur.de, azubi.de, indeed.de : un CV allemand (Lebenslauf) avec photo", "4. Décroche l'entretien vidéo, puis le contrat (Ausbildungsvertrag)", "5. Demande le visa §16a à l'ambassade 3 à 6 mois avant la rentrée", "6. Sur place : Anmeldung (adresse), compte bancaire, sécurité sociale"] },
      ] : LANG === "en" ? [
        { h: "How does it work?", p: "Ausbildung lasts 2 to 3.5 years: 3-4 days a week in the company and 1-2 days at vocational school (Berufsschule). You're PAID the whole time: about 650 to 1,300 €/month depending on sector and year. At the end: a recognized German vocational diploma, and very often a permanent contract (CDI)." },
        { h: "Requirements", list: ["A recognized school diploma (high school works for most jobs: check anabin.kmk.org)", "A signed training contract by a German company: THE key document", "German B1 is almost mandatory (B2 for healthcare; A2 sometimes accepted for shortage jobs: construction, kitchen, logistics)", "No official age limit, but 16-35 is the target sweet spot for companies"] },
        { h: "Most in-demand sectors", list: ["Healthcare: nurse, care assistant: massive shortage", "Construction & crafts: electrician, plumber, carpenter", "Hospitality: cook, server", "Transport & logistics: mechatronics, technician"] },
        { h: "Your roadmap", list: ["1. Reach solid German A2, then B1 (Goethe-Institut, telc, ÖSD)", "2. Translate diplomas (sworn translation)", "3. Apply: make-it-in-germany.com, arbeitsagentur.de, azubi.de, indeed.de with a German CV (Lebenslauf) including your photo", "4. Ace the video interview, then sign the contract (Ausbildungsvertrag)", "5. Apply for the §16a visa 3 to 6 months before start", "6. On site: Anmeldung (address), bank account, social security"] },
      ] : [
        { h: "Wie funktioniert es?", p: "Die Ausbildung dauert 2 bis 3,5 Jahre: 3-4 Tage im Betrieb und 1-2 Tage in der Berufsschule. Du bist die ganze Zeit BEZAHLT: etwa 650 bis 1.300 €/Monat, je nach Bereich und Jahr. Am Ende: ein anerkannter deutscher Berufsabschluss und meist ein unbefristeter Vertrag." },
        { h: "Bedingungen", list: ["Anerkannter Schulabschluss (Abitur reicht für die meisten Berufe: anabin.kmk.org prüfen)", "Unterzeichneter Ausbildungsvertrag mit deutschem Betrieb: DAS Kerndokument", "Deutsch B1 ist quasi Pflicht (B2 in der Pflege; A2 manchmal in Mangelberufen akzeptiert: Bau, Küche, Logistik)", "Keine offizielle Altersgrenze, aber 16-35 ist die Zielgruppe der Unternehmen"] },
        { h: "Gefragteste Bereiche", list: ["Pflege: Krankenpfleger/in, Pflegehelfer/in: massiver Mangel", "Bau & Handwerk: Elektriker, Klempner, Schreiner", "Gastronomie: Koch, Servicekraft", "Transport & Logistik: Mechatroniker, Techniker"] },
        { h: "Dein Fahrplan", list: ["1. Solides Deutsch A2, dann B1 erreichen (Goethe-Institut, telc, ÖSD)", "2. Abschlüsse übersetzen (beglaubigte Übersetzung)", "3. Bewerben: make-it-in-germany.com, arbeitsagentur.de, azubi.de, indeed.de mit deutschem Lebenslauf + Foto", "4. Videointerview bestehen, dann Vertrag unterschreiben", "5. Visum §16a 3 bis 6 Monate vor Start beantragen", "6. Vor Ort: Anmeldung, Bankkonto, Sozialversicherung"] },
      ],
      links: [link("makeitAusbildung", LANG), link("anabin", LANG)],
    },
    {
      id: "studium",
      emoji: "🎓",
      title: LANG === "fr" ? "Le Studium · étudier en Allemagne" : LANG === "en" ? "Studium · studying in Germany" : "Studium · Studieren in Deutschland",
      summary: LANG === "fr" ? "Des universités quasi gratuites (≈ 350 €/semestre de frais d'inscription), mais un dossier solide : admission, langue, finances."
            : LANG === "en" ? "Almost-free universities (~€350 per semester in fees), but a solid file: admission, language, finances."
            : "Nahezu kostenlose Universitäten (~350 €/Semester), aber solides Dossier: Zulassung, Sprache, Finanzen.",
      sections: LANG === "fr" ? [
        { h: "Pourquoi l'Allemagne ?", p: "Les universités publiques allemandes sont presque gratuites (pas de frais de scolarité, seulement ~150-350 €/semestre incluant les transports). Des centaines de masters sont 100% en anglais. Le diplôme allemand est très valorisé sur le marché du travail, et tu peux travailler 140 jours complets par an en parallèle." },
        { h: "Les 3 conditions clés", list: ["Admission : ton Bac doit être reconnu (anabin) ; pour le master, ta licence. Passe par uni-assist.de pour la plupart des universités", "Langue : TestDaF/DSH pour les programmes en allemand : IELTS/TOEFL pour les programmes en anglais", "Finances : compte bloqué d'environ 11 904 €/an (montant 2024-25, révisé chaque année) : c'est le mur n°1 des étudiants"] },
        { h: "Bourses à connaître", list: ["DAAD (deutscher akademischer austauschdienst) : le plus grand organisme de bourses au monde", "Bourses des fondations politiques allemandes (Friedrich-Ebert, Konrad-Adenauer…)", "Erasmus Mundus (masters conjoints européens, fully funded)", "Bourses de ton pays d'origine (ex. bourses nationales, Mastercard Foundation)"] },
        { h: "Calendrier réaliste", p: "Les rentrées sont en octobre (Wintersemester) et avril (Sommersemester). Compte 1 an de préparation : 3 mois pour les candidatures, 2-3 mois pour l'admission, 2-3 mois pour le visa. Demande le visa dès que tu as la notification d'admission (Zulassungsbescheid)." },
      ] : LANG === "en" ? [
        { h: "Why Germany?", p: "German public universities are almost free (no tuition, only ~€150-350/semester including transport). Hundreds of master's programs are 100% in English. The German degree is highly valued on the job market, and you can work 140 full days a year on the side." },
        { h: "The 3 key conditions", list: ["Admission: your high school diploma must be recognized (anabin); for master's, your bachelor's. Go through uni-assist.de for most universities", "Language: TestDaF/DSH for German programs; IELTS/TOEFL for English programs", "Funds: blocked account of about €11,904/year (2024-25 amount, revised yearly): the #1 wall for students"] },
        { h: "Scholarships to know", list: ["DAAD (German Academic Exchange Service): the world's largest scholarship organization", "Political foundation scholarships (Friedrich-Ebert, Konrad-Adenauer, etc.)", "Erasmus Mundus (joint European master's, fully funded)", "Scholarships from your home country (national awards, Mastercard Foundation)"] },
        { h: "Realistic timeline", p: "Intakes are in October (Wintersemester) and April (Sommersemester). Plan 1 year of prep: 3 months for applications, 2-3 months for admission, 2-3 months for the visa. Apply for the visa as soon as you have the admission notice (Zulassungsbescheid)." },
      ] : [
        { h: "Warum Deutschland?", p: "Deutsche öffentliche Universitäten sind nahezu kostenlos (keine Studiengebühren, nur ~150-350 €/Semester inkl. Nahverkehr). Hunderte Master sind 100% auf Englisch. Der deutsche Abschluss ist auf dem Arbeitsmarkt sehr geschätzt, und du kannst 140 volle Tage pro Jahr jobben." },
        { h: "Die 3 Hauptbedingungen", list: ["Zulassung: dein Abitur muss anerkannt sein (anabin); für den Master dein Bachelor. Über uni-assist.de für die meisten Unis", "Sprache: TestDaF/DSH für deutsche Studiengänge; IELTS/TOEFL für englische", "Finanzen: Sperrkonto mit ca. 11.904 €/Jahr (Betrag 2024-25, wird jährlich angepasst): das ist DIE Wand für Studenten"] },
        { h: "Stipendien im Überblick", list: ["DAAD (deutscher akademischer Austauschdienst): weltweit größte Stipendienorganisation", "Stipendien der politischen Stiftungen (Friedrich-Ebert, Konrad-Adenauer usw.)", "Erasmus Mundus (gemeinsame europäische Master, voll finanziert)", "Heimat-Stipendien (z. B. nationale Programme, Mastercard Foundation)"] },
        { h: "Realistischer Zeitplan", p: "Semesterbeginn ist im Oktober (Wintersemester) und April (Sommersemester). Rechne 1 Jahr Vorbereitung: 3 Monate Bewerbungen, 2-3 Monate Zulassung, 2-3 Monate Visum. Visum beantragen, sobald die Zulassung (Zulassungsbescheid) da ist." },
      ],
      links: [link("makeitStudium", LANG), link("daad", LANG), link("uniAssist", LANG)],
    },
    {
      id: "chancenkarte",
      emoji: "🎯",
      title: LANG === "fr" ? "La Chancenkarte · la carte opportunité" : LANG === "en" ? "Chancenkarte · the opportunity card" : "Chancenkarte · die Chancenkarte",
      summary: LANG === "fr" ? "Depuis juin 2024 : un système de points pour venir chercher un emploi en Allemagne pendant 1 an, sans contrat préalable."
            : LANG === "en" ? "Since June 2024: a points system to come to Germany and look for a job for 1 year, no prior contract needed."
            : "Seit Juni 2024: Punktesystem, um 1 Jahr in Deutschland einen Job zu suchen, ohne Vorvertrag.",
      sections: LANG === "fr" ? [
        { h: "Le principe", p: "La Chancenkarte (Opportunity Card) permet de venir en Allemagne pendant 12 mois pour chercher un emploi ou une formation, avec le droit de travailler 20 h/semaine en parallèle. Pas besoin d'offre d'emploi à l'avance : ton profil doit atteindre 6 points." },
        { h: "Les conditions de base (obligatoires)", list: ["Diplôme reconnu : minimum 2 ans d'études supérieures, OU formation professionnelle de 2 ans + 2 ans d'expérience, OU 3 ans d'expérience dans un métier qualifié", "Allemand A1 minimum OU anglais B2", "Preuve de subsistance pour 1 an (compte bloqué, garantie…)", "Reconnaissance du diplôme (anabin / ZAB)"] },
        { h: "Comment gagner les 6 points", list: ["Qualification partiellement ou totalement reconnue : 1 à 4 points", "Expérience professionnelle (2 ans et +, métier en pénurie) : jusqu'à 3-4 points", "Âge : moins de 35 ans = 2 points ; 35-40 ans = 1 point", "Langue : allemand A2=1, B1=2, B2 ou + = 3 points ; anglais B2+ = 1 point (cumulable)", "Séjour antérieur en Allemagne = 1 point ; conjoint qualifié = 1 point"] },
        { h: "Le piège à éviter", p: "Beaucoup de candidats échouent sur la preuve de subsistance : il faut pouvoir prouver vos moyens pour TOUTE l'année de recherche d'emploi. Sans cela, même 10 points ne suffisent pas." },
      ] : LANG === "en" ? [
        { h: "How it works", p: "The Chancenkarte (Opportunity Card) lets you come to Germany for 12 months to look for a job or training, with the right to work 20 h/week. You don't need a job offer upfront · your profile must reach 6 points." },
        { h: "Base requirements (mandatory)", list: ["Recognized diploma: at least 2 years of higher education, OR vocational training of 2 years + 2 years experience, OR 3 years of experience in a qualified trade", "German A1 minimum OR English B2", "Proof of funds for 1 year (blocked account, guarantee, etc.)", "Diploma recognition (anabin / ZAB)"] },
        { h: "How to earn 6 points", list: ["Partially or fully recognized qualification: 1 to 4 points", "Work experience (2+ years, shortage sector): up to 3-4 points", "Age: under 35 = 2 points; 35-40 = 1 point", "Language: German A2=1, B1=2, B2+ = 3 points; English B2+ = 1 point (stacking)", "Prior stay in Germany = 1 point; qualified spouse = 1 point"] },
        { h: "Pitfall to avoid", p: "Many candidates fail on the funding proof: you must prove means for the WHOLE job-search year. Without it, even 10 points aren't enough." },
      ] : [
        { h: "Das Prinzip", p: "Die Chancenkarte erlaubt es, 12 Monate nach Deutschland zu kommen, um einen Job oder eine Ausbildung zu suchen, mit dem Recht, 20 Std./Woche zu arbeiten. Du brauchst vorher kein Stellenangebot · dein Profil muss 6 Punkte erreichen." },
        { h: "Grundbedingungen (Pflicht)", list: ["Anerkannter Abschluss: mindestens 2 Jahre Hochschule ODER 2 Jahre Berufsausbildung + 2 Jahre Erfahrung ODER 3 Jahre Erfahrung in einem qualifizierten Beruf", "Deutsch A1 mindestens ODER Englisch B2", "Finanzierungsnachweis für 1 Jahr (Sperrkonto, Bürgschaft …)", "Anerkennung des Abschlusses (anabin / ZAB)"] },
        { h: "Wie man die 6 Punkte sammelt", list: ["Teilweise oder vollständig anerkannte Qualifikation: 1 bis 4 Punkte", "Berufserfahrung (2+ Jahre, Mangelberuf): bis zu 3-4 Punkte", "Alter: unter 35 = 2 Punkte; 35-40 = 1 Punkt", "Sprache: Deutsch A2=1, B1=2, B2+ = 3 Punkte; Englisch B2+ = 1 Punkt (kombinierbar)", "Früherer Aufenthalt in Deutschland = 1 Punkt; qualifizierter Partner = 1 Punkt"] },
        { h: "Häufige Falle", p: "Viele scheitern am Finanzierungsnachweis: du musst die Mittel für das GANZE Jahr Jobsuche nachweisen. Ohne diesen reichen selbst 10 Punkte nicht." },
      ],
      links: [link("makeitChancen", LANG), link("chancenSimu", LANG)],
    },
    {
      id: "tourisme",
      emoji: "✈️",
      title: LANG === "fr" ? "Visa tourisme & visite familiale (Schengen)" : LANG === "en" ? "Tourism & family visit visa (Schengen)" : "Tourismus- und Familienbesuchsvisum (Schengen)",
      summary: LANG === "fr" ? "Séjour jusqu'à 90 jours. Le refus vient presque toujours des mêmes 3 motifs : évitables."
            : LANG === "en" ? "Stay up to 90 days. Refusal almost always comes from the same 3 reasons · avoidable."
            : "Aufenthalt bis zu 90 Tagen. Ablehnungen kommen fast immer aus denselben 3 Gründen.",
      sections: LANG === "fr" ? [
        { h: "Le dossier type", list: ["Passeport valide + formulaire Schengen + photos biométriques", "Assurance voyage d'au moins 30 000 € de couverture", "Réservations d'hébergement et billets aller-retour", "Relevés bancaires des 3 derniers mois (compte épargne si possible)", "Si hébergé par un résident : invitation formelle (Verpflichtungserklärung) signée à l'Ausländerbehörde", "Justificatif d'attache au pays : emploi, études, famille, propriété"] },
        { h: "Les 3 motifs de refus classiques", list: ["Moyens financiers jugés insuffisants : prévois un budget clair d'environ 45-60 €/jour", "Doute sur le retour : pas assez d'attaches au pays d'origine (emploi stable, famille, loyer…)", "Hébergement ou itinéraire flou et incohérent"] },
        { h: "Conseils pratiques", p: "Dépose la demande 1 à 3 mois avant le départ (délais longs dans beaucoup d'ambassades). Réponds honnêtement à l'entretien : la cohérence entre ton dossier et tes réponses est vérifiée. Un historique de voyages respectés (visas précédents bien utilisés) augmente fortement tes chances de visa multi-entrées." },
      ] : LANG === "en" ? [
        { h: "Standard file", list: ["Valid passport + Schengen form + biometric photos", "Travel insurance with at least €30,000 coverage", "Accommodation bookings and round-trip tickets", "Bank statements for the last 3 months (savings account if possible)", "If hosted: formal invitation (Verpflichtungserklärung) signed at the Ausländerbehörde", "Proof of ties to home country: job, studies, family, property"] },
        { h: "The 3 classic refusal reasons", list: ["Insufficient means: budget around €45-60/day clearly", "Doubt over return: not enough ties to home (steady job, family, lease, etc.)", "Vague or inconsistent accommodation / itinerary"] },
        { h: "Practical tips", p: "Submit 1 to 3 months before departure (long delays in many embassies). Answer the interview honestly: they check consistency between your file and your answers. A track record of respected travels (previous visas used well) boosts your chances for a multi-entry visa." },
      ] : [
        { h: "Standardakte", list: ["Gültiger Reisepass + Schengen-Formular + biometrische Fotos", "Reiseversicherung mit mindestens 30.000 € Deckung", "Unterkunftsbuchungen und Hin- und Rückflugtickets", "Kontoauszüge der letzten 3 Monate (Sparkonto wenn möglich)", "Bei Privatunterkunft: formelle Einladung (Verpflichtungserklärung) bei der Ausländerbehörde", "Bindungsnachweis zum Heimatland: Job, Studium, Familie, Eigentum"] },
        { h: "Die 3 klassischen Ablehnungsgründe", list: ["Unzureichende Mittel: ca. 45-60 €/Tag klar einplanen", "Rückkehrzweifel: zu wenige Bindungen zur Heimat (Job, Familie, Miete …)", "Vage oder widersprüchliche Unterkunft / Route"] },
        { h: "Praktische Tipps", p: "Antrag 1 bis 3 Monate vor Abflug stellen (lange Wartezeiten in vielen Botschaften). Beim Gespräch ehrlich antworten: die Konsistenz zwischen Akte und Antworten wird geprüft. Eine Historie respektierter Reisen erhöht die Chancen auf ein Mehrfachvisum deutlich." },
      ],
      links: [link("aaa", LANG), link("schengen", LANG)],
    },
    {
      id: "europe",
      emoji: "🇪🇺",
      title: LANG === "fr" ? "Étudier ailleurs en Europe : France, Autriche, Belgique…" : LANG === "en" ? "Studying elsewhere in Europe: France, Austria, Belgium…" : "Studium anderswo in Europa: Frankreich, Österreich, Belgien …",
      summary: LANG === "fr" ? "L'Allemagne n'est pas la seule porte : voici les alternatives européennes et leurs spécificités."
            : LANG === "en" ? "Germany isn't the only door: here are the European alternatives and their specifics."
            : "Deutschland ist nicht das einzige Tor: europäische Alternativen und ihre Besonderheiten.",
      sections: LANG === "fr" ? [
        { h: "France 🇫🇷", list: ["Procédure Campus France obligatoire dans la plupart des pays africains (entretien + frais)", "Preuve financière : environ 615 €/mois (montant révisé régulièrement)", "Frais d'inscription universitaires très bas (~170-380 €/an en licence-master public) + CVEC", "Bourses : Eiffel, Bourses France Excellence, aides régionales", "Autorisation de travail : 964 heures/an (60% temps plein)"] },
        { h: "Autriche 🇦🇹 / Belgique 🇧🇪 / Pays-Bas 🇳🇱", list: ["Autriche : qualité de vie excellente, frais modérés (~1 500 €/an hors UE), compte bloqué requis", "Belgique : frais sociaux universitaires raisonnables, preuve financière ~800 €/mois", "Pays-Bas : beaucoup de programmes en anglais mais frais élevés (2 000-15 000 €/an) : vise les bourses (Holland Scholarship, Orange Tulip)"] },
        { h: "Pologne, Portugal, Tchéquie : les options économiques", p: "Frais entre 1 000 et 3 000 €/an, coût de la vie 30-50% plus bas qu'en Allemagne/France. L'anglais suffit dans beaucoup de programmes. Attention : vérifie toujours l'accréditation de l'établissement et la reconnaissance du diplôme dans l'UE avant de payer quoi que ce soit." },
      ] : LANG === "en" ? [
        { h: "France 🇫🇷", list: ["Campus France procedure mandatory in most African countries (interview + fees)", "Proof of funds: about €615/month (revised regularly)", "University registration fees very low (~€170-380/year in public bachelor-master) + CVEC", "Scholarships: Eiffel, France Excellence, regional grants", "Right to work: 964 hours/year (60% of full-time)"] },
        { h: "Austria 🇦🇹 / Belgium 🇧🇪 / Netherlands 🇳🇱", list: ["Austria: excellent quality of life, moderate fees (~€1,500/year outside EU), blocked account required", "Belgium: reasonable university fees, ~€800/month funds proof", "Netherlands: many English programs but high fees (€2,000-15,000/year) · aim for scholarships (Holland Scholarship, Orange Tulip)"] },
        { h: "Poland, Portugal, Czechia · economical options", p: "Fees between €1,000 and €3,000/year, cost of living 30-50% lower than Germany/France. English is enough in many programs. Be careful: always check the accreditation of the school and the recognition of the diploma in the EU before paying anything." },
      ] : [
        { h: "Frankreich 🇫🇷", list: ["Campus-France-Verfahren in den meisten afrikanischen Ländern Pflicht (Gespräch + Gebühren)", "Finanzierungsnachweis: ca. 615 €/Monat (regelmäßig angepasst)", "Sehr niedrige Studiengebühren (~170-380 €/Jahr in öffentlichem Bachelor/Master) + CVEC", "Stipendien: Eiffel, France Excellence, regionale Hilfen", "Arbeitserlaubnis: 964 Std./Jahr (60% Vollzeit)"] },
        { h: "Österreich 🇦🇹 / Belgien 🇧🇪 / Niederlande 🇳🇱", list: ["Österreich: hohe Lebensqualität, moderate Gebühren (~1.500 €/Jahr außerhalb EU), Sperrkonto nötig", "Belgien: moderate Studiengebühren, Finanzierungsnachweis ~800 €/Monat", "Niederlande: viele englische Programme, aber hohe Gebühren (2.000-15.000 €/Jahr) · nach Stipendien schielen (Holland Scholarship, Orange Tulip)"] },
        { h: "Polen, Portugal, Tschechien · günstige Optionen", p: "Gebühren zwischen 1.000 und 3.000 €/Jahr, Lebenshaltung 30-50% günstiger als Deutschland/Frankreich. Englisch reicht in vielen Programmen. Achtung: prüfe immer die Akkreditierung der Schule und die Anerkennung des Abschlusses in der EU, bevor du zahlst." },
      ],
      links: [link("campusfr", LANG), link("euPortal", LANG)],
    },
    {
      id: "afrique",
      emoji: "🌍",
      title: LANG === "fr" ? "Étudiants africains → Europe : stratégie et pièges" : LANG === "en" ? "African students → Europe: strategy and traps" : "Afrikanische Studierende → Europa: Strategie und Fallen",
      summary: LANG === "fr" ? "Les bourses existent, les arnaques aussi. Comment monter un dossier qui passe et éviter les mauvaises surprises."
            : LANG === "en" ? "Scholarships exist, scams too. How to build a file that passes and avoid surprises."
            : "Stipendien gibt es, Abzocke auch. So baust du eine Akte, die klappt, und vermeidest böse Überraschungen.",
      sections: LANG === "fr" ? [
        { h: "Les 3 vérités à accepter", list: ["Le critère n°1 des refus est financier : la preuve de moyens est vérifiée aussi rigoureusement que les diplômes", "Un dossier complet se prépare en 9 à 12 mois : pas en 3 semaines", "Aucune « agence » ne peut garantir un visa. Celui qui le promet est un fraudeur"] },
        { h: "Les bourses réelles à cibler", list: ["Erasmus Mundus Joint Masters : fully funded, critères académiques, pas besoin d'être riche", "DAAD (Allemagne) : bourses de master et de recherche", "Chevening (Royaume-Uni), Eiffel (France), Mastercard Foundation (panafricain)", "Bourses d'excellence des universités elles-mêmes (cherche « scholarship » sur chaque site)"] },
        { h: "Les pièges classiques", list: ["Fausses lettres d'admission vendues par des agences : vérifie chaque admission directement sur le site de l'université", "Faux comptes bancaires / « prêts » gonflés : l'ambassade vérifie l'origine des fonds : c'est un motif de refus définitif", "Établissements non accrédités : le diplôme ne vaudra rien, ni pour un emploi ni pour un renouvellement de titre", "« Formations » payantes en ligne sans reconnaissance : exige l'accréditation officielle"] },
        { h: "Préparer l'entretien d'ambassade", p: "Prépare en 3 phrases : pourquoi CE programme, comment tu le finances, et ton projet de retour ou d'insertion régulière. La cohérence entre ta lettre de motivation, tes preuves financières et tes réponses orales fait la différence. Apporte toujours les originaux + copies de chaque document." },
      ] : LANG === "en" ? [
        { h: "3 truths to accept", list: ["The #1 refusal criterion is financial: proof of funds is checked as rigorously as diplomas", "A complete file takes 9 to 12 months of preparation · not 3 weeks", "No « agency » can guarantee a visa. Anyone who promises one is a scammer"] },
        { h: "Real scholarships to target", list: ["Erasmus Mundus Joint Masters: fully funded, academic criteria, no need to be rich", "DAAD (Germany): master's and research scholarships", "Chevening (UK), Eiffel (France), Mastercard Foundation (pan-African)", "University excellence scholarships themselves (search « scholarship » on each site)"] },
        { h: "Classic traps", list: ["Fake admission letters sold by agencies: verify every admission directly on the university's website", "Fake bank accounts / inflated « loans »: embassies check the origin of funds · that's a permanent refusal reason", "Unaccredited schools: the diploma will be worthless for jobs or renewing your title", "Online paid « training » without recognition: demand official accreditation"] },
        { h: "Prep for the embassy interview", p: "Prep in 3 sentences: why THIS program, how you're funding it, and your return or regular insertion plan. Consistency between your motivation letter, financial proofs and verbal answers makes the difference. Always bring originals + copies." },
      ] : [
        { h: "3 Wahrheiten, die man akzeptieren sollte", list: ["Das Nr.-1-Ablehnungskriterium ist finanziell: der Finanzierungsnachweis wird so streng geprüft wie die Abschlüsse", "Eine vollständige Akte dauert 9 bis 12 Monate Vorbereitung · nicht 3 Wochen", "Keine « Agentur » kann ein Visum garantieren. Wer es verspricht, ist ein Betrüger"] },
        { h: "Reale Stipendien, die sich lohnen", list: ["Erasmus Mundus Joint Masters: voll finanziert, akademische Kriterien, kein Reichtum nötig", "DAAD (Deutschland): Master- und Forschungsstipendien", "Chevening (UK), Eiffel (Frankreich), Mastercard Foundation (panafrikanisch)", "Exzellenz-Stipendien der Unis selbst (suche nach « scholarship » auf jeder Seite)"] },
        { h: "Klassische Fallen", list: ["Gefälschte Zulassungen von Agenturen: prüfe jede Zulassung direkt auf der Uni-Seite", "Gefälschte Konten / aufgeblähte « Kredite »: Botschaften prüfen die Herkunft · das ist ein dauerhafter Ablehnungsgrund", "Nicht akkreditierte Schulen: der Abschluss ist nichts wert, weder für Jobs noch für Titel-Verlängerung", "Bezahlte Online-« Schulungen » ohne Anerkennung: verlange offizielle Akkreditierung"] },
        { h: "Vorbereitung auf das Botschaftsgespräch", p: "Bereite 3 Sätze vor: warum DIESES Programm, wie du es finanzierst, und dein Rückkehr- oder Eingliederungsplan. Konsistenz zwischen Motivationsschreiben, Finanznachweisen und mündlichen Antworten macht den Unterschied. Immer Originale + Kopien mitbringen." },
      ],
      links: [link("erasmus", LANG), link("daadAfric", LANG), link("chevening", LANG)],
    },
  ];
}

const ARTICLES_BY_LANG: Record<Lang, VisaArticle[]> = {
  fr: buildArticles("fr"),
  en: buildArticles("en"),
  de: buildArticles("de"),
};

export function getArticles(lang: Lang): VisaArticle[] {
  return ARTICLES_BY_LANG[lang] ?? ARTICLES_BY_LANG.fr;
}

export function getChecklist(lang: Lang, key: string): ItemList | undefined {
  return VISA_CHECKLISTS[lang]?.[key];
}

export function getVisaTypeLabel(lang: Lang, key: string): string {
  return VISA_TYPE_LABELS[lang]?.[key] ?? key;
}

export const VISA_DISCLAIMER_BY_LANG: Record<Lang, string> = {
  fr: "⚠️ Ceci est une estimation, pas un conseil juridique. Seuls l'ambassade, le consulat et l'Ausländerbehörde décident de l'attribution d'un visa. Les montants et critères évoluent : vérifie toujours les exigences à jour sur les sites officiels.",
  en: "⚠️ This is an estimate, not legal advice. Only the embassy, the consulate and the Ausländerbehörde decide on visa issuance. Amounts and criteria change: always check the latest requirements on official websites.",
  de: "⚠️ Dies ist eine Schätzung, keine Rechtsberatung. Nur die Botschaft, das Konsulat und die Ausländerbehörde entscheiden über die Visumserteilung. Beträge und Kriterien ändern sich: prüfe immer die aktuellen Anforderungen auf offiziellen Seiten.",
};
