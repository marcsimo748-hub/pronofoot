"use client";

/**
 * 📈 Statistiques du joueur (Recharts) — dashboard.
 * Deux graphiques nourris par l'historique des pronostics calculés :
 *   1. Points cumulés dans le temps (progression de la saison)
 *   2. Réussite par championnat (scores exacts / issues / ratés)
 * Barème : score exact = 5 pts · issue correcte = 3 pts · raté = 0.
 */

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ChartLine, BarChart3 } from "lucide-react";
import { LEAGUES } from "@/lib/constants";
import type { Prediction, Match } from "@/lib/types";

const LEAGUE_CODES = Object.keys(LEAGUES) as (keyof typeof LEAGUES)[];

/** Tooltip commun sombre et lisible */
function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number | string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-bold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name} : <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export function StatsCharts({ predictions }: { predictions: (Prediction & { matches: Match })[] }) {
  const calculated = useMemo(
    () => predictions.filter((p) => p.calculated && p.matches?.match_date).sort((a, b) => a.matches.match_date.localeCompare(b.matches.match_date)),
    [predictions]
  );

  // 1) Points cumulés dans le temps
  const cumulative = useMemo(() => {
    let sum = 0;
    return calculated.map((p) => {
      sum += p.points_earned;
      const d = new Date(p.matches.match_date);
      return {
        date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        points: sum,
      };
    });
  }, [calculated]);

  // 2) Réussite par championnat
  const byLeague = useMemo(
    () =>
      LEAGUE_CODES.map((code) => {
        const preds = calculated.filter((p) => p.matches?.league === code);
        if (!preds.length) return null;
        return {
          league: LEAGUES[code].short,
          "Score exact": preds.filter((p) => p.points_earned === 5).length,
          "Issue correcte": preds.filter((p) => p.points_earned === 3).length,
          Ratés: preds.filter((p) => p.points_earned === 0).length,
        };
      }).filter(Boolean) as { league: string; "Score exact": number; "Issue correcte": number; Ratés: number }[],
    [calculated]
  );

  if (calculated.length < 2) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        <ChartLine className="mx-auto h-8 w-8 opacity-40" />
        <p className="mt-2 font-semibold">Tes graphiques arrivent vite 📈</p>
        <p className="mt-1">Pronostique au moins 2 matchs — dès qu&apos;ils sont calculés, ta progression s&apos;affiche ici.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-white/10 bg-card/60 p-4" aria-label="Progression des points">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <ChartLine className="h-4 w-4 text-primary" /> Progression des points
        </h3>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulative} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area
                type="monotone"
                dataKey="points"
                name="Points cumulés"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#pointsGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-card/60 p-4" aria-label="Réussite par championnat">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <BarChart3 className="h-4 w-4 text-primary" /> Réussite par championnat
        </h3>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byLeague} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="league" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar dataKey="Score exact" stackId="r" fill="#10b981" radius={[0, 0, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Issue correcte" stackId="r" fill="#38bdf8" isAnimationActive={false} />
              <Bar dataKey="Ratés" stackId="r" fill="#475569" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
