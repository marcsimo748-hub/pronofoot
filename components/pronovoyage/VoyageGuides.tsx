"use client";

/**
 * Guides formalités voyage (MODULE 6) — accordéon simple et lisible.
 * Infos indicatives, renvoi systématique vers les autorités officielles.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { VOYAGE_GUIDES } from "./voyage-data";

export function VoyageGuides() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-2xl font-black text-primary">6 mois</p>
          <p className="mt-1 text-xs text-muted-foreground">Validité de passeport minimum conseillée</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-2xl font-black text-primary">10 000 €</p>
          <p className="mt-1 text-xs text-muted-foreground">Montant de liquide au-delà duquel déclarer en douane</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-2xl font-black text-primary">10 jours</p>
          <p className="mt-1 text-xs text-muted-foreground">Délai minimum pour le vaccin fièvre jaune</p>
        </div>
      </div>

      {VOYAGE_GUIDES.map((g, i) => (
        <div key={g.title} className="overflow-hidden rounded-xl border border-white/10 bg-card/60">
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
        ⚠️ Ces guides sont indicatifs et ne remplacent pas les sources officielles :
        vérifie toujours les règles en vigueur auprès de ton ambassade ou consulat,
        de la douane et de ta compagnie de transport avant de voyager.
      </p>
    </div>
  );
}
