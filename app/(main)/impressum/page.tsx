import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Impressum · Mentions légales",
  description: "Mentions légales du site PRONO (Impressum, § 5 DDG / ex TMG).",
};

/**
 * MENTIONS LÉGALES (Impressum) — obligatoire en Allemagne (§ 5 DDG,
 * anciennement § 5 TMG). Page publique, aucune donnée personnelle.
 */
export default function ImpressumPage() {
  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <header className="space-y-2 border-b border-white/10 pb-4">
        <h1 className="font-display text-4xl font-black">Impressum</h1>
        <p className="text-sm text-muted-foreground">
          Mentions légales · Angaben gemäß § 5 DDG (anciennement § 5 TMG)
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Anbieter / Éditeur du service</h2>
        <div className="rounded-xl border border-white/10 bg-card/60 p-4 font-mono text-sm leading-relaxed">
          <p className="font-bold">Marc Simo</p>
          <p>MalihaprodBerlin</p>
          <p>13351 Berlin</p>
          <p>Deutschland / Allemagne</p>
          <p className="pt-2">
            E-Mail : <a href="mailto:marcsimo748@gmail.com" className="text-primary hover:underline">marcsimo748@gmail.com</a>
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Verantwortlich pour le contenu</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Verantwortlich i.S.d. § 18 Abs. 2 MStV (contenus propres) : Marc Simo,
          adresse ci-dessus.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Objet du service</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          PRONO est une plateforme communautaire de pronostics football GRATUITE
          entre membres de la diaspora, avec des modules d&apos;entraide :
          emploi, logement, visa, annonces, covoiturage et messagerie privée.
          Il ne s&apos;agit PAS d&apos;un site de paris d&apos;argent :
          aucun paiement, aucun gain financier, aucune cote.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Hébergement</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA -
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">vercel.com</a>.
          Base de données : Supabase (PostgreSQL), supabase.com.
        </p>
      </section>
    </div>
  );
}
