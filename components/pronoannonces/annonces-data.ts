/**
 * Données PRONO-ANNONCES (MODULE 5) : catégories, libellés, helpers d'affichage.
 *
 * Catégories en 3 langues (FR/EN/DE) : la diaspora est bilingue —
 * catLabel() choisit la langue de l'interface (FR par défaut).
 */

import type { AnnonceCategory } from "@/lib/types";

export interface AnnonceCategoryInfo {
  value: AnnonceCategory;
  emoji: string;
  label: string;   // FR (référence)
  short: string;   // FR court (pilules)
  en: string;      // anglais
  de: string;      // allemand
}

/** Services de proximité (prix affiché, pas d'envoi) */
export const SERVICE_CATS = ["service", "coiffure", "demenagement", "dj", "chauffeur", "gardenfant"] as const;

/** Biens (prix + envoi Afrique + dédouanement) */
export const GOODS_CATS = ["voitures", "transport", "electronique", "mode", "maison", "objets"] as const;

export const CATEGORIES: AnnonceCategoryInfo[] = [
  // : Services de proximité —
  { value: "coiffure",     emoji: "💈", label: "Coiffure & esthétique", short: "Coiffure",     en: "Hair & beauty",          de: "Frisör & Kosmetik" },
  { value: "demenagement", emoji: "🚚", label: "Déménagement (Umzug)",  short: "Déménagement", en: "Moving / Umzug",         de: "Umzug" },
  { value: "dj",           emoji: "🎧", label: "DJ & animation",        short: "DJ",           en: "DJ & entertainment",     de: "DJ & Unterhaltung" },
  { value: "chauffeur",    emoji: "🚕", label: "Chauffeur & courses",   short: "Chauffeur",    en: "Driver & errands",       de: "Fahrer & Besorgungen" },
  { value: "gardenfant",   emoji: "🧸", label: "Garde d'enfants",       short: "Garde enfants", en: "Childcare / Babysitting", de: "Kinderbetreuung" },
  { value: "service",      emoji: "🛠️", label: "Autres services",      short: "Services",     en: "Other services",         de: "Weitere Dienste" },
  // : Biens —
  { value: "voitures",     emoji: "🚗", label: "Voitures",              short: "Voitures",     en: "Cars",                   de: "Autos" },
  { value: "transport",    emoji: "🚢", label: "Envoi vers l'Afrique",  short: "Envoi Afrique", en: "Shipping to Africa",    de: "Versand nach Afrika" },
  { value: "electronique", emoji: "📱", label: "Électronique",          short: "Électronique", en: "Electronics",            de: "Elektronik" },
  { value: "mode",         emoji: "👗", label: "Mode & beauté",         short: "Mode",         en: "Fashion & wear",         de: "Mode" },
  { value: "maison",       emoji: "🏡", label: "Maison",                short: "Maison",       en: "Home",                   de: "Haushalt" },
  { value: "objets",       emoji: "📦", label: "Objets divers",         short: "Objets",       en: "Various items",          de: "Verschiedenes" },
  // : Communauté —
  { value: "logement",     emoji: "🏠", label: "Logement",              short: "Logement",     en: "Housing",                de: "Wohnen" },
  { value: "rencontre",    emoji: "❤️", label: "Rencontre",             short: "Rencontre",    en: "Dating",                 de: "Kennenlernen" },
  { value: "partenaire",   emoji: "💞", label: "Recherche partenaire",  short: "Partenaire",   en: "Looking for a partner",  de: "Partnersuche" },
  { value: "ami",          emoji: "🤝", label: "Ami / Amie",            short: "Ami",          en: "Friend",                 de: "Freundschaft" },
];

export const REPORT_REASONS = [
  "Contenu inapproprié",
  "Arnaque / fraude",
  "Faux profil",
  "Contenu illégal",
  "Spam / publicité",
  "Autre",
];

export function categoryInfo(value: string): AnnonceCategoryInfo {
  return (
    CATEGORIES.find((c) => c.value === value) ??
    CATEGORIES.find((c) => c.value === "service") ??
    CATEGORIES[0]
  );
}

/** Libellé de catégorie dans la langue choisie (fr | en | de) */
export function catLabel(value: string, lang: string): string {
  const c = CATEGORIES.find((x) => x.value === value);
  if (!c) return value;
  if (lang === "en") return c.en;
  if (lang === "de") return c.de;
  return c.label;
}

/** Vente possible (biens ou services) → champ prix */
export function isMarketplace(category: string): boolean {
  return (
    (SERVICE_CATS as readonly string[]).includes(category) ||
    (GOODS_CATS as readonly string[]).includes(category)
  );
}

/** Bien physique → envoi Afrique + dédouanement */
export function isGoods(category: string): boolean {
  return (GOODS_CATS as readonly string[]).includes(category);
}

/** Ce qu'une boutique membre affiche (services + biens, pas le social) */
export const SHOP_CATS = [...SERVICE_CATS, ...GOODS_CATS];

export function timeAgoFr(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d} j`;
  const m = Math.floor(d / 30);
  return `il y a ${m} mois`;
}

export function priceFr(p: number | null | undefined): string {
  if (p == null) return "";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(p);
}

/** Emplacement lisible : Berlin · Wedding · 13347 */
export function placeFr(a: { city?: string | null; quartier?: string | null; postal?: string | null }): string {
  return [a.city, a.quartier, a.postal].filter(Boolean).join(" · ") || "-";
}

export const SHIPPING_LABEL: Record<string, string> = {
  aide: "🚢 Envoi vers l'Afrique : le vendeur peut aider",
};

export const CUSTOMS_LABEL: Record<string, string> = {
  vendeur: "🛃 Dédouanement : pris en charge par le vendeur",
  acheteur: "🛃 Dédouanement : à ta charge (tu le fais toi-même)",
};

export function contactHref(preference: string, value: string): string {
  if (!value) return "";
  const v = value.trim();
  if (preference === "email") return v.includes("@") ? `mailto:${v}` : `mailto:${v}`;
  // WhatsApp : accepte +49…, 0… et chiffres seuls
  const digits = v.replace(/[^\d]/g, "");
  const intl = v.trim().startsWith("+") ? digits : digits.startsWith("0") ? `49${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

export function contactLabel(preference: string, value: string): string {
  if (preference === "email") return value || "Email";
  return value || "WhatsApp";
}
