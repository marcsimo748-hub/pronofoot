"use client";

/**
 * ENREGISTREMENT DU SERVICE WORKER PWA (Mission 10).
 * HTTPS uniquement (ou localhost en dev). Silencieux en cas d'échec.
 */

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* échec silencieux : le site fonctionne sans PWA */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
