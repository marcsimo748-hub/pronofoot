import type { Metadata } from "next";
import { ClassementClient } from "@/components/classement/ClassementClient";
import { getGeneralStandings, getMonthlyStandings } from "@/lib/services/predictions.service";
import { getSessionUser } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";
import type { StandingRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({
  title: "Classement des pronostiqueurs PRONO · Général, championnat, mensuel",
  description:
    "Classement des meilleurs pronostiqueurs de la communauté PRONO : général, par championnat (Bundesliga, Premier League, Liga, Serie A, Ligue 1), mensuel et entre amis. Gagne des boosts en grimpant !",
  path: "/classement",
  ogImage: "/og-classement.png",
  keywords: [
    "classement pronostiqueurs",
    "classement foot",
    "Bundesliga",
    "Premier League",
    "Ligue 1",
    "Serie A",
    "Liga",
  ],
});

/**
 * Page /classement — général, par championnat, mensuel, groupes d'amis.
 */
export default async function ClassementPage() {
  const user = await getSessionUser();

  const [general, monthly] = await Promise.all([
    getGeneralStandings(50),
    getMonthlyStandings(),
  ]);

  // Classements par championnat chargés à la demande (onglets) pour rester rapide
  const initial: Record<string, StandingRow[]> = {
    general: general,
    monthly: monthly,
  };

  return (
    <div className="theme-foot container space-y-6 py-8">
      <header className="space-y-1">
        <h1 className="font-display text-4xl font-black">🏆 Classements</h1>
        <p className="text-muted-foreground">
          Général, par championnat, mensuel et entre amis.
        </p>
      </header>
      <ClassementClient initial={initial} currentUserId={user?.id} loggedIn={Boolean(user)} />
    </div>
  );
}
