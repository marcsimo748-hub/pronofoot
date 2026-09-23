import type { Metadata } from "next";
import { getSessionUser } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listAnnonces } from "@/lib/services/pronoannonces.service";
import { AnnoncesClient } from "@/components/pronoannonces/AnnoncesClient";
import { AnnoncesHero } from "@/components/pronoannonces/AnnoncesHero";
import { AnnoncesSecurity } from "@/components/pronoannonces/AnnoncesSecurity";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";

export const metadata: Metadata = {
  title: "PRONO Annonces | Coiffure, déménagement (Umzug), DJ, chauffeur, garde d'enfants",
  description:
    "La marketplace gratuite de la diaspora en Europe : coiffure, déménagement (Umzug), DJ, chauffeur, garde d'enfants, voitures, envoi Afrique, électronique. Ville, quartier et code postal pour trouver près de toi. Sans commission.",
  keywords: [
    "annonces diaspora", "coiffure africaine Berlin", "Umzug Umzugsfirma afrikanisch",
    "DJ mariage Berlin", "chauffeur diaspora", "garde d'enfants Berlin", "baby-sitting africain",
    "voiture à vendre Allemagne", "envoi Afrique", "communauté africaine Allemagne",
    "petites annonces diaspora", "Kleinanzeigen afrikanische Community",
  ],
  alternates: { canonical: "/prono-annonces" },
  openGraph: {
    title: "PRONO Annonces : la marketplace de la diaspora",
    description:
      "Coiffure, déménagement, DJ, chauffeur, garde d'enfants, voitures, envoi Afrique… Trouve un service près de chez toi, gratuitement.",
    url: "/prono-annonces",
    siteName: "PRONO",
    images: [{ url: "/og-annonces.png", width: 1200, height: 630, alt: "PRONO Annonces" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRONO Annonces : la marketplace de la diaspora",
    description: "Services de proximité, voitures, envoi Afrique. Gratuit, sans commission.",
    images: ["/og-annonces.png"],
  },
};

/**
 * Page /prono-annonces : MODULE 5 « Prono-Annonces ».
 * Page PUBLIQUE : annonces actives visibles par tous (lecture anonyme côté service
 * via fetch interne ; la publication et le signalement exigent une connexion).
 */
export default async function PronoAnnoncesPage({
  searchParams,
}: {
  searchParams?: { annonce?: string; discuter?: string; cat?: string; publier?: string };
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

  // Données structurées Google (rich results)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Annonces de la communauté PRONO",
    itemListElement: annonces.slice(0, 12).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: a.title,
      description: a.description?.slice(0, 150) ?? "",
    })),
  };

  return (
    <div className="theme-annonces container space-y-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnnoncesHero />

      {/* ===== Annonces ===== */}
      <AnnoncesClient
        initialAnnonces={annonces}
        loggedIn={Boolean(user)}
        userId={user?.id}
        prefill={prefill}
        deeplinkAnnonce={searchParams?.annonce}
        deeplinkChat={searchParams?.discuter === "1"}
        initialCategory={searchParams?.cat}
        openFormInitially={searchParams?.publier === "1"}
      />

      <AnnoncesSecurity />
    </div>
  );
}
