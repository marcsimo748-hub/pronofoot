import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, Users, Trophy, CalendarDays } from "lucide-react";
import { StartedMatchCard } from "@/components/pronos/StartedMatchCard";
import { getAllCommunityPredictions, getSitePredictionStats } from "@/lib/services/predictions.service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Coupons & pronos de la communauté",
  description: "Tous les pronostics faits sur PRONO, match par match, joueur par joueur. Public et transparent.",
};

/**
 * Page publique /coupons — l'archive de TOUS les pronostics du site.
 * Anti-triche garanti côté serveur : seuls les matchs déjà commencés
 * voient leurs pronos dévoilés (aucun score avant le coup d'envoi).
 */
export default async function CouponsPage() {
  const [stats, archive] = await Promise.all([
    getSitePredictionStats(),
    getAllCommunityPredictions(30),
  ]);

  const cards = [
    { icon: Ticket, label: "Pronostics enregistrés", value: stats.totalPredictions },
    { icon: Users, label: "Joueurs actifs", value: stats.activePlayers },
    { icon: CalendarDays, label: "Matchs couverts", value: stats.matchesCovered },
    { icon: Trophy, label: "Points distribués", value: stats.totalPoints },
  ];

  return (
    <div className="theme-foot container space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-black">🎟️ Coupons de la communauté</h1>
        <p className="max-w-2xl text-muted-foreground">
          L&apos;archive publique de tous les pronostics faits sur PRONO. Chaque coupon se dévoile
          au coup d&apos;envoi · clique sur un pseudo pour voir le parcours complet d&apos;un joueur.
        </p>
      </header>

      {/* Compteurs du site */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-card/60 p-4">
            <c.icon className="mb-2 h-5 w-5 text-primary" />
            <p className="font-mono text-2xl font-black tabular-nums">{c.value.toLocaleString("fr-FR")}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Archive par match */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <CalendarDays className="h-5 w-5 text-primary" /> Les 30 derniers matchs disputés
        </h2>
        {archive.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <span className="text-4xl">🏟️</span>
            <p className="mt-4 font-semibold">Aucun match encore disputé</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les pronos dévoilés apparaîtront ici dès la première rencontre.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {archive.map((d) => (
              <StartedMatchCard key={d.match.id} data={d} />
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Envie de défier la communauté ?{" "}
        <Link href="/pronos" className="font-semibold text-primary hover:underline">
          Fais ton pronostic →
        </Link>
      </p>
    </div>
  );
}
