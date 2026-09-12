"use client";

/**
 * Page Pronos (client) — onglets par championnat, groupement par jour,
 * bannières/arrière-plans par championnat configurés par l'admin.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { MatchPredictionCard } from "./MatchPredictionCard";
import { BonusPanel } from "./BonusPanel";
import { cn, formatDayLabel } from "@/lib/utils";
import { LEAGUES, LEAGUE_CODES } from "@/lib/constants";
import type { LeagueCode, Match, Prediction, SiteSettings } from "@/lib/types";

interface Props {
  matches: Match[];
  predictions: Prediction[];
  settings: SiteSettings;
}

type Tab = LeagueCode | "all" | "bonus";

export function PronosClient({ matches, predictions, settings }: Props) {
  const [tab, setTab] = useState<Tab>("all");

  const predictionsByMatch = useMemo(() => {
    const map = new Map<string, Prediction>();
    predictions.forEach((p) => map.set(p.match_id, p));
    return map;
  }, [predictions]);

  const filtered = useMemo(
    () => (tab === "all" || tab === "bonus" ? matches : matches.filter((m) => m.league === tab)),
    [tab, matches]
  );

  // Groupement par jour
  const byDay = useMemo(() => {
    const groups = new Map<string, Match[]>();
    for (const m of filtered) {
      const day = new Date(m.match_date).toDateString();
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day)!.push(m);
    }
    return [...groups.entries()];
  }, [filtered]);

  const leagueVisual = tab !== "all" && tab !== "bonus" ? settings.leagues[tab] : null;

  const tabs: { key: Tab; label: string; color: string; count: number }[] = [
    { key: "all", label: "Tous", color: "#10b981", count: matches.length },
    ...LEAGUE_CODES.map((code) => ({
      key: code as Tab,
      label: LEAGUES[code].short,
      color: LEAGUES[code].color,
      count: matches.filter((m) => m.league === code).length,
    })),
    { key: "bonus", label: "🏆 Bonus", color: "#f59e0b", count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Bannière du championnat sélectionné (Admin > 🏟️ Bannières) */}
      {leagueVisual?.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={leagueVisual.banner_url}
          alt=""
          className="h-28 w-full rounded-xl border object-cover md:h-36"
        />
      )}

      {/* Onglets championnats */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
              tab === t.key ? "border-transparent text-white shadow-glow-sm" : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
            )}
            style={tab === t.key ? { backgroundColor: t.color } : undefined}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                "rounded-full px-1.5 text-[10px]",
                tab === t.key ? "bg-black/25" : "bg-secondary"
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {tab === "bonus" ? (
        <BonusPanel />
      ) : byDay.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 font-semibold">Aucun match à pronostiquer ici</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reviens plus tard — les nouveaux matchs des 19 équipes vedettes sont ajoutés automatiquement.
          </p>
        </div>
      ) : (
        /* Arrière-plan du championnat (Admin > 🖼️ Arrière-plans) */
        <div
          className={cn("space-y-6", leagueVisual?.background_url && "rounded-xl p-4")}
          style={
            leagueVisual?.background_url
              ? {
                  backgroundImage: `linear-gradient(hsl(240 12% 3% / 0.88), hsl(240 12% 3% / 0.95)), url(${leagueVisual.background_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {byDay.map(([day, dayMatches]) => (
            <section key={day} className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <span className="h-px w-6 bg-primary" />
                {formatDayLabel(dayMatches[0].match_date)}
                <span className="text-[10px] font-medium">({dayMatches.length} match{dayMatches.length > 1 ? "s" : ""})</span>
              </h3>
              <motion.div layout className="grid gap-3 md:grid-cols-2">
                {dayMatches.map((m) => (
                  <MatchPredictionCard key={m.id} match={m} prediction={predictionsByMatch.get(m.id)} />
                ))}
              </motion.div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
