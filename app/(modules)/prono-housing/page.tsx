import type { Metadata } from "next";
import { BannerRotator } from "@/components/shared/BannerRotator";
import { getSessionUser } from "@/lib/supabase/server";
import { getHousingLetter, getHousingPrefill } from "@/lib/services/pronohousing.service";
import { HousingClient } from "@/components/pronohousing/HousingClient";
import { HousingOffers } from "@/components/pronohousing/HousingOffers";
import { AnschreibenGenerator } from "@/components/pronohousing/AnschreibenGenerator";
import { HousingGuides } from "@/components/pronohousing/HousingGuides";
import { HOUSING_LEGAL_NOTE_BY_LANG } from "@/components/pronohousing/housing-data";
import { useServerT, readServerLang } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PRONO Logement · Logement en Allemagne (WG, appartements) FR/EN/DE",
  description:
    "Recherche de logement en Allemagne (FR/EN/DE) : WG-Gesucht, ImmoScout24, Immowelt avec tes filtres, loyers de référence par ville, lettre de motivation (Anschreiben) générée automatiquement et guides complets. 100% légal, par PRONO.",
};

/**
 * Page /prono-housing — MODULE 4 « Prono-Housing » — trilingue.
 * Page PUBLIQUE : recherche multi-plateformes légale + générateur d'Anschreiben.
 * ⚖️ Aucune annonce copiée ni scrapée : liens vers les sites originaux uniquement.
 */
export default async function PronoHousingPage() {
  const user = await getSessionUser();
  const t = await useServerT();

  const [saved, prefill] = user
    ? await Promise.all([
        getHousingLetter(user.id),
        getHousingPrefill(user.id, { email: user.email, username: user.username }),
      ])
    : [null, {} as Record<string, string>];

  return (
    <div className="theme-housing container space-y-10 py-8">
      <BannerRotator
        images={["/banners/housing/01.jpg", "/banners/housing/02.jpg", "/banners/housing/03.jpg", "/banners/housing/04.jpg", "/banners/housing/05.jpg"]}
        title={t("hou.bannerTitle")}
        subtitle={t("hou.bannerSub")}
      />

      {/* Offres de logement de la communauté */}
      <HousingOffers />
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">🏠 {t("hou.h1")}</h1>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {t("hou.badge")}
          </span>
        </div>
        <p className="max-w-2xl text-muted-foreground">{t("hou.intro")}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">{t("hou.legal")}</span>
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">{t("hou.realRents")}</span>
          <span className="rounded-full border border-white/10 bg-card/60 px-2.5 py-1">{t("hou.anschreiben")}</span>
        </div>
      </header>

      {/* ===== Recherche ===== */}
      <HousingClient prefillCity={prefill.city as string | undefined} />

      {/* ===== Générateur de lettre ===== */}
      <AnschreibenGenerator
        loggedIn={Boolean(user)}
        saved={saved ? { data: saved.data as never, letter_de: saved.letter_de, letter_fr: saved.letter_fr } : null}
        prefill={prefill as Record<string, string>}
      />

      {/* ===== Guides ===== */}
      <HousingGuides />

      {/* ===== Note légale ===== */}
      <footer className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        {HOUSING_LEGAL_NOTE_BY_LANG[readServerLang()] ?? HOUSING_LEGAL_NOTE_BY_LANG.fr}
      </footer>
    </div>
  );
}
