import type { Metadata } from "next";
import { getSessionUser } from "@/lib/supabase/server";
import { listShops, getMyShop, shopItemCounts } from "@/lib/services/pronoshops.service";
import { ShopsClient } from "@/components/pronoshops/ShopsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutiques de la communauté | Crée ta boutique gratuite sur PRONO",
  description:
    "Chaque membre de la diaspora peut ouvrir sa boutique : ton thème, tes couleurs, ta photo, tes articles et services. Coiffure, déménagement, DJ, mode, envoi Afrique. Gratuit, sans commission.",
  keywords: [
    "boutique diaspora", "créer boutique gratuite", "vendre en ligne diaspora",
    "online shop afrikanische community", "boutique africaine Berlin",
  ],
  alternates: { canonical: "/boutiques" },
  openGraph: {
    title: "Les boutiques de la communauté PRONO",
    description: "Ta page, ton thème, tes articles : gratuit, sans commission.",
    url: "/boutiques",
    siteName: "PRONO",
    images: [{ url: "/og-annonces.png", width: 1200, height: 630, alt: "Boutiques PRONO" }],
    locale: "fr_FR",
    type: "website",
  },
};

/**
 * Page /boutiques : annuaire des boutiques des membres + création.
 * PUBLIQUE : tout le monde peut visiter les boutiques ; créer exige d'être connecté.
 */
export default async function BoutiquesPage() {
  const user = await getSessionUser();
  const [shops, counts, myShop, prefill] = await Promise.all([
    listShops(),
    shopItemCounts(),
    user ? getMyShop(user.id) : Promise.resolve(null),
    (async () => {
      if (!user) return undefined;
      try {
        const { createSupabaseServerClient } = await import("@/lib/supabase/server");
        const supabase = createSupabaseServerClient();
        const { data } = await supabase
          .from("prono_profiles")
          .select("housing_city")
          .eq("id", user.id)
          .maybeSingle();
        return { city: ((data?.housing_city as string) || undefined) };
      } catch {
        return undefined;
      }
    })(),
  ]);

  return (
    <div className="container space-y-8 py-8">
      {/* ===== En-tête premium ===== */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card/80 via-background to-background p-6 sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-2xl shadow-lg shadow-primary/20">
              🛍️
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Boutiques <span className="text-gradient">de la communauté</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Ta page, ton thème, tes articles : <strong>gratuit, sans commission</strong>
              </p>
            </div>
          </div>

          {/* Comment ça marche */}
          <ol className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-3">
            {[
              { n: "1", t: "Crée ta boutique", d: "Nom, thème, photo : 2 minutes, aucun frais." },
              { n: "2", t: "Publie tes articles", d: "Depuis PRONO Annonces, catégorie Marché, prix, photos, envoi Afrique." },
              { n: "3", t: "Vends", d: "Les clients te contactent par WhatsApp ou le chat PRONO. Tu gardes 100 % du prix." },
            ].map((e) => (
              <li key={e.n} className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/30">
                  {e.n}
                </span>
                <div>
                  <p className="text-sm font-bold">{e.t}</p>
                  <p className="text-xs text-muted-foreground">{e.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </header>

      {/* ===== Annuaires + création ===== */}
      <ShopsClient
        initialShops={shops}
        counts={counts}
        myShop={myShop}
        loggedIn={Boolean(user)}
        prefill={prefill}
      />
    </div>
  );
}
