/**
 * Données PRONO-ANNONCES (MODULE 5) — catégories, libellés, helpers d'affichage.
 */

import type { AnnonceCategory } from "@/lib/types";

export interface AnnonceCategoryInfo {
  value: AnnonceCategory;
  emoji: string;
  label: string;
  short: string;
}

export const CATEGORIES: AnnonceCategoryInfo[] = [
  { value: "rencontre", emoji: "❤️", label: "Rencontre", short: "Rencontre" },
  { value: "partenaire", emoji: "💞", label: "Recherche partenaire", short: "Partenaire" },
  { value: "ami", emoji: "🤝", label: "Ami / Amie", short: "Ami" },
  { value: "logement", emoji: "🏠", label: "Logement", short: "Logement" },
  { value: "service", emoji: "🛠️", label: "Service", short: "Service" },
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
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];
}

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
