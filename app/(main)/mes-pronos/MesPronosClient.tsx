"use client";
// app/(main)/mes-pronos/MesPronosClient.tsx
// =====================================================================
// Liste des pronos dévoilés de l'utilisateur avec bouton "Partager PNG".
// =====================================================================

import { Card, CardContent } from "@/components/ui/card";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { PronoCard } from "@/components/shared/PronoCard";
import { Trophy } from "lucide-react";
import { LEAGUES } from "@/lib/constants";
import { formatMatchDate } from "@/lib/utils";
import type { Match, Prediction } from "@/lib/types";

type PredictionWithMatch = Prediction & { match: Match };

interface Props {
  predictions: PredictionWithMatch[];
  username: string;
  totalPoints: number;
}

export function MesPronosClient({ predictions, username, totalPoints }: Props) {
  if (predictions.length === 0) {
    return (
      <div className="container py-12 text-center">
        <div className="rounded-xl border border-dashed p-10 text-sm text-muted-foreground">
          Tu n'as pas encore de pronos dévoilés · va sur{" "}
          <a href="/pronos" className="text-emerald-400 underline">
            /pronos
          </a>{" "}
          pour commencer !
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-8">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-black">
          <Trophy className="mr-2 inline h-7 w-7 text-amber-400" />
          Mes derniers pronos
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          📲 Télécharge tes pronos en carte PNG et partage-les pour défier tes potes
        </p>
      </header>

      <div className="space-y-4">
        {predictions.slice(0, 12).map((p) => {
          const league = LEAGUES[p.match.league as keyof typeof LEAGUES];
          return (
            <Card key={p.id} className="overflow-hidden border-white/10 bg-card/60">
              <CardContent className="space-y-4 p-5">
                {/* En-tête match */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase"
                      style={{
                        backgroundColor: league ? `${league.color}20` : undefined,
                        color: league?.color,
                      }}
                    >
                      {league?.short ?? p.match.league}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatMatchDate(p.match.match_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {p.calculated ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          p.points_earned >= 5
                            ? "bg-emerald-500/20 text-emerald-400"
                            : p.points_earned > 0
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {p.points_earned} pts
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
                        ⏳ en attente
                      </span>
                    )}
                  </div>
                </div>

                {/* Le match */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="flex items-center justify-end gap-2 text-right">
                    <span className="font-bold">{p.match.home_team}</span>
                    <TeamLogo name={p.match.home_team} size={24} />
                  </div>
                  <div className="text-3xl font-black tabular-nums">
                    {p.home_score}
                    <span className="mx-2 text-muted-foreground">-</span>
                    {p.away_score}
                  </div>
                  <div className="flex items-center gap-2">
                    <TeamLogo name={p.match.away_team} size={24} />
                    <span className="font-bold">{p.match.away_team}</span>
                  </div>
                </div>

                {/* Bouton partage PNG */}
                <PronoCard
                  homeTeam={p.match.home_team}
                  awayTeam={p.match.away_team}
                  homeScore={p.home_score}
                  awayScore={p.away_score}
                  username={username}
                  matchDate={formatMatchDate(p.match.match_date)}
                  league={league?.short ?? p.match.league}
                  totalPoints={totalPoints}
                  accentColor={league?.color ?? "#16a34a"}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}