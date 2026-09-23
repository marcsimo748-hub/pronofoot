import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Truck, RefreshCcw, CreditCard, Palette, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "PRONO Boutique | T-shirts et hoodies de la communauté foot & diaspora",
  description:
    "Le vestiaire PRONO : t-shirts et hoodies aux designs de la communauté (foot, diaspora, humour). Impression à la commande en Europe, livraison rapide, retours 14 jours. Réserve ton modèle via WhatsApp.",
};

/**
 * Page /boutique : PRONO Boutique (impression à la commande, zéro stock).
 *
 * 🛒 v1 « réservations » : les boutons WhatsApp recensent la demande réelle
 * (chaque design réservé = signal d'impression). Quand la boutique
 * print-on-demand est prête, on remplace les WhatsApp par les liens d'achat.
 *
 * 💰 PRIX : ajustables dans le tableau PRODUITS ci-dessous (un seul endroit).
 */
const PRODUITS = [
  {
    id: "diaspora-fc",
    nom: "Diaspora FC",
    baseline: "Le blason de la communauté",
    desc: "Berlin, Douala, Paris : le crest officiel des supporters des deux rives. Le classique à porter partout.",
    prix: "24,99 €",
    image: "/boutique/diaspora-fc.png",
  },
  {
    id: "resultat-5-points",
    nom: "Résultat Exact : 5 Points",
    baseline: "Compris seulement par les nôtres",
    desc: "Le barème PRONO version streetwear. Les vrais pronostiqueurs n'ont pas besoin d'expliquer.",
    prix: "24,99 €",
    image: "/boutique/resultat-5-points.png",
  },
  {
    id: "il-y-a-match",
    nom: "Ne me dérange pas, il y a match",
    baseline: "La règle de la maison",
    desc: "L'excuse officielle des soirées Ligue des Champions. Confort maximum, excuses minimales.",
    prix: "24,99 €",
    image: "/boutique/il-y-a-match.png",
  },
];

const AVANTAGES = [
  { icon: Palette, t: "Impression à la commande", d: "Chaque article est imprimé pour toi, zéro gaspillage, séries limitées." },
  { icon: Truck, t: "Livraison ~5-10 jours", d: "Impression en Europe : pas de long voyage, pas de surprise en douane." },
  { icon: RefreshCcw, t: "Retours 14 jours", d: "Ton droit européen : tu changes d'avis, tu es remboursé. Simple." },
  { icon: CreditCard, t: "Paiement simple", d: "PayPal ou Mobile Money, comme pour le Premium, au choix." },
];

export default function BoutiquePage() {
  return (
    <div className="container space-y-8 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            👕 PRONO Boutique
          </span>
          <span className="rounded-full border border-[#16a34a]/40 bg-[#16a34a]/10 px-3 py-1 text-xs font-bold text-[#16a34a]">
            Marque de la communauté
          </span>
        </div>
        <h1 className="text-3xl font-black md:text-4xl">
          Le vestiaire <span className="text-gradient">des nôtres</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Des designs faits pour la communauté PRONO : le foot, la diaspora et l'humour qu'on
          partage entre nous. Ouverture officielle en préparation : <strong>réserve ton modèle
          maintenant</strong>, ce sont vos réservations qui décident des premières impressions.
        </p>
      </header>

      {/* ===== Produits ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Les premiers modèles</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUITS.map((p) => (
            <article key={p.id} className="glass flex flex-col rounded-2xl p-4">
              <div className="overflow-hidden rounded-xl bg-secondary">
                <Image
                  src={p.image}
                  alt={`T-shirt PRONO ${p.nom}`}
                  width={640}
                  height={640}
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col pt-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black">{p.nom}</h3>
                  <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-sm font-black text-primary">
                    {p.prix}
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {p.baseline}
                </p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.desc}</p>
                <a
                  href={`https://wa.me/4915754169524?text=${encodeURIComponent(
                    `Salut PRONO 👕 Je réserve le t-shirt « ${p.nom} » : préviens-moi pour l'ouverture !`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#16a34a] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#15803d]"
                >
                  <MessageCircle className="h-4 w-4" /> Réserver le mien
                </a>
              </div>
            </article>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Chaque modèle existe aussi en hoodie (+15 €). Coupe unisexe, du S au XXL : tu précises
          ta taille au moment de la réservation.
        </p>
      </section>

      {/* ===== Avantages ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Comment ça marche</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AVANTAGES.map((a) => (
            <div key={a.t} className="glass rounded-2xl p-5">
              <a.icon className="h-5 w-5 text-[#16a34a]" />
              <p className="mt-2 text-sm font-bold">{a.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Transparence ===== */}
      <footer className="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-white/10 bg-secondary/40 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" />
        <p>
          PRONO est d'abord un jeu gratuit : la boutique est 100 % séparée du jeu et n'apporte
          aucun point, aucun avantage. Prix TTC, livraison affichée avant paiement, droit de
          retour de 14 jours (droit européen).
        </p>
      </footer>

      <div className="pb-4 text-center text-sm">
        <Link href="/soutenir" className="font-semibold text-muted-foreground hover:text-foreground">
          ☕ Pas envie d'acheter ? Tu peux aussi soutenir PRONO gratuitement →
        </Link>
      </div>
    </div>
  );
}
