import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PronosClient } from "@/components/pronos/PronosClient";
import { BannerRotator } from "@/components/shared/BannerRotator";
import { getMatchesForPrediction, getStartedMatches, getAdminPredictionPeek, getUpcomingParticipants } from "@/lib/services/predictions.service";
import { getSettings } from "@/lib/services/settings.service";
import { getSessionUser } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({
  title: "Pronostics foot : 6 championnats, scores live · PRONO",
  description:
    "Fais tes pronostics sur Bundesliga, Premier League, Liga, Serie A, Ligue 1 et plus. Scores en direct, classement entre amis, boosts à gagner. Gratuit.",
  path: "/pronos",
  ogImage: "/og-pronos.png",
  keywords: [
    "pronostics foot",
    "pronostics Bundesliga",
    "pronostics Premier League",
    "pronostics Ligue 1",
    "scores live",
  ],
});

/**
 * Page /pronos — le cœur du jeu.
 * Protégée par le middleware (connexion requise), données via le service.
 */
export default async function PronosPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/pronos");

  const [{ matches, predictions }, settings, startedMatches] = await Promise.all([
    getMatchesForPrediction(user.id),
    getSettings(),
    getStartedMatches(),
  ]);

  // Admin : aperçu des pronos des joueurs avant le coup d'envoi
  const adminPeek = user.is_admin ? await getAdminPredictionPeek(matches.map((m) => m.id)) : undefined;

  // 👥 Qui a déjà pronostiqué chaque match à venir (pseudos, jamais les scores)
  const participants = await getUpcomingParticipants(matches.map((m) => m.id));

  return (
    <div className="theme-foot container space-y-6 py-8">
      <BannerRotator
        images={["/banners/foot/01.jpg", "/banners/foot/02.jpg", "/banners/foot/03.jpg", "/banners/foot/04.jpg", "/banners/foot/05.jpg"]}
        title="Le journal des pronos"
        subtitle="6 championnats, 19 équipes vedettes · les pronos se verrouillent au coup d'envoi, les scores tombent en direct."
      />
      <header className="space-y-1">
        <h1 className="font-display text-4xl font-black">⚽ <span className="text-gradient">PRONO</span> - Pronostics</h1>
        <p className="text-muted-foreground">
          <a href="/coupons" className="font-semibold text-primary hover:underline">🎟️ Tous les pronos de la communauté →</a>
          <span className="mx-2">·</span>
          {matches.length} match{matches.length > 1 ? "s" : ""} ouvert
          {matches.length > 1 ? "s" : ""} · les pronostics se verrouillent automatiquement au coup d'envoi.
        </p>
      </header>
      <PronosClient
        matches={matches}
        predictions={predictions}
        settings={settings}
        startedMatches={startedMatches}
        adminPeek={adminPeek}
        participants={participants}
      />
    </div>
  );
}
