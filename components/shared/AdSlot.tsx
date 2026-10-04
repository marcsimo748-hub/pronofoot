"use client";
// components/shared/AdSlot.tsx
// =====================================================================
// Slot AdSense réutilisable. Si NEXT_PUBLIC_ADSENSE_CLIENT n'est pas
// configuré, le composant renvoie null (zéro impact visuel).
// =====================================================================

import { useEffect, useRef } from "react";

interface AdSlotProps {
  /** Identifiant unique du slot (au choix, fourni par Google AdSense) */
  slot: string;
  /** Format : "auto" (responsive), "rectangle" (300x250), "horizontal" (728x90) */
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({
  slot,
  format = "auto",
  className = "",
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // ignore silencieusement (AdSense pas encore chargé)
    }
  }, [client]);

  // Pas de credentials administrateur configurés → on n'affiche rien
  if (!client) return null;

  return (
    <div className={`my-6 flex justify-center ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{
          minWidth: format === "rectangle" ? "300px" : "0",
          minHeight: format === "rectangle" ? "250px" : "0",
          maxWidth: format === "horizontal" ? "728px" : "100%",
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}