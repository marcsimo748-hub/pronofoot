"use client";

/**
 * Module PRONO Visa — VERSION CLIENT (FR/EN/DE).
 * Le calcul est accessible sans compte ;
 * la sauvegarde des simulations et le pré-remplissage nécessitent une connexion.
 */

import { useEffect, useState } from "react";
import { VisaCalculator } from "@/components/pronovisa/VisaCalculator";
import { VisaArticles } from "@/components/pronovisa/VisaArticles";
import { VISA_DISCLAIMER_BY_LANG } from "@/components/pronovisa/visa-data";
import { useT, type Lang } from "@/lib/i18n";

export interface VisaCheckDTO {
  id: string;
  visa_type: string;
  score: number;
  created_at: string;
}

interface PrefillDTO {
  history: VisaCheckDTO[];
  prefill: Partial<Record<string, string>>;
}

export function VisaPageClient() {
  const { lang, t } = useT();
  const [history, setHistory] = useState<VisaCheckDTO[]>([]);
  const [prefill, setPrefill] = useState<Partial<Record<string, string>>>({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/prono-visa/prefill", { cache: "no-store" });
        const json: { ok: boolean; data?: PrefillDTO } = await res.json();
        if (cancelled) return;
        if (json.ok && json.data) {
          setHistory(json.data.history ?? []);
          setPrefill(json.data.prefill ?? {});
          setLoggedIn(true);
        }
      } catch {
        /* hors-ligne : OK, on affiche le calculateur vide */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="theme-visa container space-y-10 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">🛂 PRONO Visa</h1>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {t("visa.badge")}
          </span>
        </div>
        <p className="max-w-2xl text-muted-foreground">{t("visa.intro")}</p>
      </header>

      {/* ===== Calculateur ===== */}
      {loaded ? (
        <VisaCalculator loggedIn={loggedIn} prefill={prefill as never} history={history} />
      ) : (
        <div className="rounded-xl border border-white/5 bg-card/70 p-6 text-center text-sm text-muted-foreground">
          ⏳ {loadingText(lang)}
        </div>
      )}

      {/* ===== Guides ===== */}
      <VisaArticles />

      {/* ===== Disclaimer permanent ===== */}
      <footer className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        {VISA_DISCLAIMER_BY_LANG[lang] ?? VISA_DISCLAIMER_BY_LANG.fr}
      </footer>
    </div>
  );
}

function loadingText(lang: Lang): string {
  return lang === "en" ? "Loading…" : lang === "de" ? "Lädt…" : "Chargement…";
}
