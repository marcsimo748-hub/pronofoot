"use client";

/**
 * VisaArticles — section conseils du MODULE PRONOVISA (FR/EN/DE).
 * Articles informatifs : Ausbildung, Studium, Chancenkarte, tourisme,
 * étudier en Europe, étudiants africains. Accordéons animés + liens officiels.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useT } from "@/lib/i18n";
import { getArticles } from "./visa-data";

export function VisaArticles() {
  const { lang, t } = useT();
  const [open, setOpen] = useState<string | null>(null);
  const articles = getArticles(lang);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-2xl font-black">{t("visa.guidesTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("visa.guidesIntro")}</p>
      </div>

      {articles.map((a) => {
        const isOpen = open === a.id;
        return (
          <div
            key={a.id}
            className="overflow-hidden rounded-xl border border-white/5 bg-card/70 backdrop-blur-sm"
          >
            <button
              onClick={() => setOpen(isOpen ? null : a.id)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/30"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{a.emoji}</span>
                <span>
                  <span className="block font-semibold">{a.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{a.summary}</span>
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
                  <div className="space-y-4 border-t border-white/5 p-4 pt-4">
                    {a.sections.map((s, i) => (
                      <div key={i}>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-primary">
                          {s.h}
                        </h3>
                        {s.p && <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{s.p}</p>}
                        {s.list && (
                          <ul className="mt-1.5 space-y-1.5">
                            {s.list.map((li, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-foreground/90">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                {li}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {a.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-background/50 px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          {l.label} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>

                    <p className="text-[11px] text-muted-foreground">{t("visa.infoNote")}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
