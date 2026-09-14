"use client";

/**
 * Tableau de classement (général, championnat, mensuel, groupes).
 */

import { Trophy, Medal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StandingRow } from "@/lib/types";

const RANK_STYLES = [
  "bg-amber-400/15 text-amber-400 border-amber-400/40", // 🥇
  "bg-slate-300/15 text-slate-300 border-slate-300/40", // 🥈
  "bg-orange-500/15 text-orange-500 border-orange-500/40", // 🥉
];

export function LeaderboardTable({
  rows,
  currentUserId,
  showPreds = false,
}: {
  rows: StandingRow[];
  currentUserId?: string;
  showPreds?: boolean;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Trophy className="mx-auto mb-3 h-8 w-8 opacity-40" />
        Pas encore de classement — sois le premier à marquer des points ! ⚽
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-14 px-4 py-3 text-center">#</th>
            <th className="px-2 py-3">Joueur</th>
            {showPreds && <th className="hidden px-2 py-3 text-right sm:table-cell">Pronos</th>}
            <th className="px-4 py-3 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.user_id}
              className={cn(
                "border-b transition-colors hover:bg-accent/50",
                currentUserId && row.user_id === currentUserId && "bg-primary/10"
              )}
            >
              <td className="px-4 py-3 text-center">
                {i < 3 ? (
                  <span className={cn("inline-grid h-7 w-7 place-items-center rounded-full border font-bold", RANK_STYLES[i])}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </span>
                ) : (
                  <span className="font-semibold text-muted-foreground">{i + 1}</span>
                )}
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarFallback className="text-xs">{row.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium">
                    {row.username}
                    {currentUserId && row.user_id === currentUserId && (
                      <Badge className="ml-2" variant="outline">toi</Badge>
                    )}
                  </span>
                </div>
              </td>
              {showPreds && (
                <td className="hidden px-2 py-3 text-right font-mono tabular-nums text-muted-foreground sm:table-cell">
                  {row.preds || "—"}
                </td>
              )}
              <td className="px-4 py-3 text-right">
                <span className="font-black font-mono tabular-nums text-primary">{row.points}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeaderboardEmpty() {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <Medal className="mx-auto h-8 w-8 text-muted-foreground/40" />
      <p className="mt-3 text-sm text-muted-foreground">Aucun point distribué pour l'instant.</p>
    </div>
  );
}
