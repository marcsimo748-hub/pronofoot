import type { Metadata } from "next";
import { getSessionUser } from "@/lib/supabase/server";
import { PronoJobClient } from "@/components/pronojob/PronoJobClient";
import {
  ensureJobsSynced,
  getJobs,
  getJobPrefs,
  getUserApplications,
  isDbReady,
  scoreForJob,
} from "@/lib/services/pronojob.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PRONO Emploi, Jobs en Allemagne, Europe et télétravail",
  description:
    "Agrégateur d'offres d'emploi 100% légal : jobs en Allemagne, Europe et télétravail, avec PronoScore de compatibilité et suivi des candidatures. Gratuit, par PRONO.",
};

/**
 * Page /prono-job — MODULE 1 « PronoJob ».
 * Serveur : premier remplissage auto du cache si vide, préférences + candidatures
 * de l'utilisateur, puis rendu du client de recherche.
 */
export default async function PronoJobPage({
  searchParams,
}: {
  searchParams?: { postuler?: string };
}) {
  const user = await getSessionUser();

  // 1) Best effort : si la table est vide (1ʳᵉ visite), on remplit le cache tout de suite.
  await ensureJobsSynced();

  // 2) Données initiales + profil + candidatures déjà envoyées
  const [initial, prefs, applications] = await Promise.all([
    getJobs({ page: 0 }),
    user ? getJobPrefs(user.id) : Promise.resolve(null),
    user ? getUserApplications(user.id, false) : Promise.resolve([] as { job_id: string }[]),
  ]);

  // 3) PronoScore initial (recalculé côté API à chaque recherche)
  const scored = initial.jobs.map((j) => {
    const s = scoreForJob(j, prefs);
    return { ...j, score: s?.score ?? null, reasons: s?.reasons ?? [] };
  });

  return (
    <PronoJobClient
      initial={{ jobs: scored, total: initial.total, mode: initial.mode }}
      initialPrefs={prefs}
      appliedJobIds={applications.map((a) => a.job_id)}
      loggedIn={Boolean(user)}
      dbReady={isDbReady()}
      autoApply={searchParams?.postuler === "1"}
    />
  );
}
