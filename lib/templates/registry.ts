/**
 * 🎨 TEMPLATES DE PRÉSENTATION — bibliothèque de visages alternatifs pour le site.
 *
 * Plutôt que de tout refaire, on définit plusieurs "looks" (combinations de
 * tokens, gradients, bordures, ombres, polices, particles) que PRONO peut
 * appliquer à un instant T. L'admin peut basculer d'un template à l'autre,
 * ou l'auto-sélection peut combiner le thème saisonnier + le template.
 *
 * 6 templates par défaut :
 *   - emerald : l'actuel, neutre, vert émeraude
 *   - ocean  : bleu glacier (été doux)
 *   - sunset : orange/rouge (football, ambiance Premier League)
 *   - royal  : violet/profond (mode nuit)
 *   - forest : vert sombre, posée, "Bayern/Leverkusen"
 *   - chrome : noir/blanc épuré (lisible, foot business)
 *
 * Ajouter un template = 1 entrée ici. Le moteur (ThemeProvider) pioche
 * automatiquement l'un de ces visages pour compléter la saison/événement.
 */

import type { Lang } from "@/lib/i18n";

export type TemplateId = "emerald" | "ocean" | "sunset" | "royal" | "forest" | "chrome";

export interface TemplateDef {
  id: TemplateId;
  label: Record<Lang, string>;
  /** CSS tokens — variables --prono-* */
  tokens: {
    primary: string;
    bg: string;
    surface: string;
    accent: string;
  };
  /** Couleur des boutons (--primary-foreground garde le contraste) */
  onPrimary: string;
  /** Aspect "social" (le gradient du hero, par exemple) */
  heroGradient: string;
  /** Effets secondaires optionnels */
  effects?: {
    /** Halo lumineux derrière le logo */
    glow?: boolean;
    /** Coins arrondis accentués */
    rounded?: boolean;
  };
}

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  emerald: {
    id: "emerald",
    label: { fr: "Émeraude · l'original", en: "Emerald · original", de: "Smaragd · original" },
    tokens: { primary: "#10b981", bg: "#0a0a0b", surface: "#171717", accent: "#34d399" },
    onPrimary: "#0a0a0b",
    heroGradient: "from-emerald-400 via-emerald-500 to-teal-600",
    effects: { glow: true, rounded: true },
  },
  ocean: {
    id: "ocean",
    label: { fr: "Océan · bleu glacier", en: "Ocean · ice blue", de: "Ozean · Eisblau" },
    tokens: { primary: "#3b82f6", bg: "#070a13", surface: "#101528", accent: "#06b6d4" },
    onPrimary: "#ffffff",
    heroGradient: "from-sky-400 via-blue-500 to-cyan-600",
    effects: { glow: true },
  },
  sunset: {
    id: "sunset",
    label: { fr: "Coucher de soleil · rouge football", en: "Sunset · football red", de: "Sonnenuntergang · Fußballrot" },
    tokens: { primary: "#ef4444", bg: "#0c0707", surface: "#1a1010", accent: "#f97316" },
    onPrimary: "#ffffff",
    heroGradient: "from-orange-400 via-red-500 to-rose-600",
    effects: { rounded: true },
  },
  royal: {
    id: "royal",
    label: { fr: "Royal · violet nuit", en: "Royal · purple night", de: "Royal · Nachtviolett" },
    tokens: { primary: "#a78bfa", bg: "#0a0814", surface: "#1a1226", accent: "#7c3aed" },
    onPrimary: "#ffffff",
    heroGradient: "from-violet-400 via-purple-500 to-indigo-600",
    effects: { glow: true },
  },
  forest: {
    id: "forest",
    label: { fr: "Forêt · vert sapin", en: "Forest · pine green", de: "Wald · Tannengrün" },
    tokens: { primary: "#22c55e", bg: "#06090b", surface: "#10181a", accent: "#84cc16" },
    onPrimary: "#062a0e",
    heroGradient: "from-lime-400 via-green-500 to-emerald-700",
  },
  chrome: {
    id: "chrome",
    label: { fr: "Chrome · noir & blanc", en: "Chrome · black & white", de: "Chrome · Schwarz-Weiß" },
    tokens: { primary: "#e5e7eb", bg: "#000000", surface: "#0d0d0e", accent: "#fafafa" },
    onPrimary: "#000000",
    heroGradient: "from-zinc-200 via-zinc-100 to-zinc-300",
  },
};

export const DEFAULT_TEMPLATE: TemplateId = "emerald";

/** Renvoie le template par défaut / saison / événement. */
export function pickTemplate(now: Date = new Date()): TemplateId {
  // Mapping rapide : saison → template par défaut (l'admin peut surcharger)
  const month = now.getMonth() + 1;
  if (month >= 6 && month <= 8) return "ocean";   // été → océan
  if (month >= 11 || month <= 1) return "chrome"; // hiver → chrome
  if (month >= 3 && month <= 5) return "forest";  // printemps → forêt
  return "emerald";                                // automne ou autre
}
