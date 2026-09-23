"use client";

/**
 * PronoJobClient — moteur de recherche d'emploi du module PRONOJOB (FR/EN/DE).
 * Filtres (recherche, ville, pays, contrat, télétravail, source), PronoScore,
 * pagination "Charger plus" et bouton "Postuler depuis Pronofoot"
 * (enregistre la candidature + ouvre l'offre originale).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BannerRotator } from "@/components/shared/BannerRotator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "./JobCard";
import { AuthModal } from "@/components/auth/AuthModal";
import { setRedirectAfterLogin } from "@/lib/auth-redirect";
import { JobPrefsForm } from "./JobPrefsForm";
import { useT, type Lang } from "@/lib/i18n";
import type { PronoScoredJob, JobPrefs } from "@/lib/types";

// Valeurs envoyées à l'API (inchangées) + clé de traduction pour l'affichage
const COUNTRIES: { v: string; key: "job.co.Allemagne" | "job.co.France" | "job.co.Royaume-Uni" | "job.co.Autriche" | "job.co.Suisse" | "job.co.Pays-Bas" | "job.co.Belgique" | "job.co.Espagne" | "job.co.Italie" | "job.co.Luxembourg" | "job.co.Pologne" | "job.co.Portugal" | "job.co.Irlande" | "job.co.Télétravail" | "job.co.Europe / Monde" }[] = [
  { v: "Allemagne", key: "job.co.Allemagne" },
  { v: "France", key: "job.co.France" },
  { v: "Royaume-Uni", key: "job.co.Royaume-Uni" },
  { v: "Autriche", key: "job.co.Autriche" },
  { v: "Suisse", key: "job.co.Suisse" },
  { v: "Pays-Bas", key: "job.co.Pays-Bas" },
  { v: "Belgique", key: "job.co.Belgique" },
  { v: "Espagne", key: "job.co.Espagne" },
  { v: "Italie", key: "job.co.Italie" },
  { v: "Luxembourg", key: "job.co.Luxembourg" },
  { v: "Pologne", key: "job.co.Pologne" },
  { v: "Portugal", key: "job.co.Portugal" },
  { v: "Irlande", key: "job.co.Irlande" },
  { v: "Télétravail", key: "job.co.Télétravail" },
  { v: "Europe / Monde", key: "job.co.Europe / Monde" },
];

const CONTRACTS = [
  { v: "", key: "job.cAll" },
  { v: "full-time", key: "job.cFull" },
  { v: "part-time", key: "job.cPart" },
  { v: "contract", key: "job.cCdd" },
  { v: "internship", key: "job.cIntern" },
  { v: "freelance", key: "job.cFree" },
] as const;

const SOURCES = [
  { v: "", key: "job.sAll" },
  { v: "arbeitnow", label: "Arbeitnow 🇩🇪" },
  { v: "remotive", label: "Remotive 🌍" },
  { v: "adzuna", label: "Adzuna 🌐" },
  { v: "jsearch", label: "Indeed/LinkedIn ↗" },
];

interface Filters {
  q: string;
  city: string;
  country: string;
  contract: string;
  remote: boolean;
  source: string;
}

export function PronoJobClient({
  initial,
  initialPrefs,
  appliedJobIds,
  loggedIn,
  dbReady,
  autoApply,
}: {
  initial: { jobs: PronoScoredJob[]; total: number; mode: "db" | "live" };
  initialPrefs: JobPrefs | null;
  appliedJobIds: string[];
  loggedIn: boolean;
  dbReady: boolean;
  /** Arrive de redirectAfterLogin : rouvrir l'offre exacte cliquée avant connexion */
  autoApply?: boolean;
}) {
  const { lang, t } = useT();
  const locale = lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "fr-FR";
  const [jobs, setJobs] = useState<PronoScoredJob[]>(initial.jobs);
  const [total, setTotal] = useState(initial.total);
  const [mode, setMode] = useState(initial.mode);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set(appliedJobIds));
  const [flash, setFlash] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    q: "", city: "", country: "", contract: "", remote: false, source: "",
  });
  const reqId = useRef(0);

  /** Appelle l'API (page 0 = recherche, page>0 = "charger plus") */
  const fetchJobs = useCallback(
    async (targetPage: number, append: boolean, f: Filters) => {
      const id = ++reqId.current;
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(targetPage) });
        if (f.q) params.set("q", f.q);
        if (f.city) params.set("city", f.city);
        if (f.country) params.set("country", f.country);
        if (f.contract) params.set("contract", f.contract);
        if (f.remote) params.set("remote", "1");
        if (f.source) params.set("source", f.source);

        const res = await fetch(`/api/prono-jobs?${params.toString()}`);
        const json = await res.json();
        if (id !== reqId.current) return; // réponse obsolète
        if (json.ok) {
          setJobs((prev) => (append ? [...prev, ...json.data.jobs] : json.data.jobs));
          setTotal(json.data.total);
          setMode(json.data.mode);
          setPage(targetPage);
        }
      } catch {
        /* réseau — on garde l'affichage courant */
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    []
  );

  // Deep link après connexion : rouvrir l'offre exacte cliquée (?postuler=1)
  useEffect(() => {
    if (!autoApply) return;
    try {
      const raw = sessionStorage.getItem("prono-pending-job");
      if (!raw) return;
      sessionStorage.removeItem("prono-pending-job");
      const job = JSON.parse(raw) as PronoScoredJob;
      window.open(job.url, "_blank", "noopener,noreferrer");
      setFlash(t("job.flashReopened"));
      if (dbReady) {
        void fetch("/api/prono-jobs/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job }),
        })
          .then((r) => r.json())
          .then((json) => {
            if (json.ok) setApplied((s) => new Set(s).add(job.id));
          })
          .catch(() => {});
      }
    } catch {
      /* offre mémorisée illisible, on ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApply]);

  // Recherche automatique (debounce 500 ms) à chaque changement de filtre
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const tm = setTimeout(() => fetchJobs(0, false, filters), 500);
    return () => clearTimeout(tm);
  }, [filters, fetchJobs]);

  /** "Postuler depuis PRONO" : modale si non connecté, puis enregistre et ouvre l'offre */
  async function onApply(job: PronoScoredJob) {
    if (!loggedIn) {
      // Mémorise l'offre exacte : elle sera rouverte automatiquement après connexion
      try { sessionStorage.setItem("prono-pending-job", JSON.stringify(job)); } catch {}
      setRedirectAfterLogin("/prono-job?postuler=1");
      setAuthOpen(true);
      return;
    }

    // Toujours ouvrir l'offre originale (le candidat postule chez la source)
    window.open(job.url, "_blank", "noopener,noreferrer");

    if (!dbReady) {
      setFlash(t("job.flashNoFollow"));
      return;
    }
    try {
      const res = await fetch("/api/prono-jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });
      const json = await res.json();
      if (json.ok) {
        setApplied((s) => new Set(s).add(job.id));
        setFlash(t("job.flashSaved"));
      } else if (json.code === "no_table") {
        setFlash(t("job.flashNoFollow"));
      } else {
        setFlash(t("job.flashErr"));
      }
    } catch {
      setFlash(t("job.flashNet"));
    }
  }

  /** Après sauvegarde du profil → recalcule les scores */
  function onPrefsSaved(prefs: JobPrefs) {
    void prefs;
    fetchJobs(0, false, filters);
    setFlash(t("job.flashPrefs"));
  }

  const selectCls =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

  return (
    <div className="theme-job container space-y-6 py-8">
      <BannerRotator
        images={["/banners/job/01.jpg", "/banners/job/02.jpg", "/banners/job/03.jpg", "/banners/job/04.jpg", "/banners/job/05.jpg"]}
        title={t("job.bannerTitle")}
        subtitle={t("job.bannerSub")}
      />
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
            <Briefcase className="h-7 w-7 text-primary" /> PRONO {t("job.h1")}
          </h1>
          <Badge variant="default" className="bg-primary/15 text-primary">{t("job.new")}</Badge>
        </div>
        <p className="max-w-2xl text-muted-foreground">{t("job.intro")}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">{total.toLocaleString(locale)} {t("job.offers")}</Badge>
          <Badge variant="outline">
            {mode === "db" ? t("job.cache") : t("job.live")}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">{t("job.links")}</Badge>
        </div>
      </header>

      {/* Message d'action (postuler, profil…) */}
      {flash && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
          {flash}
        </div>
      )}

      {/* ===== Profil emploi (PronoScore) ===== */}
      <JobPrefsForm
        prefs={initialPrefs}
        loggedIn={loggedIn}
        dbReady={dbReady}
        onSaved={onPrefsSaved}
      />

      {/* ===== Filtres ===== */}
      <div className="rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" /> {t("job.filters")}
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("job.searchPh")}
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <Input
            placeholder={t("job.cityPh")}
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
          />
          <select
            className={selectCls}
            value={filters.country}
            onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
          >
            <option value="">{t("job.allCountries")}</option>
            {COUNTRIES.map((c) => (
              <option key={c.v} value={c.v}>{t(c.key)}</option>
            ))}
          </select>
          <select
            className={selectCls}
            value={filters.contract}
            onChange={(e) => setFilters((f) => ({ ...f, contract: e.target.value }))}
          >
            {CONTRACTS.map((c) => (
              <option key={c.v} value={c.v}>{`${t("job.contractWord")} : ${t(c.key)}`}</option>
            ))}
          </select>
          <select
            className={selectCls}
            value={filters.source}
            onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
          >
            {SOURCES.map((s) => (
              <option key={s.v} value={s.v}>{`${t("job.sourceWord")} : ${("key" in s && s.key) ? t(s.key as "job.sAll") : s.label}`}</option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 bg-background/50 px-3 py-2 text-sm">
            {t("job.remoteOnly")}
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={filters.remote}
              onChange={(e) => setFilters((f) => ({ ...f, remote: e.target.checked }))}
            />
          </label>
        </div>

        {/* Pastille de réinitialisation : visible dès qu'un filtre est actif */}
        {(filters.q || filters.city || filters.country || filters.contract || filters.source || filters.remote) && (
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{t("job.filtersOn")}</span>
            <button
              type="button"
              onClick={() => setFilters({ q: "", city: "", country: "", contract: "", remote: false, source: "" })}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              {t("job.reset")}
            </button>
          </div>
        )}
      </div>

      {/* ===== Résultats ===== */}
      {loading && jobs.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-white/5 bg-card/70 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-44" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">{t("job.empty")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job, i) => (
              <JobCard
                key={`${job.source}-${job.source_id}`}
                job={job}
                applied={applied.has(job.id)}
                onApply={onApply}
                index={i % 20}
              />
            ))}
          </div>
          {jobs.length < total && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => fetchJobs(page + 1, true, filters)}
              >
                {loading ? t("job.loading") : `${t("job.more")} (${jobs.length}/${total})`}
              </Button>
            </div>
          )}
        </>
      )}

      {/* ===== Mention légale ===== */}
      <footer className="rounded-xl border border-white/5 bg-background/50 p-4 text-xs text-muted-foreground">
        {t("job.legal")}
      </footer>

      {/* Modale connexion / inscription (postuler sans compte) */}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        message={t("job.authMsg")}
      />
    </div>
  );
}
