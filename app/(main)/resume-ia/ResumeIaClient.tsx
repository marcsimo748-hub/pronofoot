"use client";
// app/(main)/resume-ia/ResumeIaClient.tsx
// =====================================================================
// Charge /api/resume-ia, affiche intro + 5 cartes de matchs clés.
// =====================================================================

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, CalendarDays, Trophy } from "lucide-react";
import { LEAGUES } from "@/lib/constants";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { AdSlot } from "@/components/shared/AdSlot";
import { formatMatchDate } from "@/lib/utils";

interface ResumeIaMatch {
  home: string;
  away: string;
  league: string;
  date: string;
  blurb: string;
}

interface ResumeIaResponse {
  intro: string;
  matches: ResumeIaMatch[];
  callToAction: string;
  provider?: string;
  generatedAt?: string;
}

export function ResumeIaClient() {
  const [data, setData] = useState<ResumeIaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/resume-ia", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ResumeIaResponse;
        if (mounted) setData(json);
      } catch (e) {
        if (mounted)
          setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        L&apos;IA prépare ton résumé du jour…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400">
        {error ?? "Impossible de générer le résumé. Réessaie dans quelques minutes."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro IA */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-500/20 p-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <p className="flex-1 text-base font-medium leading-relaxed text-foreground">
              {data.intro}
            </p>
          </div>
          {data.generatedAt && (
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Édition du{" "}
              {new Date(data.generatedAt).toLocaleString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Matchs clés */}
      {data.matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          🏟️ Aucun match au programme dans les 36 prochaines heures.
        </div>
      ) : (
        <div className="space-y-3">
          {data.matches.map((m, i) => {
            const league = LEAGUES[m.league as keyof typeof LEAGUES];
            return (
              <Card
                key={`${m.home}-${m.away}-${i}`}
                className="overflow-hidden border-white/10 bg-card/60"
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase"
                        style={{
                          backgroundColor: league ? `${league.color}20` : undefined,
                          color: league?.color,
                        }}
                      >
                        {league?.short ?? m.league}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatMatchDate(m.date)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-amber-300">
                      Match #{i + 1} du jour
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="flex items-center justify-end gap-2 text-right">
                      <span className="font-bold">{m.home}</span>
                      <TeamLogo name={m.home} size={28} />
                    </div>
                    <div className="font-mono text-2xl font-black text-muted-foreground">
                      VS
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamLogo name={m.away} size={28} />
                      <span className="font-bold">{m.away}</span>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    💡 {m.blurb}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <AdSlot slot="resume-ia-bottom" format="horizontal" />

      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-emerald-400" />
            <span>{data.callToAction}</span>
          </div>
          <div className="flex gap-2">
            <a
              href="/pronos"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black uppercase text-black transition hover:bg-emerald-400"
            >
              Pronostiquer →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}