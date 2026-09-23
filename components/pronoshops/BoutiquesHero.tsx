"use client";

/**
 * Hero de /boutiques : annuaire des boutiques membres, traduit (FR/EN/DE).
 */

import { useT } from "@/lib/i18n";

export function BoutiquesHero() {
  const { t } = useT();
  const steps = [
    { n: "1", title: t("shop.step1"), desc: t("shop.step1d") },
    { n: "2", title: t("shop.step2"), desc: t("shop.step2d") },
    { n: "3", title: t("shop.step3"), desc: t("shop.step3d") },
  ];

  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card/80 via-background to-background p-6 sm:p-10">
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-2xl shadow-lg shadow-primary/20">
            🛍️
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              Boutiques <span className="text-gradient">de la communauté</span>
            </h1>
            <p className="text-sm text-muted-foreground">{t("shop.heroSub")}</p>
          </div>
        </div>

        {/* Comment ça marche */}
        <ol className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-3">
          {steps.map((e) => (
            <li key={e.n} className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/30">
                {e.n}
              </span>
              <div>
                <p className="text-sm font-bold">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </header>
  );
}
