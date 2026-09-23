"use client";

/**
 * Hero de la landing — animations Framer Motion.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Trophy, Radio, Newspaper, Music4, Bot, BarChart3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";

const FEATURES = [
  { icon: Trophy, label: "Pronostics", href: "/pronos" },
  { icon: Radio, label: "Scores live", href: "/scores" },
  { icon: Newspaper, label: "News monde", href: "/news" },
  { icon: Music4, label: "Musique", href: "/music" },
  { icon: Bot, label: "Assistant IA", href: "#ia" },
  { icon: BarChart3, label: "Classements", href: "/classement" },
];

export function Hero({
  wallpaper,
  stats,
  loggedIn,
}: {
  wallpaper?: string;
  stats: { players: number; matches: number; teams: number };
  loggedIn: boolean;
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Fond d'écran global (Admin > 🖼️ Fonds d'Écran Globaux) */}
      {wallpaper && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wallpaper} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </>
      )}

      <div className="container relative flex flex-col items-center gap-6 py-16 text-center md:py-24">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"
        >
          ⚡ {SITE_NAME} — 100% gratuit · propulsé par l'IA
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl"
        >
          PRÉDICT. <span className="text-gradient">COMPÈTE.</span>
          <br />
          DOMINE. <span className="align-middle text-3xl md:text-5xl">⚽</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-balance text-muted-foreground md:text-lg"
        >
          Pronostique les matchs des 19 plus grands clubs européens, suis les scores en direct,
          écoute ta playlist et chatte avec l'assistant IA — tout-en-un, gratuit pour toujours.
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
                <Trophy className="h-5 w-5" /> Faire mes pronostics
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button size="xl" variant="glow" className="gap-2">
                <Zap className="h-5 w-5" /> Commencer gratuitement
              </Button>
            </Link>
          )}
          <Link href="/scores">
            <Button size="xl" variant="outline" className="gap-2">
              <Radio className="h-5 w-5" /> Voir les scores
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
            { value: stats.players, label: "joueurs" },
            { value: stats.matches, label: "matchs 2026-27" },
            { value: stats.teams, label: "équipes vedettes" },
          ].map((s) => (
            <div key={s.label}>
              <dt className="text-2xl font-black text-primary md:text-3xl">{s.value.toLocaleString("fr-FR")}</dt>
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
