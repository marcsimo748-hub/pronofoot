/**
 * Thèmes des boutiques membres — données partagées (client + serveur).
 * Chaque thème = dégradé de fond + couleur d'accent, appliqués en style inline.
 */

export interface ShopTheme {
  id: "nuit" | "emeraude" | "ocean" | "coucher" | "violet" | "or";
  label: string;
  emoji: string;
  from: string;
  to: string;
  accent: string;
}

export const SHOP_THEMES: ShopTheme[] = [
  { id: "nuit",     label: "Nuit étoilée",  emoji: "🌙", from: "#0f172a", to: "#334155", accent: "#38bdf8" },
  { id: "emeraude", label: "Émeraude",      emoji: "🌿", from: "#064e3b", to: "#047857", accent: "#34d399" },
  { id: "ocean",    label: "Océan",         emoji: "🌊", from: "#0c4a6e", to: "#0369a1", accent: "#7dd3fc" },
  { id: "coucher",  label: "Coucher de soleil", emoji: "🌅", from: "#7c2d12", to: "#be185d", accent: "#fb923c" },
  { id: "violet",   label: "Violet nuit",   emoji: "🔮", from: "#4c1d95", to: "#7e22ce", accent: "#c084fc" },
  { id: "or",       label: "Or noir",       emoji: "✨", from: "#1c1917", to: "#78350f", accent: "#fbbf24" },
];

export function shopTheme(id: string): ShopTheme {
  return SHOP_THEMES.find((t) => t.id === id) ?? SHOP_THEMES[0];
}
