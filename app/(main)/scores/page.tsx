import type { Metadata } from "next";
import { LiveTicker } from "@/components/scores/LiveTicker";
import { ScoreCard } from "@/components/scores/ScoreCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, CalendarDays, History, Trophy, Info } from "lucide-react";
import { getLiveScores, getUpcomingMatches, getRecentResults, getLiveEvents } from "@/lib/services/football.service";
import { getSettings } from "@/lib/services/settings.service";
import { LEAGUES, LEAGUE_CODES } from "@/lib/constants";
import type { LeagueCode, StandingEntry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scores live" };

/**
 * Page /scores — live, résultats, classements.
 * ⭐ Le front lit UNIQUEMENT Supabase (cache + temps réel), jamais l'API externe.
 */
export default async function ScoresPage() {
  const [live, upcoming, results, settings, events] = await Promise.all([
    getLiveScores(),
    getUpcomingMatches(10),
    getRecentResults(12),
    getSettings(),
    getLiveEvents(),
  ]);

  const standings = settings.standings_cache;

  return (
    <div className="theme-foot container space-y-10 py-8">
      <header className="space-y-2">
        <h1 className="flex items-center gap-3 font-display text-4xl font-black">
          <Radio className="h-8 w-8 text-primary" /> Scores
          {live.length > 0 && <Badge variant="live" className="gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red-500" /> {live.length} en direct
          </Badge>}
        </h1>
        <p className="text-muted-foreground">
          Résultats mis à jour automatiquement toutes les 90 secondes (cache Supabase + temps réel).
        </p>
      </header>

      <LiveTicker initialLive={live} upcoming={upcoming} />

      {/* En direct */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-red-500" /> Matchs en direct
        </h2>
        {live.filter((m) => m.status !== "FT").length === 0 ? (
          <EmptyCard text="Aucun match en direct en ce moment. Les prochains matchs s'affichent plus bas ⚽" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {live.filter((m) => m.status !== "FT").map((m) => (
              <ScoreCard key={m.id} match={m} events={events.filter((e) => e.fixture_id === m.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Derniers résultats */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <History className="h-5 w-5 text-primary" /> Derniers résultats
        </h2>
        {results.length === 0 ? (
          <EmptyCard text="Les résultats apparaîtront ici dès qu'un match sera terminé (synchro automatique ou saisie admin)." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((m) => (
              <ScoreCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>

      {/* À venir */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <CalendarDays className="h-5 w-5 text-primary" /> Prochains matchs
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((m) => (
            <ScoreCard key={m.id} match={m} />
          ))}
        </div>
      </section>

      {/* Classements des championnats (cache 1h via API-Sports) */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Trophy className="h-5 w-5 text-primary" /> Classements des championnats
        </h2>
        {!standings.updated_at || Object.keys(standings.leagues).length === 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              Classements disponibles dès qu'une clé <b>API_SPORTS_KEY</b> est configurée et la première
              synchronisation effectuée (Admin → ⚡ Synchro API-Sports). En attendant, le classement des
              <b> joueurs </b> est toujours disponible sur la page <a href="/classement" className="text-primary hover:underline">Classement</a>.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {LEAGUE_CODES.filter((c) => standings.leagues[c]?.length).map((code) => (
              <LeagueStandings key={code} code={code} rows={standings.leagues[code]!} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LeagueStandings({ code, rows }: { code: LeagueCode; rows: StandingEntry[] }) {
  const league = LEAGUES[code];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: league.color }} />
          {league.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase text-muted-foreground">
              <th className="w-8 py-2">#</th>
              <th className="py-2">Équipe</th>
              <th className="py-2 text-center">J</th>
              <th className="py-2 text-center hidden sm:table-cell">+/-</th>
              <th className="py-2 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((r) => (
              <tr key={r.team} className="border-b border-white/5">
                <td className="py-2 font-bold text-muted-foreground">{r.rank}</td>
                <td className="py-2 font-medium">{r.team}</td>
                <td className="py-2 text-center tabular-nums text-muted-foreground">{r.played}</td>
                <td className="py-2 text-center tabular-nums text-muted-foreground hidden sm:table-cell">
                  {r.goals_for - r.goals_against > 0 ? "+" : ""}{r.goals_for - r.goals_against}
                </td>
                <td className="py-2 text-right font-black tabular-nums text-primary">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
