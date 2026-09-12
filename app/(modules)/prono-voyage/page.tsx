import type { Metadata } from "next";
import { getSessionUser } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listTrips } from "@/lib/services/pronovoyage.service";
import { VoyageClient } from "@/components/pronovoyage/VoyageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PRONO Voyage, Billets bus, train, avion et covoiturage de la diaspora",
  description:
    "Ton lanceur de recherche voyage 100% légal : vols ici ↔ là-bas (Kayak, Google Flights), train et bus en Europe (Trainline, FlixBus), covoiturage de la communauté et guides formalités (passeport, douane, santé). Gratuit, par PRONO.",
};

/**
 * Page /prono-voyage — MODULE 6 « PRONO Voyage ».
 * Page PUBLIQUE : liens de recherche officiels uniquement (zéro scraping,
 * zéro copie) + covoiturage communautaire modéré + guides formalités.
 */
export default async function PronoVoyagePage({
  searchParams,
}: {
  searchParams?: { trajet?: string; publier?: string; discuter?: string };
}) {
  const user = await getSessionUser();

  // Liste publique initiale + préremplissage de la ville de départ depuis le profil
  const [trips, prefillCity] = await Promise.all([
    listTrips({}),
    (async () => {
      if (!user) return undefined;
      try {
        const supabase = createSupabaseServerClient();
        const { data } = await supabase
          .from("prono_profiles")
          .select("housing_city")
          .eq("id", user.id)
          .maybeSingle();
        return (data?.housing_city as string) || undefined;
      } catch {
        return undefined;
      }
    })(),
  ]);

  return (
    <div className="theme-voyage container space-y-8 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">🌍 PRONO Voyage</h1>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Ici ↔ Là-bas
          </span>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Ton <strong>lanceur de recherche voyage 100% légal</strong> : ✈️ vols vers le pays,
          🚆 train et 🚌 bus en Europe avec tes filtres, 🚗 covoiturage de la communauté et
          📋 guides formalités (passeport, douane, santé). Gratuit, sans commission.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">⚖️ Zéro scraping, liens officiels</span>
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">🚗 Covoiturage modéré</span>
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">📋 Guides formalités</span>
        </div>
      </header>

      {/* ===== Onglets Billets / Covoiturage / Formalités ===== */}
      <VoyageClient
        loggedIn={Boolean(user)}
        userId={user?.id}
        initialTrips={trips}
        prefillCity={prefillCity}
        deeplinkTrip={searchParams?.trajet}
        deeplinkChat={searchParams?.discuter === "1"}
        autoPublish={searchParams?.publier === "1"}
      />
    </div>
  );
}
