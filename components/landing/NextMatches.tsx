"use client";

/**
 * Section "Prochains matchs" de la landing.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight } from "lucide-react";
import { formatMatchDate, cn } from "@/lib/utils";
import { LEAGUES } from "@/lib/constants";
import type { Match } from "@/lib/types";

export function NextMatches({ matches }: { matches: Match[] }) {
  if (!matches.length) return null;

  return (
    <section className="container py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-black">
            <CalendarDays className="h-7 w-7 text-primary" /> Prochains matchs
          </h2>
          <p className="mt-2 text-muted-foreground">Pronostique avant le coup d'envoi pour marquer des points.</p>
        </div>
        <Link href="/pronos" className="hidden shrink-0 text-sm font-semibold text-primary hover:underline sm:block">
          Tout voir →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {matches.slice(0, 6).map((m, i) => {
          const league = LEAGUES[m.league];
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card-hover rounded-xl border bg-card/70 p-4"
              style={{ borderColor: `${league?.color}30` }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                  style={{ backgroundColor: `${league?.color}22`, color: league?.color }}
                >
                  {league?.name}
                </span>
                <span className="text-[11px] text-muted-foreground">{formatMatchDate(m.match_date)}</span>
              </div>
              <p className={cn("font-semibold")}>
                <span className="block truncate">{m.home_team}</span>
                <span className="my-1 block text-center text-xs font-bold text-muted-foreground">CONTRE</span>
                <span className="block truncate">{m.away_team}</span>
              </p>
            </motion.div>
          );
        })}
      </div>

      <Link href="/pronos" className="mt-6 block sm:hidden">
        <span className="flex items-center justify-center gap-1 text-sm font-semibold text-primary">
          Voir tous les matchs <ChevronRight className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}
