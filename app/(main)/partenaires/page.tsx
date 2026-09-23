import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Mail, Store, Scissors, Plane, Utensils, Music4, Megaphone, ShieldCheck, Check, Sparkles, BadgeEuro } from "lucide-react";

export const metadata: Metadata = {
  title: "Devenir partenaire | Ton commerce devant la communauté PRONO",
  description:
    "Épicerie africaine, coiffeur, restaurant, agence de voyage ou service diaspora : affiche-toi devant la communauté PRONO. Formules simples dès 20 €/mois, sans engagement, paiement Mobile Money ou PayPal.",
};

/**
 * Page /partenaires : PROSPECTS EXTERNES (commerçants, services diaspora).
 * Page PUBLIQUE, aucun compte requis : explique les formules et redirige
 * vers WhatsApp / email (coordonnées réelles déjà utilisées dans le footer).
 *
 * 💰 Les prix affichés ici sont publics : tu peux les ajuster d'un seul
 * endroit (tableau FORMULES ci-dessous) et me demander de redéployer.
 */
const FORMULES = [
  {
    nom: "Découverte",
    prix: "20 €",
    periode: "/mois",
    ideal: "Petits commerces et indépendants",
    atouts: [
      "Bannière visible sur le site en rotation",
      "Lien vers ta boutique ou ton WhatsApp",
      "Sans engagement : stop quand tu veux",
    ],
  },
  {
    nom: "Communauté",
    prix: "50 €",
    periode: "/mois",
    ideal: "Le meilleur rapport visibilité / prix",
    atouts: [
      "Bannière en priorité sur les pages les plus vues",
      "Ton logo sur la page d'accueil (Espace partenaires)",
      "Ton actualité partagée dans le fil du site",
    ],
    star: true,
  },
  {
    nom: "Héros",
    prix: "100 €",
    periode: "/mois",
    ideal: "Agences, enseignes, événements",
    atouts: [
      "Tout le pack Communauté",
      "Bannière exclusive (sans rotation) sur les pages score et pronos",
      "Mention « Partenaire officiel de PRONO »",
    ],
  },
];

const POUR_QUI = [
  { icon: Store, label: "Épiceries & boutiques africaines" },
  { icon: Scissors, label: "Coiffeurs & coiffeuses" },
  { icon: Utensils, label: "Restaurants & traiteurs" },
  { icon: Plane, label: "Agences de voyage & billetterie" },
  { icon: Music4, label: "Événements, concerts, soirées" },
  { icon: Megaphone, label: "Services de la diaspora" },
];

export default function PartenairesPage() {
  return (
    <div className="container space-y-8 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            🤝 Espace partenaires
          </span>
          <span className="rounded-full border border-[#16a34a]/40 bg-[#16a34a]/10 px-3 py-1 text-xs font-bold text-[#16a34a]">
            Dès 20 €/mois · sans engagement
          </span>
        </div>
        <h1 className="text-3xl font-black md:text-4xl">
          Ton commerce, <span className="text-gradient">devant la bonne audience</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          PRONO réunit une communauté qui partage la même passion : le foot, la vie en Europe et
          les racines africaines. Tes futurs clients sont déjà ici : parle-leur directement.
        </p>
      </header>

      {/* ===== Pour qui ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">C'est pour qui ?</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {POUR_QUI.map((p) => (
            <div key={p.label} className="glass flex items-center gap-3 rounded-xl p-4 text-sm font-semibold">
              <p.icon className="h-5 w-5 shrink-0 text-primary" />
              {p.label}
            </div>
          ))}
        </div>
      </section>

      {/* ===== Formules ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Des formules simples</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {FORMULES.map((f) => (
            <article
              key={f.nom}
              className={
                f.star
                  ? "relative glass rounded-2xl border-2 border-primary/60 p-6"
                  : "glass rounded-2xl p-6"
              }
            >
              {f.star && (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wide text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> Populaire
                </span>
              )}
              <h3 className="font-black">{f.nom}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{f.ideal}</p>
              <p className="mt-3">
                <span className="text-3xl font-black">{f.prix}</span>
                <span className="text-sm text-muted-foreground"> {f.periode}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {f.atouts.map((a) => (
                  <li key={a} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16a34a]" /> {a}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <BadgeEuro className="h-4 w-4 shrink-0 text-[#16a34a]" />
          Paiement facile : <strong>Mobile Money</strong> (Orange, MTN) ou <strong>PayPal</strong>. Facture fournie.
        </p>
      </section>

      {/* ===== Contact ===== */}
      <section className="glass space-y-4 rounded-2xl p-6">
        <h2 className="text-xl font-bold">On en discute ?</h2>
        <p className="text-sm text-muted-foreground">
          Écris-nous : réponse rapide, en français. <strong>WhatsApp ou Telegram uniquement
          (messages, pas d'appels)</strong> au +49 1575 4169524. Premier échange sans
          engagement pour voir ensemble ce qui marche pour ton commerce.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://wa.me/4915754169524?text=Bonjour%20PRONO%2C%20je%20souhaite%20devenir%20partenaire%20%F0%9F%A4%9D"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#15803d]"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp : +49 1575 4169524
          </a>
          <a
            href="mailto:marcsimo748@gmail.com?subject=Devenir%20partenaire%20PRONO%20%F0%9F%A4%9D"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-secondary px-5 py-2.5 text-sm font-bold transition-colors hover:bg-secondary/70"
          >
            <Mail className="h-4 w-4" /> marcsimo748@gmail.com
          </a>
        </div>
        <p className="flex items-start gap-2 border-t border-white/5 pt-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" />
          Transparence : les partenaires n'ont aucune influence sur le jeu, les scores ou le
          classement : la communauté garde un jeu 100 % équitable.
        </p>
      </section>

      <div className="pb-4 text-center text-sm">
        <Link href="/soutenir" className="font-semibold text-muted-foreground hover:text-foreground">
          ☕ Tu n'es pas commerçant mais tu veux aider PRONO ? Regarde ici →
        </Link>
      </div>
    </div>
  );
}
