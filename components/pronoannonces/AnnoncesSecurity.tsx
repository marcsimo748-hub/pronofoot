"use client";

/**
 * Section Sécurité & respect de /prono-annonces — traduite (FR/EN/DE).
 */

import { useT } from "@/lib/i18n";

export function AnnoncesSecurity() {
  const { t } = useT();
  return (
    <section className="glass rounded-2xl p-5 text-sm text-muted-foreground">
      <p className="mb-2 flex items-center gap-2 font-bold text-amber-400">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15">🛡️</span>
        {t("ann.secTitle")}
      </p>
      <ul className="grid gap-1.5 text-xs leading-relaxed sm:grid-cols-2">
        <li>• {t("ann.sec1")}</li>
        <li>• {t("ann.sec2")}</li>
        <li>• {t("ann.sec3")}</li>
        <li>• {t("ann.sec4")}</li>
      </ul>
    </section>
  );
}
