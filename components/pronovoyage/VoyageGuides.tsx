"use client";

/**
 * Guides formalités voyage (MODULE 6) — accordéon simple et lisible.
 * Infos indicatives, renvoi systématique vers les autorités officielles.
 * Trilingue : FR/EN/DE via useT().
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, type Lang } from "@/lib/i18n";
import { getVoyageGuides, VOYAGE_LEGAL_NOTE_BY_LANG } from "./voyage-data";

export function VoyageGuides() {
  const { t, lang } = useT();
  const L = (lang || "fr") as Lang;
  const [open, setOpen] = useState<number | null>(0);

  const guides = getVoyageGuides(L);
  const legalNote = VOYAGE_LEGAL_NOTE_BY_LANG[L] ?? VOYAGE_LEGAL_NOTE_BY_LANG.fr;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-2xl font-black text-primary">{t("voy.gStat1")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("voy.gStat1D")}</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-2xl font-black text-primary">{t("voy.gStat2")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("voy.gStat2D")}</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-2xl font-black text-primary">{t("voy.gStat3")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("voy.gStat3D")}</p>
        </div>
      </div>

      {guides.map((g, i) => (
        <div key={g.title + i} className="overflow-hidden rounded-xl border border-white/10 bg-card/60">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            aria-expanded={open === i}
          >
            <span className="text-xl">{g.emoji}</span>
            <span className="flex-1 font-semibold">{g.title}</span>
            <ChevronDown
              className={cn("h-4 w-4 text-muted-foreground transition-transform", open === i && "rotate-180")}
            />
          </button>
          {open === i && (
            <div className="space-y-2.5 border-t border-white/5 px-4 py-4">
              {g.body.map((p, j) => (
                <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}

      <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted-foreground">
        {t("voy.gAlert")}
      </p>
      <p className="sr-only">{legalNote}</p>
    </div>
  );
}
