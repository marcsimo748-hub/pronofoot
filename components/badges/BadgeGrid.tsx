/**
 * BadgeGrid — grille de tous les badges avec statut (obtenu ou grisé).
 *
 * Affiche :
 * - En haut : les badges obtenus (en couleur, avec leur date)
 * - En bas : les badges pas encore obtenus (grisés, avec critère)
 *
 * Sert sur /joueur/[id] et /dashboard.
 */

import { Lock } from "lucide-react";
import { BadgeChip } from "./BadgeChip";
import { BADGES, type Lang } from "@/lib/badges";
import { tBadgeName, tBadgeDesc } from "@/lib/services/badges.service";

interface BadgeGridProps {
  badges: { code: string; awarded_at: string }[];
  lang?: Lang;
  size?: "sm" | "md" | "lg";
}

export function BadgeGrid({ badges, lang = "fr", size = "md" }: BadgeGridProps) {
  const ownedCodes = new Set(badges.map((b) => b.code));
  const owned = BADGES.filter((b) => ownedCodes.has(b.code));
  const locked = BADGES.filter((b) => !ownedCodes.has(b.code));

  // Tri : legendary → rare → common ; owned en premier
  const rarityOrder = { legendary: 0, rare: 1, common: 2 } as const;
  owned.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
  locked.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  const awardMap = new Map(badges.map((b) => [b.code, b.awarded_at]));

  return (
    <div className="space-y-5">
      {owned.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            🏅 Obtenus ({owned.length})
          </h3>
          <div className="flex flex-wrap gap-4">
            {owned.map((badge) => (
              <BadgeChip
                key={badge.code}
                badge={badge}
                lang={lang}
                awardedAt={awardMap.get(badge.code)}
                size={size}
              />
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            🔒 À débloquer ({locked.length})
          </h3>
          <div className="flex flex-wrap gap-4">
            {locked.map((badge) => (
              <div
                key={badge.code}
                className="group relative inline-flex flex-col items-center gap-1"
                title={tBadgeDesc(badge, lang)}
              >
                <div className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-2xl grayscale opacity-60 transition-opacity group-hover:opacity-90 ring-2 ring-white/10">
                  <Lock className="h-4 w-4 text-slate-400" aria-hidden />
                  <span className="absolute inset-0 grid place-items-center text-2xl opacity-40">
                    {badge.emoji}
                  </span>
                </div>
                <span className="max-w-[5rem] text-center text-[10px] font-medium leading-tight text-muted-foreground/70">
                  {tBadgeName(badge, lang)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {owned.length === 0 && locked.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun badge disponible.</p>
      )}
    </div>
  );
}
