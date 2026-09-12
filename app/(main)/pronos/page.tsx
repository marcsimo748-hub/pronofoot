import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PronosClient } from "@/components/pronos/PronosClient";
import { getMatchesForPrediction, getStartedMatches, getAdminPredictionPeek } from "@/lib/services/predictions.service";
import { getSettings } from "@/lib/services/settings.service";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pronostics" };

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

  return (
    <div className="container space-y-6 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-black">⚽ <span className="text-gradient">PRONO</span> - Pronostics</h1>
        <p className="text-muted-foreground">
          {matches.length} match{matches.length > 1 ? "s" : ""} ouvert
          {matches.length > 1 ? "s" : ""} — les pronostics se verrouillent automatiquement au coup d'envoi.
        </p>
      </header>
      <PronosClient
        matches={matches}
        predictions={predictions}
        settings={settings}
        startedMatches={startedMatches}
        adminPeek={adminPeek}
      />
    </div>
  );
}
