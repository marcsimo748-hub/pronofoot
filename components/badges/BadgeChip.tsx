"use client";

/**
 * BadgeChip — affichage compact d'un badge (emoji + nom + rareté).
 *
 * Utilisé sur la fiche joueur, le profil utilisateur, le classement.
 * Le tooltip affiche la description (trilingue via lib/badges).
 */

import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { badgeColor, type BadgeDef, type Lang } from "@/lib/badges";
import { tBadgeName, tBadgeDesc } from "@/lib/services/badges.service";

interface BadgeChipProps {
  badge: BadgeDef;
  lang?: Lang;
  /** Date d'obtention (affichée en tooltip). */
  awardedAt?: string;
  /** Affichage large (pour page joueur) vs compact (pour dashboard). */
  size?: "sm" | "md" | "lg";
  /** Badge nouvellement décerné → animation pulse. */
  isNew?: boolean;
}

export function BadgeChip({
  badge,
  lang = "fr",
  awardedAt,
  size = "md",
  isNew = false,
}: BadgeChipProps) {
  const sizes = {
    sm: { box: "h-9 w-9 text-lg", ring: "ring-1" },
    md: { box: "h-12 w-12 text-2xl", ring: "ring-2" },
    lg: { box: "h-16 w-16 text-4xl", ring: "ring-[3px]" },
  } as const;
  const s = sizes[size];

  const desc = tBadgeDesc(badge, lang);
  const name = tBadgeName(badge, lang);
  const tooltip = awardedAt
    ? `${desc} · ${new Date(awardedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : "en-GB")}`
    : desc;

  return (
    <div
      className={cn("group relative inline-flex flex-col items-center gap-1", isNew && "animate-pulse-dot")}
      title={tooltip}
      aria-label={`Badge : ${name}. ${tooltip}`}
    >
      <div
        className={cn(
          "relative grid place-items-center rounded-full bg-gradient-to-br shadow-lg ring-primary/30 transition-transform group-hover:scale-110",
          s.box,
          s.ring,
          badgeColor(badge.rarity)
        )}
      >
        <span aria-hidden>{badge.emoji}</span>
        {isNew && (
          <span
            className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px] font-black text-white ring-2 ring-background"
            aria-label="Nouveau"
          >
            ✦
          </span>
        )}
      </div>
      {size !== "sm" && (
        <span className="max-w-[5rem] text-center text-[10px] font-semibold leading-tight text-muted-foreground">
          {name}
        </span>
      )}
    </div>
  );
}

/** Variante inline (pour liste compacte en dashboard / classement) */
export function BadgeInline({ badge, lang = "fr" }: { badge: BadgeDef; lang?: Lang }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/50 px-2 py-0.5 text-[11px] font-medium"
      title={tBadgeDesc(badge, lang)}
    >
      <Award className="h-3 w-3 text-primary" />
      <span>{badge.emoji}</span>
      <span>{tBadgeName(badge, lang)}</span>
    </span>
  );
}
