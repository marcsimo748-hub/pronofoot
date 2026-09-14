"use client";

/**
 * Carte d'un match DÉJÀ COMMENCÉ (ou fini récemment) :
 * les pronostics de TOUS les joueurs sont dévoilés 🔓
 * (protégés par la RLS jusqu'au coup d'envoi — migration 012).
 */

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatMatchDate } from "@/lib/utils";
import { LEAGUES } from "@/lib/constants";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { ShareButton } from "@/components/shared/ShareButton";
import type { StartedMatch } from "@/lib/services/predictions.service";

export function StartedMatchCard({ data }: { data: StartedMatch }) {
  const { match, predictions } = data;
  const league = LEAGUES[match.league];
  const finished = match.status === "finished" && match.home_score !== null;
  const live = !finished && new Date(match.match_date).getTime() <= Date.now();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-card/60 p-4"
    >
      {/* En-tête : championnat + heure + statut */}
      <div className="mb-2.5 flex items-center gap-2 text-xs">
        <span className="font-bold" style={{ color: league?.color }}>
          {league?.short ?? match.league}
        </span>
        <span className="text-muted-foreground">{formatMatchDate(match.match_date)}</span>
        {finished ? (
          <Badge variant="secondary" className="ml-auto">Terminé</Badge>
        ) : live ? (
          <Badge className="ml-auto gap-1 bg-red-500/15 text-red-400 hover:bg-red-500/15">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> En cours
          </Badge>
        ) : null}
        <span className={cn("ml-auto", (finished || live) && "ml-1")}>
          <ShareButton
            title={`${match.home_team} - ${match.away_team} | Les pronos de la communauté sur PRONO`}
            text={`${predictions.length} pronos déjà déposés sur ${match.home_team} - ${match.away_team}`}
            url="/pronos"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
          />
        </span>
      </div>

      {/* Affiche */}
      <div className="mb-3 flex items-center justify-between gap-2 text-sm font-bold">
        <span className="flex min-w-0 items-center gap-1.5">
          <TeamLogo name={match.home_team} size={18} />
          <span className="truncate">{match.home_team}</span>
        </span>
        {finished ? (
          <span className="shrink-0 rounded-lg bg-secondary px-3 py-1 text-base font-mono tabular-nums">
            {match.home_score} - {match.away_score}
          </span>
        ) : (
          <span className="shrink-0 text-muted-foreground">vs</span>
        )}
        <span className="flex min-w-0 flex-row-reverse items-center gap-1.5">
          <TeamLogo name={match.away_team} size={18} />
          <span className="truncate">{match.away_team}</span>
        </span>
      </div>

      {/* Pronos dévoilés */}
      {predictions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 p-2.5 text-center text-xs text-muted-foreground">
          Aucun pronostic sur ce match
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            🔓 {predictions.length} prono{predictions.length > 1 ? "s" : ""} dévoilé{predictions.length > 1 ? "s" : ""}
          </p>
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {predictions.map((p) => {
              const exact = p.calculated && p.points_earned >= 5;
              const good = p.calculated && p.points_earned > 0 && p.points_earned < 5;
              return (
                <div
                  key={p.user_id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                    exact ? "bg-emerald-500/10" : good ? "bg-primary/10" : "bg-secondary/40"
                  )}
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={p.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="text-[9px]">
                      {(p.username ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate font-medium">{p.username ?? "Joueur"}</span>
                  <span className="shrink-0 rounded-md bg-background/60 px-2 py-0.5 font-bold font-mono tabular-nums">
                    {p.home_score} - {p.away_score}
                  </span>
                  {p.calculated ? (
                    <span
                      className={cn(
                        "w-12 shrink-0 text-right text-xs font-bold font-mono tabular-nums",
                        exact ? "text-emerald-400" : good ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      +{p.points_earned} pts
                    </span>
                  ) : (
                    <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">…</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
