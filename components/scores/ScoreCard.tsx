"use client";

/**
 * Carte de score — affiche un match (live, à venir ou terminé).
 */

import { Clock, Radio as RadioIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatMatchDate, matchStatusLabel } from "@/lib/utils";
import type { LiveScoreRow, Match, MatchEventRow } from "@/lib/types";
import { LEAGUES } from "@/lib/constants";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface ScoreCardProps {
  match: LiveScoreRow | Match;
  variant?: "ticker" | "full";
  className?: string;
  events?: MatchEventRow[];
}

function isLiveRow(m: ScoreCardProps["match"]): m is LiveScoreRow {
  return "status" in m && ("elapsed" in m || "raw" in m);
}

export function ScoreCard({ match, variant = "full", className, events }: ScoreCardProps) {
  const live = isLiveRow(match);
  const isLive = live && ["1H", "2H", "HT", "ET"].includes(String(match.status));
  const isFinished = live ? match.status === "FT" : match.status === "finished";
  const hasScore = (match.home_score ?? null) !== null;
  const league = LEAGUES[(match.league as keyof typeof LEAGUES) ?? "champions"];
  const dateStr = live ? match.match_date : (match as Match).match_date;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card/70 backdrop-blur transition-colors",
        isLive && "border-red-500/40 shadow-[0_0_18px_-8px_rgba(239,68,68,0.5)]",
        variant === "ticker" ? "flex w-64 shrink-0 flex-col gap-1.5 p-3" : "w-full p-4",
        className
      )}
    >
      {/* En-tête : ligue + statut */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: `${league?.color ?? "#10b981"}22`, color: league?.color ?? "#10b981" }}
        >
          {league?.short ?? "?"}
        </span>
        {isLive ? (
          <Badge variant="live" className="gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red-500" />
            {matchStatusLabel(match.status, isLiveRow(match) ? match.elapsed : null)}
          </Badge>
        ) : isFinished ? (
          <Badge variant="secondary">FT</Badge>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {formatMatchDate(dateStr)}
          </span>
        )}
      </div>

      {/* Équipes + score */}
      <div className={cn("grid items-center font-semibold", variant === "ticker" ? "gap-1" : "gap-2 text-base")}>
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <TeamLogo name={match.home_team} size={variant === "ticker" ? 14 : 20} />
            <span className="truncate">{match.home_team}</span>
          </span>
          <span className={cn("shrink-0 font-mono tabular-nums", hasScore && isFinished && "text-muted-foreground")}>
            {hasScore ? match.home_score : "–"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <TeamLogo name={match.away_team} size={variant === "ticker" ? 14 : 20} />
            <span className="truncate">{match.away_team}</span>
          </span>
          <span className={cn("shrink-0 font-mono tabular-nums", hasScore && isFinished && "text-muted-foreground")}>
            {hasScore ? match.away_score : "–"}
          </span>
        </div>
      </div>

      {/* Événements du match : buteurs (⚽ minute) et cartons (🟨/🟥) */}
      {variant === "full" && events && events.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
          {events
            .filter((e) => e.type === "Goal" || e.type === "Card")
            .slice(0, 6)
            .map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span aria-hidden>
                    {e.type === "Goal" ? "⚽" : /red/i.test(e.detail ?? "") ? "🟥" : "🟨"}
                  </span>
                  <span className="truncate">{e.player}</span>
                </span>
                <span className="shrink-0 font-mono text-primary">{e.minute !== null ? `${e.minute}'` : ""}</span>
              </div>
            ))}
        </div>
      )}

      {variant === "full" && isLive && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-400">
          <RadioIcon className="h-3 w-3 animate-pulse" /> Match en direct · maj toutes les 90 s
        </div>
      )}
    </div>
  );
}
