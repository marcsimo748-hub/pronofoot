"use client";

/**
 * Hero de la landing — animations Framer Motion.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Trophy, Radio, Newspaper, Music4, Bot, BarChart3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const FEATURES = [
  { icon: Trophy, label: "Pronostics", href: "/pronos" },
  { icon: Radio, label: "Scores live", href: "/scores" },
  { icon: Newspaper, label: "News monde", href: "/news" },
  { icon: Music4, label: "Musique", href: "/music" },
  { icon: Bot, label: "Assistant IA", href: "#ia" },
  { icon: BarChart3, label: "Classements", href: "/classement" },
];

export function Hero({
  stats,
  loggedIn,
}: {
  stats: { players: number; matches: number; teams: number };
  loggedIn: boolean;
}) {
  const { t } = useT();
  return (
    <section className="relative overflow-hidden">

      <div className="container relative flex flex-col items-center gap-6 py-16 text-center md:py-24">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"
        >
          {t("hero.badge")}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-5xl font-black leading-tight tracking-tight sm:text-6xl md:text-8xl"
        >
          <span className="text-gradient">PRONO</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="font-display text-xl font-black italic md:text-3xl"
        >
          {t("hero.t2")}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="text-base font-semibold text-primary/90 md:text-lg"
        >
          {t("hero.t3")} <span className="align-middle">⚽</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-balance text-muted-foreground md:text-lg"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {loggedIn ? (
            <Link href="/pronos">
              <Button size="xl" variant="glow" className="gap-2">
                <Trophy className="h-5 w-5" /> {t("hero.ctaPronos")}
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button size="xl" variant="glow" className="gap-2">
                <Zap className="h-5 w-5" /> {t("hero.ctaStart")}
              </Button>
            </Link>
          )}
          <Link href="/scores">
            <Button size="xl" variant="outline" className="gap-2">
              <Radio className="h-5 w-5" /> {t("hero.ctaScores")}
            </Button>
          </Link>
        </motion.div>

        {/* Stats live */}
        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-4 grid grid-cols-3 gap-6 md:gap-12"
        >
          {[
            { value: stats.players, label: t("hero.statPlayers") },
            { value: stats.matches, label: t("hero.statMatches") },
            { value: stats.teams, label: t("hero.statTeams") },
          ].map((s) => (
            <div key={s.label}>
              <dt className="font-mono text-2xl font-black text-primary md:text-3xl">{s.value.toLocaleString("fr-FR")}</dt>
              <dd className="text-[11px] uppercase tracking-wide text-muted-foreground md:text-xs">{s.label}</dd>
            </div>
          ))}
        </motion.dl>

        {/* Raccourcis features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {FEATURES.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-all hover:border-primary/40 hover:text-foreground"
            >
              <f.icon className="h-3.5 w-3.5 text-primary" />
              {f.label}
              <ChevronRight className="h-3 w-3 opacity-50" />
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
