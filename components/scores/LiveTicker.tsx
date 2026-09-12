"use client";

/**
 * LiveTicker — bandeau des scores en direct.
 * • Lit UNIQUEMENT Supabase (jamais l'API externe) + abonnement temps réel
 * • Déclenche la synchro serveur (throttlée 90 s) en arrière-plan
 * • Défilement automatique (react-fast-marquee) si trop de matchs
 */

import { useCallback, useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { Radio, CalendarClock } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ScoreCard } from "./ScoreCard";
import type { LiveScoreRow, Match } from "@/lib/types";

interface LiveTickerProps {
  initialLive: LiveScoreRow[];
  upcoming: Match[];
}

export function LiveTicker({ initialLive, upcoming }: LiveTickerProps) {
  const [live, setLive] = useState<LiveScoreRow[]>(initialLive);
  const hasLive = live.length > 0;

  /** Relit le cache Supabase */
  const refresh = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("live_scores")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(15);
      if (data) setLive(data as LiveScoreRow[]);
    } catch {
      /* silencieux */
    }
  }, []);

  useEffect(() => {
    // 1) Temps réel Supabase : mise à jour instantanée des scores
    const supabase = getSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("live-scores-ticker")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "live_scores" },
          () => void refresh()
        )
        .subscribe();
    } catch {
      /* pas de config → rien */
    }

    // 2) Relecture périodique du cache (le SyncManager déclenche la sync serveur)
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30_000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [refresh]);

  // Affiche les prochains matchs tant qu'aucun match n'est en direct
  const items = hasLive
    ? live.map((m) => <ScoreCard key={m.id} match={m} variant="ticker" />)
    : upcoming.slice(0, 8).map((m) => <ScoreCard key={m.id} match={m} variant="ticker" />);

  return (
    <section className="border-y border-white/5 bg-card/40 backdrop-blur">
      <div className="container flex items-center gap-3 py-2.5">
        <div className="flex shrink-0 items-center gap-2 text-sm font-bold">
          {hasLive ? (
            <span className="flex items-center gap-1.5 text-red-400">
              <Radio className="h-4 w-4 animate-pulse" />
              <span className="hidden sm:inline">EN DIRECT</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-primary">
              <CalendarClock className="h-4 w-4" />
              <span className="hidden sm:inline">À VENIR</span>
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <p className="truncate text-sm text-muted-foreground">
            Les scores s'afficheront ici dès le coup d'envoi… ⚽
          </p>
        ) : items.length > 3 ? (
          <Marquee pauseOnHover gradient gradientColor="hsl(240 12% 3%)" speed={40} className="overflow-hidden">
            <div className="flex gap-3 pr-3">{items}</div>
          </Marquee>
        ) : (
          <div className="flex gap-3 overflow-x-auto">{items}</div>
        )}
      </div>
    </section>
  );
}
