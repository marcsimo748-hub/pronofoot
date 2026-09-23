import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "AGB · Conditions d'utilisation",
  description: "Conditions générales d'utilisation de PRONO : jeu gratuit, pas d'argent, pronos à vie, classement automatique.",
};

/**
 * AGB / CGU — Conditions Générales d'Utilisation.
 * Points clés : jeu 100% gratuit (pas de paris d'argent), pronostics
 * conservés à vie, classement automatique, règles de la communauté.
 */
export default function AgbPage() {
  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <header className="space-y-2 border-b border-white/10 pb-4">
        <h1 className="font-display text-4xl font-black">AGB · Conditions d&apos;utilisation</h1>
        <p className="text-sm text-muted-foreground">Allgemeine Geschäftsbedingungen</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">1. Un jeu gratuit, pas de l&apos;argent</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          PRONO est un jeu de pronostics football <strong>entièrement gratuit</strong> entre
          membres de la diaspora. Aucun pari d&apos;argent : pas de mise, pas de gain financier,
          pas de cote. Les points servent uniquement au classement communautaire et
          n&apos;ont aucune valeur marchande. Le site n&apos;est pas un opérateur de jeux
          d&apos;argent au sens du Spielhallengesetz (GlüStV).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">2. Compte membre</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          L&apos;inscription est gratuite (e-mail + mot de passe). Un seul compte par
          personne. Tu es responsable de la confidentialité de ton mot de passe.
          Les comptes fantômes ou frauduleux peuvent être suspendus par l&apos;équipe.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">3. Pronostics conservés à vie</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Chaque pronostic est <strong>sauvegardé définitivement</strong> dans la base de
          données dès son enregistrement et ne peut plus être modifié après le coup
          d&apos;envoi du match (verrouillage automatique). Ton historique reste visible
          pour toujours dans ton espace. La suppression de ton compte supprime tes données.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">4. Classement automatique</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Les points sont calculés automatiquement dès la fin de chaque match :
          score exact = <span className="font-mono font-bold text-primary">5 pts</span>,
          bon vainqueur ou bon nul = <span className="font-mono font-bold text-primary">3 pts</span>,
          bonus de saison (champion 50 pts, LDC 75 pts, buteur 25 pts).
          Le classement général, par championnat et mensuel se met à jour à chaque
          pronostic et à chaque fin de match. Dès le coup d&apos;envoi, les pronostics
          de tous les joueurs sont visibles par la communauté (transparence du jeu).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">5. Respect et modération</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Les modules communautaires (annonces, covoiturage, chat, messagerie) exigent
          le respect de tous les membres. Contenus illégaux, haineux ou trompeurs :
          suppression et suspension. Les coordonnées dans le chat privé ne sont
          révélées qu&apos;avec l&apos;accord explicite du propriétaire. Trois signalements
          entraînent le masquage automatique d&apos;un contenu.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">6. Responsabilité</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Le service est fourni tel quel, sans garantie de disponibilité ininterrompue.
          La responsabilité de MalihaprodBerlin est limitée aux dommages intentionnels
          ou causés par négligence grave. Les liens externes (billets d&apos;avion,
          offres d&apos;emploi, guides officiels) renvoient vers des sites tiers
          indépendants.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">7. Droit applicable</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Droit allemand. Lieu de juridiction : Berlin. Contact :
          <a href="mailto:marcsimo748@gmail.com" className="ml-1 text-primary hover:underline">marcsimo748@gmail.com</a>
        </p>
      </section>
    </div>
  );
}
