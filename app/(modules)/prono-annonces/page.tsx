import type { Metadata } from "next";
import { getSessionUser } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listAnnonces } from "@/lib/services/pronoannonces.service";
import { AnnoncesClient } from "@/components/pronoannonces/AnnoncesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PRONO Annonces, Petites annonces de la communauté (Rencontre, Logement, Services)",
  description:
    "Les petites annonces de la communauté PRONO : rencontre, recherche partenaire, ami, logement et services. Publie avec photos, filtre par ville, contacte par WhatsApp ou email. Modérée, 100% gratuite.",
};

/**
 * Page /prono-annonces — MODULE 5 « Prono-Annonces ».
 * Page PUBLIQUE : annonces actives visibles par tous (lecture anonyme côté service
 * via fetch interne ; la publication et le signalement exigent une connexion).
 */
export default async function PronoAnnoncesPage({
  searchParams,
}: {
  searchParams?: { annonce?: string };
}) {
  const user = await getSessionUser();

  // Liste publique initiale + préremplissage depuis prono_profiles si connecté
  const [annonces, prefill] = await Promise.all([
    listAnnonces({}),
    (async () => {
      if (!user) return undefined;
      try {
        const supabase = createSupabaseServerClient();
        const { data } = await supabase
          .from("prono_profiles")
          .select("housing_city, country")
          .eq("id", user.id)
          .maybeSingle();
        return {
          city: (data?.housing_city as string) || "",
          country: (data?.country as string) || "Allemagne",
          email: user.email || "",
        };
      } catch {
        return undefined;
      }
    })(),
  ]);

  return (
    <div className="theme-annonces container space-y-8 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">📢 PRONO Annonces</h1>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Communauté
          </span>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Les petites annonces <strong>100% gratuites</strong> de la communauté PRONO :
          ❤️ rencontre, 💞 recherche partenaire, 🤝 ami, 🏠 logement et 🛠️ services.
          Publie avec photos, filtre par ville et contacte directement par WhatsApp ou email.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">🆓 Gratuit — sans commission</span>
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">🛡️ Modérée — 3 signalements = masquée</span>
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">🇩🇪 Toute l'Allemagne</span>
        </div>
      </header>

      {/* ===== Annonces ===== */}
      <AnnoncesClient
        initialAnnonces={annonces}
        loggedIn={Boolean(user)}
        userId={user?.id}
        prefill={prefill}
        deeplinkAnnonce={searchParams?.annonce}
      />

      {/* ===== Sécurité ===== */}
      <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        <p className="mb-1 font-semibold text-amber-400">🛡️ Sécurité & respect</p>
        <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed">
          <li>Ne partage jamais de coordonnées bancaires ni de documents d'identité dans une annonce.</li>
          <li>Rencontre toujours tes interlocuteurs dans un lieu public et fais-toi confiance — en cas de doute, signale 🚩.</li>
          <li>Les annonces rapportées 3 fois sont masquées automatiquement et examinées par la modération.</li>
          <li>Contenu interdit : haine, discrimination, arnaques, produits illégaux, spam — suppression immédiate.</li>
        </ul>
      </section>
    </div>
  );
}
