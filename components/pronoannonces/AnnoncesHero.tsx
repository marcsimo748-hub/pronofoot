"use client";

/**
 * Hero de /prono-annonces — version traduite (FR/EN/DE via useT).
 * Les listes de catégories sont générées depuis annonces-data :
 * elles suivent automatiquement la langue choisie.
 */

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { CATEGORIES, catLabel } from "./annonces-data";

const GROUPS = [
  { key: "ann.uniServices", cats: ["coiffure", "demenagement", "dj", "chauffeur", "gardenfant", "service"] },
  { key: "ann.uniGoods", cats: ["voitures", "transport", "electronique", "mode", "maison", "objets"] },
  { key: "ann.uniCommunity", cats: ["logement", "rencontre", "partenaire", "ami"] },
] as const;

export function AnnoncesHero() {
  const { lang, t } = useT();

  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card/80 via-background to-background p-6 sm:p-10">
      {/* Orbes lumineux décoratifs */}
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-2xl shadow-lg shadow-primary/20">
            📢
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              PRONO <span className="text-gradient">Annonces</span>
            </h1>
            <p className="text-sm text-muted-foreground">{t("ann.heroSub")}</p>
          </div>
        </div>

        {/* Les trois univers (libellés traduits) */}
        <div className="grid gap-3 sm:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.key} className="glass rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40">
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t(g.key)}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {g.cats
                  .map((c) => CATEGORIES.find((x) => x.value === c)?.emoji)
                  .join(" ")}{" "}
                {g.cats.map((c) => catLabel(c, lang)).join(" · ")}
              </p>
            </div>
          ))}
        </div>

        {/* Garanties */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-300 transition-transform duration-300 hover:scale-105">
            {t("ann.free")}
          </span>
          <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 font-semibold text-sky-300 transition-transform duration-300 hover:scale-105">
            {t("ann.shipHint")}
          </span>
          <span className="rounded-full border border-white/15 bg-card/60 px-3 py-1.5 font-semibold text-muted-foreground transition-transform duration-300 hover:scale-105">
            {t("ann.moderated")}
          </span>
          <span className="rounded-full border border-white/15 bg-card/60 px-3 py-1.5 font-semibold text-muted-foreground transition-transform duration-300 hover:scale-105">
            {t("ann.europe")}
          </span>
        </div>

        {/* Bilingue : la diaspora parle FR / EN / DE */}
        <p className="rounded-xl border border-white/10 bg-card/60 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
          🗣️ Trouve de l'aide près de chez toi : quartier et code postal inclus ·{" "}
          <span className="font-semibold text-foreground">Find help near you</span> (neighborhood &amp; postal code) ·{" "}
          <span className="font-semibold text-foreground">Finde Hilfe in deiner Nähe</span> (Viertel &amp; PLZ)
        </p>

        {/* Passerelle boutiques */}
        <Link
          href="/boutiques"
          className="group inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-all duration-300 hover:scale-[1.02] hover:bg-primary/20"
        >
          🛍️ {t("ann.ctaShop")}
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </header>
  );
}
