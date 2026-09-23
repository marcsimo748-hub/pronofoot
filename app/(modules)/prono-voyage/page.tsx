import type { Metadata } from "next";
import { getSessionUser } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listTrips } from "@/lib/services/pronovoyage.service";
import { VoyageClient } from "@/components/pronovoyage/VoyageClient";
import { useServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PRONO Voyage · Billets bus, train, avion et covoiturage de la diaspora (FR/EN/DE)",
  description:
    "Ton lanceur de recherche voyage 100% légal : vols ici ↔ là-bas (Kayak, Google Flights), train et bus en Europe (Trainline, FlixBus), covoiturage de la communauté et guides formalités (passeport, douane, santé). Gratuit, par PRONO.",
};

/**
 * Page /prono-voyage — MODULE 6 « PRONO Voyage » — trilingue (FR/EN/DE).
 */
export default async function PronoVoyagePage({
  searchParams,
}: {
  searchParams?: { trajet?: string; publier?: string; discuter?: string };
}) {
  const user = await getSessionUser();
  const t = await useServerT();

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
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">🌍 {t("voy.h1")}</h1>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {t("voy.badge")}
          </span>
        </div>
        <p className="max-w-2xl text-muted-foreground">{t("voy.intro")}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">{t("voy.legal")}</span>
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">{t("voy.carpool")}</span>
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">{t("voy.guides")}</span>
        </div>
      </header>

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
