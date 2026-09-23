"use client";

/**
 * HousingGuides — guides logement du MODULE PRONO-HOUSING (FR/EN/DE).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n";
import { getHousingGuides, HOUSING_LEGAL_NOTE_BY_LANG } from "./housing-data";

export function HousingGuides() {
  const { t, lang } = useT();
  const L = (lang || "fr") as "fr" | "en" | "de";
  const [open, setOpen] = useState<string | null>(null);

  const guides = getHousingGuides(L);
  const legalNote = HOUSING_LEGAL_NOTE_BY_LANG[L] ?? HOUSING_LEGAL_NOTE_BY_LANG.fr;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-2xl font-black">{t("hou.guidesTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("hou.guidesIntro")}</p>
      </div>

      {guides.map((g) => {
        const isOpen = open === g.id;
        return (
          <div
            key={g.id}
            className="overflow-hidden rounded-xl border border-white/5 bg-card/70 backdrop-blur-sm"
          >
            <button
              onClick={() => setOpen(isOpen ? null : g.id)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/30"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{g.emoji}</span>
                <span>
                  <span className="block font-semibold">{g.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{g.summary}</span>
                </span>
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="space-y-4 border-t border-white/5 p-4">
                    {g.sections.map((s, i) => (
                      <div key={i}>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-primary">{s.h}</h3>
                        {s.p && <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{s.p}</p>}
                        {s.list && (
                          <ul className="mt-1.5 space-y-1.5">
                            {s.list.map((li, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-foreground/90">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                {li}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">{legalNote}</p>
    </div>
  );
}
