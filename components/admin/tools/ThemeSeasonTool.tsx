"use client";

/**
 * 🎨 Outil Admin · « Visage du site »
 *
 * L'admin peut choisir :
 *   - Auto  → laisse le moteur ThemeProvider choisir la saison du jour ou
 *     un événement mondial (Noël, Ramadan, Pâques, etc.)
 *   - Forcer un thème → applique le visage immédiatement (jusqu'à
 *     changement manuel ou reload complet)
 *   - Aperçu live : la palette + la phrase d'accueil sont rendues en direct.
 *
 * Valeurs acceptées par `theme_override` :
 *   "auto", "off",
 *   "season:spring|spring|summer|autumn|winter",
 *   "event:noel|nouvelAn|...|unityCM",
 *   "template:emerald|ocean|sunset|royal|forest|chrome"
 */

import { useEffect, useState } from "react";
import { Sparkles, Calendar, Palette, AlertTriangle, RefreshCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { saveSetting } from "../adminShared";
import type { SiteSettings } from "@/lib/types";
import { resolveTheme } from "@/lib/theme";
import { SEASONAL_THEMES, EVENT_THEMES, DEFAULT_THEME, type ThemeVariant } from "@/lib/theme";
import { TEMPLATES, DEFAULT_TEMPLATE, type TemplateId } from "@/lib/templates/registry";
import { activeEvents, currentSeason } from "@/lib/theme/calendar";
import { useT } from "@/lib/i18n";

const STORAGE_KEY = "prono_theme_override";

function classifyOverride(v: string | undefined):
  | "auto"
  | "off"
  | { kind: "season"; id: string }
  | { kind: "event"; id: string }
  | { kind: "template"; id: TemplateId } {
  if (!v || v === "auto") return "auto";
  if (v === "off") return "off";
  if (v.startsWith("season:")) return { kind: "season", id: v.slice(7) };
  if (v.startsWith("event:")) return { kind: "event", id: v.slice(6) };
  if (v.startsWith("template:")) return { kind: "template", id: v.slice(9) as TemplateId };
  return "auto";
}

function resolveFromOverride(v: string | undefined): { theme: ThemeVariant; label: string } {
  const c = classifyOverride(v);
  if (c === "auto") {
    const t = resolveTheme();
    return { theme: t, label: `${t.kind === "event" ? "Événement" : "Saison"} · ${t.label}` };
  }
  if (c === "off") return { theme: DEFAULT_THEME, label: "Thème par défaut (automatique désactivé)" };
  if (c.kind === "season") {
    const t = SEASONAL_THEMES[c.id] ?? DEFAULT_THEME;
    return { theme: t, label: `Saison · ${t.label}` };
  }
  if (c.kind === "event") {
    const t = EVENT_THEMES[c.id] ?? DEFAULT_THEME;
    return { theme: t, label: `Événement · ${t.label}` };
  }
  // template
  const def = TEMPLATES[c.id] ?? TEMPLATES[DEFAULT_TEMPLATE];
  return {
    theme: {
      ...DEFAULT_THEME,
      tokens: {
        primary: def.tokens.primary,
        bg: def.tokens.bg,
        surface: def.tokens.surface,
        accent: def.tokens.accent,
      },
    },
    label: `Template · ${def.label.fr}`,
  };
}

export function ThemeSeasonTool({ settings }: { settings: SiteSettings }) {
  const { lang } = useT();
  const [override, setOverride] = useState<string>(settings.theme_override ?? "auto");
  const [saved, setSaved] = useState<string>(settings.theme_override ?? "auto");
  const [now, setNow] = useState<Date>(() => new Date());

  // Re-resolve l'aperçu toutes les minutes (les events changent à minuit)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const autoTheme = resolveTheme(now);
  const resolved = resolveFromOverride(override);

  async function apply(v: string, label: string) {
    setOverride(v);
    setSaved(v);
    try {
      await saveSetting("theme_override", v);
      // Sauvegarder aussi en localStorage pour rétrocompatibilité
try {
         localStorage.setItem(STORAGE_KEY, v);
       } catch (_) { /* ignore */ }
      toast.success(`Visage · ${label}`);
    } catch (_err) {
      toast.error("Erreur de sauvegarde");
    }
  }

  const season = currentSeason(now);
  const eventsToday = activeEvents(now);

  return (
    <div className="space-y-4 rounded-xl border bg-background/50 p-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Palette className="h-4 w-4 text-primary" /> Visage du site (auto saison/événement)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Aujourd'hui (auto) : <strong>{autoTheme.label}</strong> · saison <Badge variant="secondary">{season}</Badge>
            {eventsToday.length > 0 && (
              <span className="ml-2">
                événement{eventsToday.length > 1 ? "s" : ""} du jour : {eventsToday.map((e) => <Badge key={e} className="ml-1">{e}</Badge>)}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => apply("auto", "automatique")}
          title="Remettre le détecteur automatique"
        >
          <RefreshCcw className="mr-1.5 h-3.5 w-3.5" /> Auto
        </Button>
      </div>

      {/* Aperçu live (mini carte utilisant les tokens du thème choisi) */}
      <div
        className="flex items-center justify-between gap-3 rounded-lg border p-4"
        style={{
          backgroundColor: resolved.theme.tokens.bg,
          color: resolved.theme.tokens.primary,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-xl font-black text-xl"
            style={{ backgroundColor: resolved.theme.tokens.surface, color: resolved.theme.tokens.primary }}
          >
            P.
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: resolved.theme.tokens.accent }}>
              {resolved.label}
            </p>
            <p className="text-xs opacity-80">
              {resolved.theme.greeting?.[lang || "fr"] ?? resolved.theme.greeting?.fr}
            </p>
          </div>
        </div>
        <Badge style={{ backgroundColor: resolved.theme.tokens.surface, color: resolved.theme.tokens.primary }}>
          {resolved.theme.decor !== "none" ? `décor : ${resolved.theme.decor}` : "aucun décor"}
        </Badge>
      </div>

      {/* Mode Auto / Off */}
      <div className="grid grid-cols-2 gap-2">
        <ModeButton active={saved === "auto"} onClick={() => apply("auto", "automatique")}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Automatique (saison + événement)
        </ModeButton>
        <ModeButton active={saved === "off"} onClick={() => apply("off", "Désactivé (thème fixe)")}>
          <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Désactiver (thème par défaut)
        </ModeButton>
      </div>

      {/* Saisons */}
      <Section title="Forcer une saison" icon={<Calendar className="h-3.5 w-3.5" />}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.values(SEASONAL_THEMES).map((t) => (
            <TemplateChip
              key={t.id}
              active={saved === `season:${t.id}`}
              onClick={() => apply(`season:${t.id}`, t.label)}
              color={t.tokens.primary}
              bg={t.tokens.bg}
            >
              <SeasonIcon id={t.id} />
              {t.label}
            </TemplateChip>
          ))}
        </div>
      </Section>

      {/* Événements */}
      <Section title="Forcer un événement" icon={<Sparkles className="h-3.5 w-3.5" />}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Object.values(EVENT_THEMES).map((t) => (
            <TemplateChip
              key={t.id}
              active={saved === `event:${t.id}`}
              onClick={() => apply(`event:${t.id}`, t.label)}
              color={t.tokens.primary}
              bg={t.tokens.bg}
            >
              <span className="text-base mr-1">{eventEmoji(t.id)}</span>
              {t.label}
            </TemplateChip>
          ))}
        </div>
      </Section>

      {/* Templates visuels */}
      <Section title="Forcer un template visuel" icon={<Eye className="h-3.5 w-3.5" />}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.values(TEMPLATES).map((t) => (
            <TemplateChip
              key={t.id}
              active={saved === `template:${t.id}`}
              onClick={() => apply(`template:${t.id}`, t.label.fr)}
              color={t.tokens.primary}
              bg={t.tokens.bg}
            >
              <span
                className="mr-1.5 inline-block h-3 w-3 rounded-full"
                style={{ background: `linear-gradient(135deg, ${t.tokens.primary}, ${t.tokens.accent})` }}
              />
              {t.label.fr}
            </TemplateChip>
          ))}
        </div>
      </Section>

      <p className="text-[11px] text-muted-foreground">
        Le détecteur automatique tourne déjà côté site : Noël, Nouvel An, Pâques, Ramadan, Eid,
        fêtes nationales allemande (3 oct) et camerounaise (20 mai), Saint-Valentin, etc.
        Un événement prime toujours sur une saison. Cette page sert à forcer ou prévisualiser.
      </p>
    </div>
  );
}

/* --------- sous-composants --------- */

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-white/10 bg-background/50 hover:bg-secondary/30"
      }`}
    >
      {children}
    </button>
  );
}

function TemplateChip({
  active,
  onClick,
  color,
  bg,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-semibold transition-all ${
        active ? "scale-[1.02] shadow-glow-sm" : "hover:bg-secondary/30"
      }`}
      style={{
        borderColor: active ? color : "rgba(255,255,255,0.1)",
        backgroundColor: active ? bg : "rgba(255,255,255,0.04)",
        color: active ? color : undefined,
      }}
    >
      {children}
    </button>
  );
}

function SeasonIcon({ id }: { id: string }) {
  const map: Record<string, string> = {
    spring: "🌸",
    summer: "☀️",
    autumn: "🍂",
    winter: "❄️",
  };
  return <span className="mr-1 text-base">{map[id] ?? "·"}</span>;
}

function eventEmoji(id: string): string {
  const map: Record<string, string> = {
    noel: "🎄",
    nouvelAn: "🎆",
    stValentin: "💘",
    halloween: "🎃",
    paques: "🐣",
    ramadan: "🌙",
    eidFitr: "🌙",
    eidAdha: "🐪",
    diwali: "🪔",
    yomKippour: "✡️",
    hanoucca: "🕎",
    unityDE: "🇩🇪",
    unityCM: "🇨🇲",
  };
  return map[id] ?? "✨";
}
