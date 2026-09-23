import type { Metadata } from "next";
import Link from "next/link";
import {
  Send,
  Smartphone,
  Banknote,
  Zap,
  ShieldCheck,
  Check,
  ExternalLink,
  Scale,
  PiggyBank,
  Clock,
  BadgeCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PRONO Transferts | Envoyer de l'argent vers l'Afrique en toute confiance",
  description:
    "Compare les services légaux d'envoi d'argent vers l'Afrique : Mobile Money (Orange, MTN), retrait cash ou compte bancaire. Taptap Send, Sendwave, Remitly, Wise, Western Union, Ria, conseils et transparence, par PRONO.",
};

/**
 * Page /prono-transferts : MODULE « PRONO Transferts ».
 *
 * ⚖️ PRONO NE TRANSFÈRE JAMAIS D'ARGENT et ne détient aucun fonds : cette page
 * renvoie vers des prestataires de transfert agréés et supervisés (services
 * de paiement légaux). Certains liens peuvent être des liens partenaires —
 * mention transparente affichée sur la page (obligation de transparence).
 *
 * 🔗 LIENS PARTENAIRES : quand tu obtiens tes liens affiliés, remplace
 * simplement les URL ci-dessous (une ligne par service). Rien d'autre à coder.
 */
const SERVICES = [
  {
    name: "Taptap Send",
    url: "https://www.taptapsend.com",
    tagline: "L'appli simple pour envoyer vers le Mobile Money",
    reception: "Mobile Money (Orange, MTN…)",
    vitesse: "Quelques minutes en général",
    detail:
      "Conçue pour l'Afrique : envoi depuis ton téléphone vers le portefeuille Mobile Money de ton proche, frais et taux affichés avant de confirmer.",
    tags: ["Mobile Money", "Appli"],
  },
  {
    name: "Sendwave",
    url: "https://www.sendwave.com",
    tagline: "Rapide et sans frais cachés",
    reception: "Mobile Money",
    vitesse: "Quelques minutes en général",
    detail:
      "Envoi direct vers le Mobile Money depuis l'appli, avec le montant exact reçu affiché à l'écran. Disponibilité selon les pays.",
    tags: ["Mobile Money", "Appli"],
  },
  {
    name: "Remitly",
    url: "https://www.remitly.com",
    tagline: "Deux vitesses au choix : Éco ou Express",
    reception: "Banque, Mobile Money ou cash",
    vitesse: "Express : minutes · Éco : 1-3 jours",
    detail:
      "Tu choisis : rapide (un peu plus cher) ou économique (un peu plus lent). Envoi vers comptes bancaires, portefeuilles ou points de retrait.",
    tags: ["Banque", "Mobile Money", "Cash"],
  },
  {
    name: "Wise",
    url: "https://wise.com",
    tagline: "Le taux de change réel, sans surprise",
    reception: "Compte bancaire",
    vitesse: "Quelques heures à 1-2 jours",
    detail:
      "Transparence totale : le vrai taux de change du marché et des frais fixes affichés. Souvert le moins cher pour les virements vers les comptes bancaires.",
    tags: ["Banque", "Taux réel"],
  },
  {
    name: "Western Union",
    url: "https://www.westernunion.com",
    tagline: "Le réseau le plus large au monde",
    reception: "Cash, banque ou portefeuille",
    vitesse: "Cash : minutes",
    detail:
      "Des centaines de milliers de points de retrait : ton proche peut récupérer l'argent en espèces presque partout, même sans compte.",
    tags: ["Cash", "Partout"],
  },
  {
    name: "Ria",
    url: "https://www.riamoneytransfer.com",
    tagline: "En ligne ou en agence, depuis 1987",
    reception: "Cash ou dépôt sur compte",
    vitesse: "Minutes pour le cash",
    detail:
      "Un des réseaux historiques du transfert : envoi depuis le site, l'appli ou une agence partenaire, retrait en espèces ou crédit sur compte.",
    tags: ["Cash", "Agences"],
  },
];

const CRITERES = [
  {
    icon: PiggyBank,
    title: "Regarde le montant REÇU",
    text: "Compare toujours ce que ton proche touchera réellement (frais + taux de change), pas seulement les frais affichés.",
  },
  {
    icon: Zap,
    title: "Choisis la vitesse",
    text: "En urgence ? Mobile Money et cash arrivent en minutes. Pas pressé ? Les options économiques coûtent souvent moins cher.",
  },
  {
    icon: Smartphone,
    title: "Vérifie le mode de réception",
    text: "Mobile Money (instantané sur le téléphone), retrait cash (aucun compte requis) ou virement bancaire, selon ce que préfère ton proche.",
  },
  {
    icon: Clock,
    title: "Prépare ta pièce d'identité",
    text: "C'est normal et obligatoire : la loi impose aux services agréés de vérifier l'identité (anti-blanchiment). Garde ton passeport ou CNI à portée de main.",
  },
];

export default function PronoTransfertsPage() {
  return (
    <div className="theme-transferts container space-y-8 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            💸 PRONO Transferts
          </span>
          <span className="rounded-full border border-[#16a34a]/40 bg-[#16a34a]/10 px-3 py-1 text-xs font-bold text-[#16a34a]">
            100 % légal
          </span>
        </div>
        <h1 className="text-3xl font-black md:text-4xl">
          Envoie de l'argent à tes proches, <span className="text-gradient">sereinement</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Compare les services d'envoi vers l'Afrique : Mobile Money (Orange, MTN…), retrait cash
          ou compte bancaire. PRONO te guide : <strong>l'envoi passe toujours par un prestataire
          agréé et supervisé</strong>, jamais par nous.
        </p>
      </header>

      {/* ===== Les services ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Les services comparés</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <article
              key={s.name}
              className="glass flex flex-col rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-black">{s.name}</h3>
                <div className="flex flex-wrap justify-end gap-1">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-sm font-semibold text-[#16a34a]">{s.tagline}</p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.detail}</p>
              <dl className="mt-3 space-y-1.5 border-t border-white/5 pt-3 text-xs">
                <div className="flex items-center gap-2">
                  <Banknote className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
                  <dt className="font-semibold">Réception :</dt>
                  <dd className="text-muted-foreground">{s.reception}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
                  <dt className="font-semibold">Vitesse :</dt>
                  <dd className="text-muted-foreground">{s.vitesse}</dd>
                </div>
              </dl>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#16a34a] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#15803d]"
              >
                Aller sur {s.name} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Frais, taux et disponibilité évoluent : vérifie toujours le montant exact reçu avant de
          confirmer un envoi.
        </p>
      </section>

      {/* ===== Comment choisir ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Bien choisir son envoi</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CRITERES.map((c) => (
            <div key={c.title} className="glass rounded-2xl p-5">
              <p className="flex items-center gap-2 text-sm font-bold">
                <c.icon className="h-4 w-4 text-[#16a34a]" /> {c.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Étapes ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Comment ça marche ?</h2>
        <ol className="glass grid gap-6 rounded-2xl p-6 sm:grid-cols-3">
          {[
            {
              n: "1",
              t: "Compare ici",
              d: "Regarde le montant reçu, la vitesse et le mode de réception pour ton pays.",
            },
            {
              n: "2",
              t: "Inscris-toi chez le service",
              d: "Crée un compte chez le prestataire avec ta pièce d'identité (obligatoire, c'est la loi).",
            },
            {
              n: "3",
              t: "Envoie et préviens ton proche",
              d: "Il reçoit sur son Mobile Money, en cash ou sur son compte, tu suis tout depuis l'appli.",
            },
          ].map((e) => (
            <li key={e.n} className="space-y-1.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a] text-sm font-black text-white">
                {e.n}
              </span>
              <p className="font-bold">{e.t}</p>
              <p className="text-sm text-muted-foreground">{e.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Questions fréquentes ===== */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Questions fréquentes</h2>
        <div className="glass space-y-4 rounded-2xl p-6 text-sm">
          <div>
            <p className="flex items-center gap-2 font-bold">
              <Scale className="h-4 w-4 shrink-0 text-[#16a34a]" />
              Pourquoi PRONO ne transfère pas l'argent directement ?
            </p>
            <p className="mt-1 text-muted-foreground">
              Transférer l'argent des autres est un métier de banque, réservé aux établissements
              agréés et supervisés (comme ceux listés ci-dessus). PRONO compare et t'oriente -
              c'est ce qui te protège, toi et ton argent.
            </p>
          </div>
          <div>
            <p className="flex items-center gap-2 font-bold">
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#16a34a]" />
              Ça coûte plus cher en passant par PRONO ?
            </p>
            <p className="mt-1 text-muted-foreground">
              Non, jamais. Le prix est exactement le même. Certains liens sont des liens
              partenaires : le service nous reverse une petite commission, ça soutient le site,
              sans rien changer pour toi.
            </p>
          </div>
          <div>
            <p className="flex items-center gap-2 font-bold">
              <Smartphone className="h-4 w-4 shrink-0 text-[#16a34a]" />
              Quel service pour le Cameroun ?
            </p>
            <p className="mt-1 text-muted-foreground">
              Pour le Mobile Money (Orange, MTN) : regarde Taptap Send ou Sendwave. Pour un retrait
              en espèces : Western Union ou Ria. Compare toujours le montant reçu pour ton montant
              précis : le moins cher varie selon les envois.
            </p>
          </div>
          <div>
            <p className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#16a34a]" />
              C'est sûr ?
            </p>
            <p className="mt-1 text-muted-foreground">
              Oui : chaque service listé est un établissement de paiement déclaré, avec vérification
              d'identité et suivi des envois. Évite toujours les envois via des inconnus sur les
              réseaux sociaux : utilise uniquement des services officiels.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Transparence ===== */}
      <footer className="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-white/10 bg-secondary/40 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" />
        <p>
          <Check className="mr-1 inline h-3 w-3 text-[#16a34a]" />
          PRONO ne détient ni ne transfère aucun argent : tous les envois passent par des
          prestataires agréés et supervisés. Certains liens sont des liens partenaires : prix
          identique pour toi, petit soutien pour le site. Le jeu de pronostics PRONO reste 100 %
          gratuit et ne dépend jamais de ces services.
        </p>
      </footer>

      <div className="pb-4 text-center text-sm">
        <Link href="/prono-voyage" className="font-semibold text-muted-foreground hover:text-foreground">
          ✈️ Tu prépares aussi un voyage ? Regarde PRONO Voyage →
        </Link>
      </div>
    </div>
  );
}
