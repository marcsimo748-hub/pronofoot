import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardData } from "@/lib/services/predictions.service";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon espace" };

/**
 * Tableau de bord joueur : stats, pronostics, historique, groupes.
 * Tout est persisté dans Supabase (aucune perte à la déconnexion).
 */
export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");

  const data = await getDashboardData(user.id);

  return (
    <div className="container py-8">
      <DashboardClient username={user.username} data={data} userId={user.id} emailVerified={user.email_verified} email={user.email} />
    </div>
  );
}
