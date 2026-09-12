"use client";

/**
 * ServicesGrid — les 6 services PRONO sur la page d'accueil.
 * Une couleur par service : bordure, icône et survol dans la couleur du module.
 * Voyage arrive bientôt : carte visible, non cliquable.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Briefcase,
  FileCheck,
  Home,
  Heart,
  Plane,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface Service {
  href: string | null;
  name: string;
  desc: string;
  icon: LucideIcon;
  soon?: boolean;
  border: string;
  iconBox: string;
  iconHover: string;
  hoverCard: string;
  ctaColor: string;
}

const SERVICES: Service[] = [
  {
    href: "/pronos",
    name: "PRONO - Pronostics",
    desc: "Pronostique les plus grands matchs d'Europe, suis les scores en direct et grimpe dans le classement.",
    icon: Trophy,
    border: "border-[#16a34a]/40",
    iconBox: "bg-[#16a34a]/15 text-[#16a34a]",
    iconHover: "group-hover:bg-white/20 group-hover:text-white",
    hoverCard: "hover:bg-[#16a34a] hover:border-[#16a34a] hover:text-white",
    ctaColor: "text-[#16a34a]",
  },
  {
    href: "/prono-job",
    name: "PRONO Emploi",
    desc: "Des offres d'emploi en Allemagne, en Europe et en télétravail, avec score de compatibilité et suivi de candidatures.",
    icon: Briefcase,
    border: "border-[#2563eb]/40",
    iconBox: "bg-[#2563eb]/15 text-[#2563eb]",
    iconHover: "group-hover:bg-white/20 group-hover:text-white",
    hoverCard: "hover:bg-[#2563eb] hover:border-[#2563eb] hover:text-white",
    ctaColor: "text-[#2563eb]",
  },
  {
    href: "/prono-visa",
    name: "PRONO Visa",
    desc: "Calcule tes chances de visa Allemagne en 2 minutes, checklist des documents et guides complets.",
    icon: FileCheck,
    border: "border-[#7c3aed]/40",
    iconBox: "bg-[#7c3aed]/15 text-[#7c3aed]",
    iconHover: "group-hover:bg-white/20 group-hover:text-white",
    hoverCard: "hover:bg-[#7c3aed] hover:border-[#7c3aed] hover:text-white",
    ctaColor: "text-[#7c3aed]",
  },
  {
    href: "/prono-housing",
    name: "PRONO Logement",
    desc: "WG et appartements, loyers de référence par ville et lettre de motivation générée automatiquement.",
    icon: Home,
    border: "border-[#ea580c]/40",
    iconBox: "bg-[#ea580c]/15 text-[#ea580c]",
    iconHover: "group-hover:bg-white/20 group-hover:text-white",
    hoverCard: "hover:bg-[#ea580c] hover:border-[#ea580c] hover:text-white",
    ctaColor: "text-[#ea580c]",
  },
  {
    href: "/prono-annonces",
    name: "PRONO Annonces",
    desc: "Rencontre, amis, services et colocations : publie avec photos et contacte directement la communauté.",
    icon: Heart,
    border: "border-[#e11d48]/40",
    iconBox: "bg-[#e11d48]/15 text-[#e11d48]",
    iconHover: "group-hover:bg-white/20 group-hover:text-white",
    hoverCard: "hover:bg-[#e11d48] hover:border-[#e11d48] hover:text-white",
    ctaColor: "text-[#e11d48]",
  },
  {
    href: null,
    name: "PRONO Voyage",
    desc: "Billets, trajets partagés et bons plans pour voyager malin entre ici et là-bas.",
    icon: Plane,
    soon: true,
    border: "border-[#0891b2]/40",
    iconBox: "bg-[#0891b2]/15 text-[#0891b2]",
    iconHover: "group-hover:bg-white/20 group-hover:text-white",
    hoverCard: "hover:bg-[#0891b2] hover:border-[#0891b2] hover:text-white",
    ctaColor: "text-[#0891b2]",
  },
];

export function ServicesGrid() {
  return (
    <section className="container py-14" id="services">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black md:text-4xl">
          Une seule app, <span className="text-gradient">six services</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Chaque service a sa couleur. Choisis le tien, tout est gratuit.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s, i) => {
          const card = (
            <>
              <span
                className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl transition-all duration-300 group-hover:scale-110 ${s.iconBox} ${s.iconHover}`}
              >
                <s.icon className="h-7 w-7" />
              </span>
              <h3 className="text-lg font-black">{s.name}</h3>
              <p className="mt-1.5 min-h-[40px] text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-white/85">
                {s.desc}
              </p>
              <span
                className={`mt-3 inline-flex items-center gap-1 text-sm font-bold transition-colors group-hover:text-white ${s.ctaColor}`}
              >
                {s.soon ? "Bientôt disponible" : "Découvrir"} <ArrowRight className="h-4 w-4" />
              </span>
              {s.soon && (
                <span className="absolute right-4 top-4 rounded-full border border-[#0891b2]/40 bg-[#0891b2]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0891b2]">
                  Bientôt
                </span>
              )}
            </>
          );

          const cls = `group relative overflow-hidden rounded-2xl border-2 bg-card/70 p-6 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${s.border} ${s.hoverCard}`;

          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.06 }}
            >
              {s.href ? (
                <Link href={s.href} className={`${cls} block h-full`}>
                  {card}
                </Link>
              ) : (
                <div className={`${cls} h-full cursor-default`}>{card}</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
