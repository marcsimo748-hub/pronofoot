"use client";

/**
 * SiteBackground — fond d'écran plein écran, rotatif et automatique.
 *
 * • Chaque page a son dossier de photos (public/backgrounds/<page>/).
 * • Le fond change tout seul toutes les 2 heures (même image pour tous les
 *   visiteurs), et se met à jour sans recharger la page.
 * • Si l'admin a défini un fond personnalisé (Admin > Fonds d'Écran), ce
 *   réglage PRIME sur la rotation automatique.
 * • Rendu uniquement après montage : aucune erreur d'hydratation React.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PAGE_BACKGROUNDS, backgroundSlot } from "@/lib/backgrounds";

export function SiteBackground({
  /** Forcer la page (ex.: "login" pour toutes les pages d'authentification) */
  forcePage,
  /** Fonds personnalisés définis par l'admin, par clé de page */
  overrides,
}: {
  forcePage?: string;
  overrides?: Record<string, string>;
}) {
  const pathname = usePathname() ?? "/";
  const page = forcePage ?? pageKeyOf(pathname);
  const list = PAGE_BACKGROUNDS[page] ?? [];
  const [mounted, setMounted] = useState(false);
  const [slot, setSlot] = useState(0);

  useEffect(() => {
    setMounted(true);
    setSlot(backgroundSlot(Math.max(list.length, 1)));
    // Vérification chaque minute : le fond change tout seul au bout de 2 h
    const timer = setInterval(() => setSlot(backgroundSlot(Math.max(list.length, 1))), 60_000);
    return () => clearInterval(timer);
  }, [list.length]);

  if (!mounted) return null;

  // Priorité : réglage admin > rotation automatique
  const override = overrides?.[page];
  const src = override || list[slot % list.length];
  if (!src) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        className="h-full w-full object-cover opacity-0 transition-opacity duration-700"
        onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
      />
      {/* Voile sombre pour garder le texte parfaitement lisible */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/90 to-background/95" />
    </div>
  );
}

function pageKeyOf(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  const first = pathname.split("/").filter(Boolean)[0] ?? "home";
  if (first === "admin") return "dashboard";
  // Pages sans dossier dédiée (ex : modules /prono-job) → fond par défaut du site
  return PAGE_BACKGROUNDS[first] ? first : "home";
}
