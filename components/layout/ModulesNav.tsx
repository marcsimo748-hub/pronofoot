"use client";

/**
 * ModulesNav — bandeau de navigation rapide entre les modules Pronofoot
 * (visible en haut de toutes les pages /prono-*). Défilement horizontal
 * sur mobile — chaque nouveau module s'ajoute ici.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ModuleLink {
  href: string;
  label: string;
  icon: string;
  soon?: boolean;
}

const MODULES: ModuleLink[] = [
  { href: "/prono-job", label: "Emploi", icon: "💼" },
  { href: "/prono-profil", label: "Profil & CV", icon: "🧩" },
  { href: "/prono-visa", label: "Visa", icon: "🛂" },
  { href: "/prono-housing", label: "Logement", icon: "🏠" },
  { href: "/prono-annonces", label: "Annonces", icon: "📢" },
];

export function ModulesNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Modules Pronofoot"
      className="sticky top-14 z-30 border-b border-white/5 bg-background/85 backdrop-blur-xl md:top-16"
    >
      <div className="container flex gap-2 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MODULES.map((m) => {
          const active = pathname === m.href;
          if (m.soon) {
            return (
              <span
                key={m.href}
                className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-full border border-white/5 bg-card/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground/60"
                title="Bientôt disponible"
              >
                {m.icon} {m.label} <span className="text-[10px] uppercase">bientôt</span>
              </span>
            );
          }
          return (
            <Link
              key={m.href}
              href={m.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-white/10 bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {m.icon} {m.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
