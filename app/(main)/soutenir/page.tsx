import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Share2, Crown, Coffee, Users, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "☕ Soutenir PRONO | Aider ton site de pronostics gratuit",
  description:
    "PRONO restera gratuit. Tu peux aider en 3 clics : partager le site, inviter tes amis ou passer Premium. Chaque soutien compte, merci à la communauté !",
};

/**
 * Page /soutenir : soutien communautaire (PUBLIC).
 *
 * 💰 DON : quand tu as ton lien PayPal.me (ou Buy Me a Coffee), colle-le
 * ci-dessous et la carte « Faire un don » affichera le bouton tout seul.
 * Exemple : const DONATE_URL = "https://paypal.me/tonpseudo";
 */
const DONATE_URL: string | null = null;

const SHARE_TEXT =
  "⚽ Pronostics gratuits sur les grands championnats + emploi, logement, voyage pour la diaspora : PRONO ! Rejoins-nous 👉";

export default function SoutenirPage() {
  const siteUrl = "https://pronofoot-phi.vercel.app";

  return (
    <div className="container space-y-8 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            ☕ Soutenir PRONO
          </span>
          <span className="rounded-full border border-[#16a34a]/40 bg-[#16a34a]/10 px-3 py-1 text-xs font-bold text-[#16a34a]">
            Gratuit pour toujours
          </span>
        </div>
        <h1 className="text-3xl font-black md:text-4xl">
          Aider PRONO en <span className="text-gradient">3 clics</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Le jeu restera <strong>100 % gratuit</strong> : pas de piège. Mais un site, ça coûte du
          temps et un peu d'argent. Si tu aimes PRONO, voici les meilleurs moyens de nous aider.
        </p>
      </header>

      {/* ===== Les 3 façons ===== */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* 1. Partager */}
        <article className="glass flex flex-col rounded-2xl p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563eb]/15 text-[#2563eb]">
            <Share2 className="h-5 w-5" />
          </span>
          <h2 className="mt-3 font-black">Partager</h2>
          <p className="mt-1 flex-1 text-sm text-muted-foreground">
            Le soutien le plus simple et le plus puissant : un partage vaut dix pubs. Envoie PRONO
            à tes groupes WhatsApp 👇
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + " " + siteUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#16a34a] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#15803d]"
            >
              <Share2 className="h-3.5 w-3.5" /> WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(SHARE_TEXT)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              <Share2 className="h-3.5 w-3.5" /> Telegram
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-secondary px-3.5 py-2 text-xs font-bold transition-colors hover:bg-secondary/70"
            >
              <Share2 className="h-3.5 w-3.5" /> Facebook
            </a>
          </div>
        </article>

        {/* 2. Inviter */}
        <article className="glass flex flex-col rounded-2xl p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e11d48]/15 text-[#e11d48]">
            <Users className="h-5 w-5" />
          </span>
          <h2 className="mt-3 font-black">Inviter tes potes</h2>
          <p className="mt-1 flex-1 text-sm text-muted-foreground">
            Un pronostic entre amis, c'est mieux. Chaque nouveau joueur rend la ligue plus
            vivante : et le classement plus serré 🏆
          </p>
          <Link
            href="/classement"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-secondary px-3.5 py-2 text-xs font-bold transition-colors hover:bg-secondary/70"
          >
            Voir le classement à battre
          </Link>
        </article>

        {/* 3. Premium ou don */}
        <article className="glass flex flex-col rounded-2xl border-2 border-primary/50 p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <Crown className="h-5 w-5" />
          </span>
          <h2 className="mt-3 font-black">Passer Premium</h2>
          <p className="mt-1 flex-1 text-sm text-muted-foreground">
            Le soutien direct : stats avancées et confort pendant 30 jours. Un paiement unique,
            pas d'abonnement : tu choisis quand.
          </p>
          <Link
            href="/tarifs"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Crown className="h-3.5 w-3.5" /> Voir le pass Premium
          </Link>
        </article>
      </section>

      {/* ===== Don ===== */}
      <section className="glass flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#f59e0b]/15 text-[#f59e0b]">
          <Coffee className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <h2 className="font-black">Offrir un café ☕</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {DONATE_URL
              ? "Un petit geste quand tu veux, 100 % pour faire vivre le site. Merci d'avance ! ❤️"
              : "Le don en ligne arrive très bientôt. En attendant, ton partage et ton enthousiasme valent de l'or, merci ! ❤️"}
          </p>
        </div>
        {DONATE_URL && (
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#f59e0b] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#d97706]"
          >
            <Heart className="h-4 w-4" /> Faire un don
          </a>
        )}
      </section>

      {/* ===== Transparence ===== */}
      <footer className="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-white/10 bg-secondary/40 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" />
        <p>
          PRONO est un jeu à points 100 % gratuit : payer ne donne <strong>aucun avantage dans le
          jeu</strong>, jamais. Les soutiens servent uniquement à faire vivre le site (hébergement,
          données des matchs, développements). Merci à toute la communauté ❤️
        </p>
      </footer>

      <div className="pb-4 text-center text-sm">
        <Link href="/partenaires" className="font-semibold text-muted-foreground hover:text-foreground">
          🤝 Tu as un commerce ou un service ? Deviens partenaire →
        </Link>
        <br />
        <Link href="/boutique" className="font-semibold text-muted-foreground hover:text-foreground">
          👕 Porte les couleurs de la communauté : la Boutique →
        </Link>
      </div>
    </div>
  );
}
