"use client";

/**
 * 🎨 ThemeProvider — applique le thème saisonnier / événement détecté
 * automatiquement en CSS variables sur :root. Aucun appel serveur, tout
 * est calculé au montage du composant (donc la date du visiteur compte).
 *
 * • Date du jour → saison + événements mondiaux (Pâques, Ramadan, Eid…)
 *   → palette + décor (neige, pétales, confettis, lumières…).
 * • Aucun appel réseau, aucune API externe, aucune dépendance.
 * • Tous les composants lisent --prono-primary, etc. via Tailwind (theme étendu).
 *
 * 🛠️ Admin peut forcer un visage précis via :
 *   - DB : `site_settings.theme_override` (lu via /api/theme-override)
 *   - localStorage : `prono_theme_override` (test instantané côté admin)
 *   Priorité : localStorage > DB > auto-détection.
 */

import { useEffect, useState } from "react";
import { ThemeDecor } from "./ThemeDecor";
import { TEMPLATES, DEFAULT_TEMPLATE } from "@/lib/templates/registry";
import {
  SEASONAL_THEMES,
  EVENT_THEMES,
  DEFAULT_THEME,
  type ThemeVariant,
} from "@/lib/theme";
import { resolveTheme } from "@/lib/theme";
import { useT } from "@/lib/i18n";

const LOCAL_KEY = "prono_theme_override";

function readLocalOverride(): string | null {
  try {
    const v = localStorage.getItem(LOCAL_KEY);
    return v ?? null;
  } catch {
    return null;
  }
}

function applyOverride(value: string | null, fallback: ThemeVariant): ThemeVariant & { source: string } {
  const v = value ?? "auto";
  if (!v || v === "auto") {
    return { ...resolveTheme(), source: "auto" };
  }
  if (v === "off") {
    return { ...DEFAULT_THEME, source: "off" };
  }
  if (v.startsWith("season:")) {
    const id = v.slice(7);
    const t = SEASONAL_THEMES[id];
    if (t) return { ...t, source: `season:${id}` };
  }
  if (v.startsWith("event:")) {
    const id = v.slice(6);
    const t = EVENT_THEMES[id];
    if (t) return { ...t, source: `event:${id}` };
  }
  if (v.startsWith("template:")) {
    const id = v.slice(9) as keyof typeof TEMPLATES;
    const def = TEMPLATES[id] ?? TEMPLATES[DEFAULT_TEMPLATE];
    return {
      ...DEFAULT_THEME,
      tokens: {
        primary: def.tokens.primary,
        bg: def.tokens.bg,
        surface: def.tokens.surface,
        accent: def.tokens.accent,
      },
      source: `template:${id}`,
    };
  }
  return { ...fallback, source: "auto" };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useT();
  const [theme, setTheme] = useState<(ThemeVariant & { source: string }) | null>(null);

  useEffect(() => {
    function applyAndPersist(value: string | null) {
      // Priorité : localStorage > DB
      const local = readLocalOverride();
      const effective = local ?? value;
      setTheme(applyOverride(effective, resolveTheme()));
    }

    // 1) Charge depuis DB au montage (best effort)
    (async () => {
      try {
        const res = await fetch("/api/theme-override", { cache: "no-store" });
        const json = await res.json().catch(() => ({ ok: false }));
        if (json?.ok) {
          applyAndPersist(json.data?.value ?? "auto");
        } else {
          applyAndPersist(null);
        }
      } catch {
        applyAndPersist(null);
      }
    })();

    // 2) Auto-refresh (changement d'événement à minuit, etc.)
    const id = setInterval(() => {
      const local = readLocalOverride();
      setTheme(applyOverride(local, resolveTheme()));
    }, 60 * 60 * 1000);

    // 3) Synchronisation entre onglets via l'événement storage
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_KEY) {
        applyAndPersist(localStorage.getItem(LOCAL_KEY));
      }
    };
    window.addEventListener("storage", onStorage);
    // 4) Custom event (même onglet, pour le feedback admin instantané)
    const onLocal = () => applyAndPersist(localStorage.getItem(LOCAL_KEY));
    window.addEventListener("prono-theme-change", onLocal);

    return () => {
      clearInterval(id);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("prono-theme-change", onLocal);
    };
  }, []);

  if (!theme) return <>{children}</>;

  return (
    <>
      {/* Injecte CSS variables sur :root pour qu'elles soient globales */}
      <style
        id="prono-theme-vars"
        dangerouslySetInnerHTML={{
          __html: `:root{--prono-primary:${theme.tokens.primary};--prono-bg:${theme.tokens.bg};--prono-surface:${theme.tokens.surface};--prono-accent:${theme.tokens.accent};}`,
        }}
      />
      {/* Overlay décoratif (neige, pétales, confettis…) */}
      <ThemeDecor decor={theme.decor} />
      {/* Message de bienvenue — discret, en haut */}
      {theme.greeting && (
        <div className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex justify-center px-3 pt-2">
          <p className="pointer-events-auto max-w-2xl rounded-full border border-white/10 bg-background/80 px-4 py-1.5 text-xs text-foreground/80 shadow-glow-sm backdrop-blur">
            {theme.greeting[lang as "fr" | "en" | "de"] ?? theme.greeting.fr}
          </p>
        </div>
      )}
      {children}
    </>
  );
}
