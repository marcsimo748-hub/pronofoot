/**
 * 🎨 MOTEUR DE THÈME — choisit le bon thème selon la date du jour.
 * Règle : premier événement mondial actif > saison du moment > thème par défaut.
 *
 * L'admin peut surcharger un thème (WallpapersTool) : c'est géré plus tard.
 */

import { DEFAULT_THEME, EVENT_THEMES, SEASONAL_THEMES, type ThemeVariant } from "./themes";
import { activeEvents, currentSeason } from "./calendar";

export type { DecorKind, ThemeVariant } from "./themes";
export { SEASONAL_THEMES, EVENT_THEMES, DEFAULT_THEME } from "./themes";

export interface ResolvedTheme extends ThemeVariant {
  /** Origine : "event:<id>" | "season:<id>" | "default" */
  source: string;
}

/**
 * Priorité d'affichage quand plusieurs events sont actifs le même jour.
 * Le premier match gagne.
 */
const EVENT_PRIORITY: string[] = [
  "nouvelAn",
  "noel",
  "paques",
  "eidFitr",
  "eidAdha",
  "ramadan",
  "halloween",
  "stValentin",
  "diwali",
  "yomKippour",
  "hanoucca",
  "unityDE",
  "unityCM",
];

export function resolveTheme(now: Date = new Date()): ResolvedTheme {
  const events = activeEvents(now);
  // 1. Priorité explicite
  for (const ev of EVENT_PRIORITY) {
    if (events.includes(ev) && EVENT_THEMES[ev]) {
      return { ...EVENT_THEMES[ev], source: `event:${ev}` };
    }
  }
  // 2. N'importe quel event restant (défensif)
  for (const ev of events) {
    if (EVENT_THEMES[ev]) {
      return { ...EVENT_THEMES[ev], source: `event:${ev}` };
    }
  }
  // 3. Sinon saison
  const season = currentSeason(now);
  return { ...SEASONAL_THEMES[season], source: `season:${season}` };
}

/** Bâtit la chaîne CSS variables à injecter sur :root. */
export function themeToCssVars(t: ThemeVariant): string {
  return `--prono-primary:${t.tokens.primary};--prono-bg:${t.tokens.bg};--prono-surface:${t.tokens.surface};--prono-accent:${t.tokens.accent};`;
}
