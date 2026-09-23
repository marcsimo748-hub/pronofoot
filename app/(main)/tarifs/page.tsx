import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumCheckoutButton from "@/components/tarifs/PremiumCheckoutButton";
import { getSessionUser } from "@/lib/supabase/server";
import { isAnyPaymentConfigured, getAvailableMethods } from "@/lib/services/payments.service";

export const metadata: Metadata = {
  title: "Tarifs · Gratuit aujourd'hui, Premium bientôt",
  description:
    "PRONO est 100 % gratuit : pronostics sur 6 championnats, scores en direct, modules vie en Allemagne. Un plan Premium arrive bientôt · jeu à points entre amis, aucune promesse de gains.",
};

/**
 * Page /tarifs — plans Gratuit et Premium.
 * ⚖️ Légal : aucun paiement actif (aucune clé Stripe dans le code), aucune promesse
 * de gains — PRONO est un jeu de pronostics à points entre joueurs.
 * Le plan Premium est présenté comme « bientôt disponible ».
 */
export const dynamic = "force-dynamic";

export default async function TarifsPage() {
  const user = await getSessionUser();
  // Phase 3 : le bouton de paiement n'apparaît QUE si un moyen est configuré
  // côté serveur (Admin > clés : PayPal et/ou Mobile Money). Sinon : bouton
  // « bientôt » d'origine. Aucune carte bancaire — choix du propriétaire.
  const stripeReady = await isAnyPaymentConfigured().catch(() => false);
  const methods = await getAvailableMethods().catch(() => ({ paypal: false, mobileMoney: false }));

  const freeFeatures = [
    "Pronostics sur 6 championnats (Ligue 1, Premier League, LaLiga, Serie A, Bundesliga, Ligue des champions)",
    "Scores en direct et classements officiels",
    "Classement entre joueurs, bonus de saison",
    "Modules vie en Allemagne : emploi, logement, visa, voyage, annonces",
    "Chat privé, notifications, assistant IA",
  ];
  const premiumFeatures = [
    "Tout le plan Gratuit, évidemment",
    "Statistiques avancées : tendances, historique détaillé, comparaison entre joueurs",
    "Analyses de matchs approfondies par l'IA",
    "Mini-ligues privées entre amis",
    "Alertes e-mail avant le coup d'envoi",
    "Badge ✨ Premium sur ton profil",
  ];

  return (
    <div className="theme-foot container space-y-8 py-10">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="font-display text-4xl font-black">
          Tarifs <span className="text-gradient">simples et honnêtes</span>
        </h1>
        <p className="text-muted-foreground">
          PRONO est un jeu de pronostics à points entre amis. Aucun gain d&apos;argent,
          aucune promesse de résultat · juste le foot, la bluff et la gloire 🏆
        </p>
      </header>

      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        {/* ---------- PLAN GRATUIT ---------- */}
        <section className="rounded-2xl border border-primary/40 bg-card/60 p-6 shadow-glow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Gratuit</p>
          <p className="mt-2 text-4xl font-black">
            0 €<span className="text-base font-medium text-muted-foreground"> / pour toujours</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Tout ce qu&apos;il faut pour jouer · sans carte bancaire.</p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {freeFeatures.map((f) => (
              <li key={f} className="flex gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {user ? (
            <Button variant="glow" className="mt-6 w-full" asChild>
              <Link href="/pronos">Ton compte est déjà actif · pronostique !</Link>
            </Button>
          ) : (
            <Button variant="glow" className="mt-6 w-full" asChild>
              <Link href="/signup">Créer mon compte gratuit</Link>
            </Button>
          )}
        </section>

        {/* ---------- PLAN PREMIUM ---------- */}
        <section className="relative rounded-2xl border border-amber-400/40 bg-card/60 p-6">
          <span className="absolute -top-3 right-5 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-black">
            <Clock className="h-3.5 w-3.5" /> Bientôt disponible
          </span>
          <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-amber-300">
            <Sparkles className="h-4 w-4" /> Premium
          </p>
          <p className="mt-2 text-4xl font-black">
            4,99 €<span className="text-base font-medium text-muted-foreground"> / mois · prix de lancement</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Pour les joueurs qui veulent aller plus loin dans les stats · le paiement
            (sécurisé, sans abonnement forcé) ouvrira ici.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {premiumFeatures.map((f) => (
              <li key={f} className="flex gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {stripeReady ? (
            <PremiumCheckoutButton paypalReady={methods.paypal} mobileMoneyReady={methods.mobileMoney} />
          ) : (
            <Button variant="outline" disabled className="mt-6 w-full">
              🚧 Paiement sécurisé · bientôt
            </Button>
          )}
        </section>
      </div>

      <p className="mx-auto flex max-w-2xl items-start gap-2.5 rounded-xl border border-white/10 bg-secondary/40 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        PRONO est un jeu à points, sans argent réel. Le plan Premium n&apos;augmente pas tes
        chances de gagner : il ajoute des statistiques et du confort. Jouer au foot ne se
        pronostique jamais à 100 % · et c&apos;est ça qui est fun.
      </p>
    </div>
  );
}
