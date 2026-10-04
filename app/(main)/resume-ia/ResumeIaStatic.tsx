// app/(main)/resume-ia/ResumeIaStatic.tsx
// =====================================================================
// Composant serveur qui charge les 5 prochains matchs et génère un
// résumé éditorial. Pas de fetch côté client (plus sûr pour le build).
// =====================================================================

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, CalendarDays } from "lucide-react";
import { LEAGUES } from "@/lib/constants";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getUpcomingMatches } from "@/lib/services/football.service";
import { AFRICA_LEAGUE_CODES } from "@/lib/constants";
import { formatMatchDate, safeQuery } from "@/lib/utils";

function pickTopMatches(matches: ReturnType<typeof getUpcomingMatches>) {
  // Priorité : matchs africains, CAN, gros chocs européens visibles
  const africa = matches.filter((m) =>
    AFRICA_LEAGUE_CODES.includes(m.league as (typeof AFRICA_LEAGUE_CODES)[number])
  );
  const autres = matches.filter(
    (m) =>
      !AFRICA_LEAGUE_CODES.includes(m.league as (typeof AFRICA_LEAGUE_CODES)[number])
  );
  // 3 africains prioritaires + 2 autres si pas assez
  const top = [...africa.slice(0, 5), ...autres.slice(0, 5 - africa.slice(0, 5).length)];
  return top.slice(0, 5);
}

function generateIntro(count: number, hasAfrica: boolean): string {
  if (count === 0)
    return "Aucun match au programme dans les 36 prochaines heures. Reviens bientôt !";
  if (hasAfrica)
    return `Voici les ${count} matchs à surveiller aujourd'hui · la scène africaine est au rendez-vous.`;
  return `Voici les ${count} matchs à suivre aujourd'hui. Fonce pronostiquer avant le coup d'envoi !`;
}

function generateBlurb(match: { home_team: string; away_team: string; league: string }): string {
  const league = LEAGUES[match.league as keyof typeof LEAGUES];
  if (AFRICA_LEAGUE_CODES.includes(match.league as (typeof AFRICA_LEAGUE_CODES)[number])) {
    return `Match de ${league?.name ?? match.league} : la diaspora suit de près, fais ton prono !`;
  }
  return `Gros choc à l'horizon · tous les pronostics se dévoilent sur /pronos.`;
}

export async function ResumeIaStatic() {
  const matches = await safeQuery(async () => getUpcomingMatches(40), []);
  const top = pickTopMatches(matches);
  const hasAfrica = top.some((m) =>
    AFRICA_LEAGUE_CODES.includes(m.league as (typeof AFRICA_LEAGUE_CODES)[number])
  );

  const intro = generateIntro(top.length, hasAfrica);

  return (
    <div className="space-y-6">
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-500/20 p-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <p className="flex-1 text-base font-medium leading-relaxed text-foreground">
              {intro}
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Édition du{" "}
            {new Date().toLocaleString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardContent>
      </Card>

      {top.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          🏟️ Aucun match au programme dans les 36 prochaines heures.
        </div>
      ) : (
        <div className="space-y-3">
          {top.map((m, i) => {
            const league = LEAGUES[m.league as keyof typeof LEAGUES];
            const isAfrica = AFRICA_LEAGUE_CODES.includes(
              m.league as (typeof AFRICA_LEAGUE_CODES)[number]
            );
            return (
              <Card
                key={`${m.id}-${i}`}
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
                      {isAfrica && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                          🌍 Afrique
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatMatchDate(m.match_date)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-amber-300">
                      Match #{i + 1} du jour
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="flex items-center justify-end gap-2 text-right">
                      <span className="font-bold">{m.home_team}</span>
                      <TeamLogo name={m.home_team} size={28} />
                    </div>
                    <div className="font-mono text-2xl font-black text-muted-foreground">
                      VS
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamLogo name={m.away_team} size={28} />
                      <span className="font-bold">{m.away_team}</span>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    💡 {generateBlurb(m)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}