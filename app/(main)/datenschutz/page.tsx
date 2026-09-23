import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Datenschutz · Confidentialité (DSGVO)",
  description: "Politique de confidentialité de PRONO : hébergement, données stockées, droits DSGVO.",
};

/**
 * DATENSCHUTZ / POLITIQUE DE CONFIDENTIALITÉ (DSGVO).
 * Explication claire : hébergement Vercel, stockage Supabase,
 * pronostics conservés à vie (Art. 6 lit. f pour le classement),
 * PronoScore automatisé (Art. 22), droits des membres.
 */
export default function DatenschutzPage() {
  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <header className="space-y-2 border-b border-white/10 pb-4">
        <h1 className="font-display text-4xl font-black">Datenschutz</h1>
        <p className="text-sm text-muted-foreground">
          Politique de confidentialité · Datenschutz­erklärung (DSGVO)
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">1. Responsable du traitement</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Marc Simo, MalihaprodBerlin, 13351 Berlin, Deutschland -
          <a href="mailto:marcsimo748@gmail.com" className="ml-1 text-primary hover:underline">marcsimo748@gmail.com</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">2. Hébergement (Vercel / Supabase)</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Le site est hébergé par <strong>Vercel Inc.</strong> (USA) et sa base de données par
          <strong> Supabase</strong> (PostgreSQL). Lors de chaque visite, des données techniques
          (adresse IP, navigateur, pages consultées) sont traitées de manière éphémère pour
          servir le site · base légale : Art. 6 al. 1 lit. f DSGVO (fourniture d&apos;un
          service web performant et sécurisé). Les serveurs peuvent se trouver dans l&apos;UE
          ou aux USA ; Vercel et Supabase appliquent les clauses contractuelles types (SCC).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">3. Données du compte membre</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          À l&apos;inscription : adresse e-mail, pseudonyme et mot de passe (chiffré).
          Base légale : Art. 6 al. 1 lit. b DSGVO (exécution du contrat gratuit).
          Tu peux demander la suppression de ton compte à tout moment par e-mail.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">4. Pronostics conservés à vie</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tes pronostics, points et classements sont conservés <strong>sans limitation de
          durée</strong> : ils constituent l&apos;historique du jeu communautaire et la base du
          classement général. Base légale : Art. 6 al. 1 lit. f DSGVO (notre intérêt légitime
          à garantir un classement juste, vérifiable et permanent). La suppression du compte
          entraîne la suppression de ces données.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">5. PronoScore et automatisation (Art. 22)</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Le calcul des points et du PronoScore est <strong>entièrement automatisé</strong>
          (Art. 22 DSGVO : décision automatisée). Les règles sont transparentes :
          score exact = 5 points, bon résultat = 3 points, calcul dès la fin du match,
          aucun classement humain. L&apos;assistant IA du site utilise des modèles
          externes (Groq / Google Gemini) sans transmettre tes données personnelles.
          En cas de désaccord sur un calcul, écris-nous : une vérification humaine
          est toujours possible.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">6. Cookies</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Uniquement des cookies <strong>techniques</strong> (session de connexion).
          Aucun cookie publicitaire, aucun traqueur tiers.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">7. Tes droits</h2>
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
          <li>Droit d&apos;accès (Auskunft) à tes données</li>
          <li>Droit de rectification (Berichtigung)</li>
          <li>Droit à l&apos;effacement (Löschung), y compris suppression du compte</li>
          <li>Droit à la limitation du traitement et droit d&apos;opposition</li>
          <li>Droit à la portabilité de tes données</li>
          <li>Droit de réclamation auprès d&apos;une autorité de contrôle (Berliner Beauftragte für Datenschutz)</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Pour exercer ces droits : <a href="mailto:marcsimo748@gmail.com" className="text-primary hover:underline">marcsimo748@gmail.com</a>
        </p>
      </section>
    </div>
  );
}
