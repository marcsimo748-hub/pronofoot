"use client";

/**
 * COOKIE-BANNER conforme (Allemagne) : uniquement des cookies TECHNIQUES.
 * Choix mémorisé en localStorage, aucun blocage du site si refus
 * (aucun cookie non technique n'est utilisé de toute façon).
 * Disponible en FR / EN / DE.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const COOKIE_CHOICE = "prono-cookies-ok";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { t } = useT();

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_CHOICE)) setVisible(true);
    } catch {
      /* stockage indisponible : on n'embête pas le visiteur */
    }
  }, []);

  const choose = (ok: boolean) => {
    try {
      localStorage.setItem(COOKIE_CHOICE, ok ? "1" : "0");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-background/95 p-4 backdrop-blur-xl md:inset-x-auto md:bottom-4 md:left-4 md:max-w-sm md:rounded-xl md:border">
      <p className="text-sm font-semibold">🍪 Cookies</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {t("cookies.text")}
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="glow" className="flex-1" onClick={() => choose(true)}>
          {t("cookies.accept")}
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => choose(false)}>
          {t("cookies.decline")}
        </Button>
      </div>
    </div>
  );
}
