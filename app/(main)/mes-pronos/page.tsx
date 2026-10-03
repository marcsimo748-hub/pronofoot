import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { MesPronosClient } from "./MesPronosClient";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({
  title: "Mes pronostics · Partage en carte PNG — PRONO",
  description:
    "Télécharge mes derniers pronos en carte PNG 1200x630, partage-les sur Instagram / WhatsApp / Stories pour défier tes potes.",
  path: "/mes-pronos",
  keywords: ["mes pronos", "PNG", "carte pronostic", "partage"],
});

/**
 * Page /mes-pronos — l'utilisateur voit ses derniers pronos et peut
 * télécharger une carte PNG 1200x630 partageable sur les réseaux.
 *
 * NOTE: Données chargées côté client (useEffect dans MesPronosClient)
 * pour contourner un build error TypeScript Vercel sur le select
 * avec jointure match:matches côté serveur.
 */
export default async function MesPronosPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/mes-pronos");

  return (
    <MesPronosClient
      userId={user.id}
      username={user.username ?? "Joueur"}
      totalPoints={user.total_points ?? 0}
    />
  );
}