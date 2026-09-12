"use client";

/**
 * ClientTimeAgo — temps relatif (« il y a 5 min ») SANS erreur d'hydratation.
 *
 * ⚠️ Pourquoi ce composant existe :
 * Le serveur rend le HTML à l'instant T, le navigateur recalcule le texte à
 * T + quelques secondes. Si une frontière de minute est franchie entre les
 * deux, le texte diffère → React erreur #425/#418 (hydration mismatch).
 * Solution : ne rien rendre pendant le rendu serveur NI pendant l'hydratation,
 * afficher le libellé après le montage, puis le rafraîchir toutes les 30 s.
 */

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";

export function ClientTimeAgo({ date, prefix = "· " }: { date: string; prefix?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(timeAgo(date));
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [date]);

  if (label === null) return null;
  return <>{`${prefix}${label}`}</>;
}
