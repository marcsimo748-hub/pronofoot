"use client";

/**
 * Carte de pronostic d'un match :
 * saisie du score, verrouillage automatique au coup d'envoi,
 * affichage du résultat et des points gagnés.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Lock, TimerReset, Save, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatMatchDate, computePoints } from "@/lib/utils";
import { LEAGUES, FEATURED_TEAMS } from "@/lib/constants";
import type { Match, Prediction } from "@/lib/types";
import type { PublicPrediction } from "@/lib/services/predictions.service";
import { TeamLogo } from "@/components/ui/TeamLogo";


function TeamName({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-1.5 font-semibold">
      <TeamLogo name={name} size={20} />
      <span className="truncate">{name}</span>
    </span>
  );
}

interface Props {
  match: Match;
  prediction?: Prediction;
  /** Admin : pronos des autres joueurs avant le coup d'envoi */
  adminPeek?: PublicPrediction[];
}

export function MatchPredictionCard({ match, prediction, adminPeek }: Props) {
  const [home, setHome] = useState<number | null>(prediction?.home_score ?? null);
  const [away, setAway] = useState<number | null>(prediction?.away_score ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(prediction));
  const [peekOpen, setPeekOpen] = useState(false);
  const [, forceTick] = useState(0);

  const league = LEAGUES[match.league];
  const kickoff = new Date(match.match_date).getTime();
  const locked = kickoff <= Date.now() || match.home_score !== null;
  const finished = match.status === "finished" && match.home_score !== null;

  // Rafraîchit le compte à rebours toutes les minutes
  useEffect(() => {
    if (locked) return;
    const t = setInterval(() => forceTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, [locked]);

  const countdown = (() => {
    const diff = kickoff - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (d > 0) return `dans ${d} j ${h} h`;
    if (h > 0) return `dans ${h} h ${m} min`;
    return `dans ${m} min`;
  })();

  async function save() {
    if (home === null || away === null) {
      toast.error("Saisis les deux scores 😉");
      return;
    }
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Connecte-toi pour pronostiquer.");
        return;
      }
      const { error } = await supabase.from("predictions").upsert(
        { user_id: user.id, match_id: match.id, home_score: home, away_score: away },
        { onConflict: "user_id,match_id" }
      );
      if (error) {
        toast.error(error.message.includes("verrouillé") ? "🔒 Le match a déjà commencé !" : error.message);
        return;
      }
      setSaved(true);
      toast.success("Pronostic enregistré ! 🎯", { description: `${match.home_team} ${home} - ${away} ${match.away_team}` });
    } catch {
      toast.error("Erreur réseau, réessaie.");
    } finally {
      setSaving(false);
    }
  }

  const points = prediction?.calculated
    ? computePoints(prediction, { home_score: match.home_score ?? 0, away_score: match.away_score ?? 0 })
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card/70 p-4"
      style={{ borderColor: `${league?.color ?? "#10b981"}33` }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
          style={{ backgroundColor: `${league?.color}22`, color: league?.color }}
        >
          {league?.name}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {locked ? <Lock className="h-3 w-3" /> : <TimerReset className="h-3 w-3" />}
          {formatMatchDate(match.match_date)}
          {countdown && <span className="font-semibold text-primary">· {countdown}</span>}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {/* Domicile */}
        <div className="flex min-w-0 flex-col items-end gap-2 text-right sm:flex-row sm:items-center sm:justify-end">
          <TeamName name={match.home_team} />
          {finished ? (
            <span className="order-first grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-2xl font-black tabular-nums">
              {match.home_score}
            </span>
          ) : (
            <input
              type="number"
              min={0}
              max={20}
              value={home ?? ""}
              onChange={(e) => {
                setHome(e.target.value === "" ? null : Math.max(0, Math.min(20, Number(e.target.value))));
                setSaved(false);
              }}
              disabled={locked}
              placeholder="–"
              aria-label={`Score ${match.home_team}`}
              className="no-spinner order-first h-11 w-14 rounded-lg border border-input bg-background text-center text-xl font-bold tabular-nums focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
          )}
        </div>

        <span className="text-xs font-bold text-muted-foreground">VS</span>

        {/* Extérieur */}
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          {finished ? (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-2xl font-black tabular-nums">
              {match.away_score}
            </span>
          ) : (
            <input
              type="number"
              min={0}
              max={20}
              value={away ?? ""}
              onChange={(e) => {
                setAway(e.target.value === "" ? null : Math.max(0, Math.min(20, Number(e.target.value))));
                setSaved(false);
              }}
              disabled={locked}
              placeholder="–"
              aria-label={`Score ${match.away_team}`}
              className="no-spinner h-11 w-14 rounded-lg border border-input bg-background text-center text-xl font-bold tabular-nums focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
          )}
          <TeamName name={match.away_team} />
        </div>
      </div>

      {/* Pied : bouton enregistrer / résultat / points */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
        {finished && prediction ? (
          <>
            <span className="text-xs text-muted-foreground">
              Ton pronostic : <span className="font-bold text-foreground">{prediction.home_score} - {prediction.away_score}</span>
            </span>
            <Badge variant={points === 5 ? "success" : points === 3 ? "warning" : "secondary"}>
              {points === 5 ? "🎯 +5 pts" : points === 3 ? "✅ +3 pts" : "❌ 0 pt"}
            </Badge>
          </>
        ) : finished && !prediction ? (
          <span className="text-xs italic text-muted-foreground">Match terminé — aucun pronostic</span>
        ) : locked ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Pronostics verrouillés
          </span>
        ) : (
          <>
            {prediction && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Pencil className="h-3 w-3" /> Modifie ton pronostic
              </span>
            )}
            <Button size="sm" onClick={save} disabled={saving || locked} variant={saved ? "secondary" : "glow"} className="ml-auto gap-1.5">
              {saving ? "…" : saved ? <><Check className="h-3.5 w-3.5" /> Enregistré</> : <><Save className="h-3.5 w-3.5" /> Pronostiquer</>}
            </Button>
          </>
        )}
      </div>

      {/* Aperçu admin : pronos de tous les joueurs (même avant le coup d'envoi) */}
      {adminPeek && adminPeek.length > 0 && (
        <div className="mt-2 border-t border-white/5 pt-2">
          <button
            type="button"
            onClick={() => setPeekOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 text-[11px] font-semibold text-amber-400/90 hover:text-amber-300"
          >
            <Eye className="h-3 w-3" /> Admin : {adminPeek.length} prono{adminPeek.length > 1 ? "s" : ""} enregistré{adminPeek.length > 1 ? "s" : ""}
            <span className="ml-auto">{peekOpen ? "▲" : "▼"}</span>
          </button>
          {peekOpen && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {adminPeek.map((p) => (
                <span
                  key={p.user_id}
                  className="rounded-full bg-secondary/60 px-2 py-0.5 text-[11px] tabular-nums"
                >
                  {p.username ?? "Joueur"} : {p.home_score}-{p.away_score}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
