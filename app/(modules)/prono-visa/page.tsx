import type { Metadata } from "next";
import { getSessionUser } from "@/lib/supabase/server";
import { getVisaHistory, getVisaPrefill } from "@/lib/services/pronovisa.service";
import { VisaCalculator } from "@/components/pronovisa/VisaCalculator";
import { VisaArticles } from "@/components/pronovisa/VisaArticles";
import { VISA_DISCLAIMER } from "@/components/pronovisa/visa-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PronoVisa — Calcule tes chances de visa Allemagne",
  description:
    "Calculateur de chances de visa Allemagne (Ausbildung, Studium, Chancenkarte, travail, tourisme) : score d'estimation, checklist des documents et guides complets. Gratuit, par Pronofoot.",
};

/**
 * Page /prono-visa — MODULE 3 « PronoVisa ».
 * Page PUBLIQUE (le calcul est accessible sans compte) ;
 * la sauvegarde des simulations et le pré-remplissage nécessitent une connexion.
 * ⚖️ Aucune promesse de visa : disclaimer affiché en permanence.
 */
export default async function PronoVisaPage() {
  const user = await getSessionUser();

  const [history, prefill] = user
    ? await Promise.all([getVisaHistory(user.id), getVisaPrefill(user.id)])
    : [[], {}];

  return (
    <div className="container space-y-10 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">🛂 PronoVisa</h1>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Allemagne & Europe
          </span>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Calcule tes chances d&apos;obtenir un visa <strong>Allemagne</strong> (Ausbildung,
          Studium, Chancenkarte, travail, tourisme), récupère la checklist des documents et suis
          des conseils personnalisés — gratuitement, en 2 minutes.
        </p>
      </header>

      {/* ===== Calculateur ===== */}
      <VisaCalculator loggedIn={Boolean(user)} prefill={prefill} history={history} />

      {/* ===== Guides ===== */}
      <VisaArticles />

      {/* ===== Disclaimer permanent ===== */}
      <footer className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        {VISA_DISCLAIMER}
      </footer>
    </div>
  );
}
