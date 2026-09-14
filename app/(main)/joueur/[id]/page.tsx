import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { LEAGUES } from "@/lib/constants";
import { formatMatchDate } from "@/lib/utils";
import { getPlayerCoupon } from "@/lib/services/predictions.service";
import { ShareButton } from "@/components/shared/ShareButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const coupon = await getPlayerCoupon(params.id);
  return {
    title: coupon?.profile.username ? `Coupon de ${coupon.profile.username}` : "Joueur",
    description: `Les pronostics et statistiques de ${coupon?.profile.username ?? "ce joueur"} sur PRONO.`,
  };
}

/**
 * Page publique /joueur/[id] — le COUPON d'un joueur :
 * ses pronos dévoilés (matchs commencés uniquement), ses stats et ses points.
 * Les pronos sur matchs à venir restent secrets (anti-triche) : seul le
 * nombre est affiché.
 */
export default async function PlayerPage({ params }: PageProps) {
  const coupon = await getPlayerCoupon(params.id);
  if (!coupon) notFound();

  const { profile, stats, predictions } = coupon;
  const name = profile.username ?? "Joueur";
  const accuracy = stats.calculated > 0 ? Math.round(((stats.exacts + stats.outcomes) / stats.calculated) * 100) : 0;

  const statCards = [
    { label: "Points", value: profile.total_points },
    { label: "Pronos", value: stats.total },
    { label: "Scores exacts", value: stats.exacts },
    { label: "Bonnes issues", value: stats.outcomes },
    { label: "Réussite", value: `${accuracy} %` },
    { label: "En cours 🔒", value: stats.pending },
  ];

  return (
    <div className="theme-foot container space-y-8 py-8">
      {/* En-tête joueur */}
      <header className="flex flex-wrap items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/40">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={name} />
          <AvatarFallback className="text-2xl font-black">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-black">{name}</h1>
          <p className="text-sm text-muted-foreground">
            Coupon public — {stats.total} prono{stats.total > 1 ? "s" : ""} depuis l&apos;inscription
          </p>
        </div>
        <ShareButton
          title={`Le coupon de ${name} sur PRONO`}
          text={`${name} : ${profile.total_points} points sur PRONO`}
          size="default"
          variant="outline"
        />
      </header>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-card/60 p-3 text-center">
            <p className="font-mono text-xl font-black tabular-nums text-primary">{c.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Pronos dévoilés */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Pronostics dévoilés</h2>
        {predictions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Aucun prono dévoilé pour l&apos;instant — reviens après le prochain coup d&apos;envoi.
          </div>
        ) : (
          <div className="space-y-1.5">
            {predictions.map((p) => {
              const league = LEAGUES[p.match?.league as keyof typeof LEAGUES];
              const exact = p.calculated && p.points_earned >= 5;
              const good = p.calculated && p.points_earned > 0 && p.points_earned < 5;
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-white/5 bg-card/50 px-3 py-2 text-sm"
                >
                  <span className="w-14 shrink-0 text-[10px] font-bold uppercase" style={{ color: league?.color }}>
                    {league?.short ?? "?"}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <TeamLogo name={p.match.home_team} size={14} />
                    <span className="truncate">{p.match.home_team}</span>
                    <span className="mx-1 text-muted-foreground">-</span>
                    <TeamLogo name={p.match.away_team} size={14} />
                    <span className="truncate">{p.match.away_team}</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums">{p.home_score} - {p.away_score}</span>
                  {p.calculated ? (
                    <Badge variant={exact ? "default" : good ? "secondary" : "outline"} className="font-mono">
                      +{p.points_earned} pts
                    </Badge>
                  ) : (
                    <Badge variant="outline">en cours</Badge>
                  )}
                  <span className="hidden w-28 shrink-0 text-right text-[10px] text-muted-foreground sm:block">
                    {formatMatchDate(p.match.match_date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {stats.pending > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            🔒 {stats.pending} prono{stats.pending > 1 ? "s" : ""} sur des matchs à venir — dévoilé{stats.pending > 1 ? "s" : ""} au coup d&apos;envoi
          </p>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/coupons" className="font-semibold text-primary hover:underline">
          ← Tous les coupons de la communauté
        </Link>
      </p>
    </div>
  );
}
