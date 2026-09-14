"use client";

/**
 * Page Pronos (client) — onglets par championnat, groupement par jour,
 * bannières/arrière-plans par championnat configurés par l'admin.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { MatchPredictionCard } from "./MatchPredictionCard";
import { StartedMatchCard } from "./StartedMatchCard";
import type { MatchParticipants, PublicPrediction, StartedMatch } from "@/lib/services/predictions.service";
import { BonusPanel } from "./BonusPanel";
import { cn, formatDayLabel } from "@/lib/utils";
import { LEAGUES, LEAGUE_CODES } from "@/lib/constants";
import type { LeagueCode, Match, Prediction, SiteSettings } from "@/lib/types";

interface Props {
  matches: Match[];
  predictions: Prediction[];
  settings: SiteSettings;
  /** Matchs commencés (48 h) : pronos de tous les joueurs dévoilés */
  startedMatches: StartedMatch[];
  /** Admin uniquement : pronos des joueurs sur les matchs à venir */
  adminPeek?: Record<string, PublicPrediction[]>;
  /** Qui a déjà pronostiqué sur chaque match à venir (pseudos, jamais les scores) */
  participants?: Record<string, MatchParticipants>;
}

type Tab = LeagueCode | "all" | "live" | "bonus";

export function PronosClient({ matches, predictions, settings, startedMatches, adminPeek, participants }: Props) {
  const [tab, setTab] = useState<Tab>("all");

  // CORRECTIF FILTRE : les pronos restent en mémoire quand on change
  // d'onglet championnat — plus jamais de « re-pronostiquer » un match déjà joué.
  const [myPredictions, setMyPredictions] = useState<Prediction[]>(predictions);
  const predictionsByMatch = useMemo(() => {
    const map = new Map<string, Prediction>();
    myPredictions.forEach((p) => map.set(p.match_id, p));
    return map;
  }, [myPredictions]);

  // Un prono vient d'être sauvé sur une carte : on l'ajoute à l'état global
  // pour que TOUTES les vues (Tous + championnat) le reflètent instantanément.
  const handleSaved = (matchId: string, home: number, away: number) => {
    setMyPredictions((prev) => {
      const existing = prev.find((p) => p.match_id === matchId);
      const updated: Prediction = {
        ...(existing ?? { id: `local-${matchId}`, user_id: "", match_id: matchId, created_at: new Date().toISOString() }),
        home_score: home,
        away_score: away,
        calculated: false,
        points_earned: 0,
      } as Prediction;
      return [...prev.filter((p) => p.match_id !== matchId), updated];
    });
  };

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

  const leagueVisual = tab !== "all" && tab !== "bonus" && tab !== "live" ? settings.leagues[tab] : null;

  const tabs: { key: Tab; label: string; color: string; count: number }[] = [
    { key: "all", label: "Tous", color: "#10b981", count: matches.length },
    { key: "live", label: "🔴 En direct", color: "#ef4444", count: startedMatches.length },
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
      {tab === "live" ? (
        startedMatches.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <span className="text-4xl">🏟️</span>
            <p className="mt-4 font-semibold">Aucun match commencé ces dernières 48 h</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dès le coup d&apos;envoi, les pronostics de tous les joueurs sont dévoilés ici 🔓
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Dès que le match démarre, plus aucun secret : voici les pronos de toute la communauté,
              y compris les tiens 😉
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {startedMatches.map((d) => (
                <StartedMatchCard key={d.match.id} data={d} />
              ))}
            </div>
          </div>
        )
      ) : tab === "bonus" ? (
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
                  <MatchPredictionCard
                    key={m.id}
                    match={m}
                    prediction={predictionsByMatch.get(m.id)}
                    adminPeek={adminPeek?.[m.id]}
                    participants={participants?.[m.id]}
                    onSaved={handleSaved}
                  />
                ))}
              </motion.div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
