"use client";

/**
 * PronoJobClient — moteur de recherche d'emploi du module PRONOJOB.
 * Filtres (recherche, ville, pays, contrat, télétravail, source), PronoScore,
 * pagination "Charger plus" et bouton "Postuler depuis Pronofoot"
 * (enregistre la candidature + ouvre l'offre originale).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "./JobCard";
import { AuthModal } from "@/components/auth/AuthModal";
import { setRedirectAfterLogin } from "@/lib/auth-redirect";
import { JobPrefsForm } from "./JobPrefsForm";
import type { PronoScoredJob, JobPrefs } from "@/lib/types";

const COUNTRIES = [
  "Allemagne", "France", "Royaume-Uni", "Autriche", "Suisse", "Pays-Bas",
  "Belgique", "Espagne", "Italie", "Luxembourg", "Pologne", "Portugal",
  "Irlande", "Télétravail", "Europe / Monde",
];

const CONTRACTS = [
  { v: "", label: "Tous" },
  { v: "full-time", label: "Temps plein" },
  { v: "part-time", label: "Temps partiel" },
  { v: "contract", label: "CDD / Mission" },
  { v: "internship", label: "Stage / Alternance" },
  { v: "freelance", label: "Freelance" },
];

const SOURCES = [
  { v: "", label: "Toutes" },
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
      setFlash("✅ Offre rouverte ! Bonne chance pour ta candidature 🍀");
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
    const t = setTimeout(() => fetchJobs(0, false, filters), 500);
    return () => clearTimeout(t);
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
      setFlash("💡 Offre ouverte ! Le suivi des candidatures sera actif après le script 004_prono_jobs.sql (Supabase).");
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
        setFlash("✅ Candidature enregistrée — retrouve-la dans ton dashboard !");
      } else if (json.code === "no_table") {
        setFlash("💡 Offre ouverte ! (suivi des candidatures actif après 004_prono_jobs.sql)");
      } else {
        setFlash("⚠️ Impossible d'enregistrer la candidature — l'offre reste ouverte.");
      }
    } catch {
      setFlash("⚠️ Réseau indisponible — l'offre reste ouverte.");
    }
  }

  /** Après sauvegarde du profil → recalcule les scores */
  function onPrefsSaved(prefs: JobPrefs) {
    fetchJobs(0, false, filters);
    setFlash("✨ PronoScore recalculé avec ton profil !");
  }

  const selectCls =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

  return (
    <div className="theme-job container space-y-6 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
            <Briefcase className="h-7 w-7 text-primary" /> PRONO Emploi
          </h1>
          <Badge variant="default" className="bg-primary/15 text-primary">NOUVEAU</Badge>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Agrégateur d&apos;offres d&apos;emploi <strong>100% légal</strong> — Allemagne, Europe et
          télétravail. Sources officielles : Arbeitnow, Remotive, Adzuna, JSearch (Indeed/LinkedIn).
          Ton <strong>PronoScore</strong> estime la compatibilité entre ton profil et chaque offre.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">{total.toLocaleString("fr-FR")} offres</Badge>
          <Badge variant="outline">
            {mode === "db" ? "📦 Cache actualisé toutes les 6 h" : "⚡ Lecture directe des API"}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">⚖️ Liens vers les sources originales</Badge>
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
          <SlidersHorizontal className="h-4 w-4" /> Filtres
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Métier, entreprise, mot-clé…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <Input
            placeholder="Ville (ex : Berlin)"
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
          />
          <select
            className={selectCls}
            value={filters.country}
            onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
          >
            <option value="">Tous les pays</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className={selectCls}
            value={filters.contract}
            onChange={(e) => setFilters((f) => ({ ...f, contract: e.target.value }))}
          >
            {CONTRACTS.map((c) => (
              <option key={c.v} value={c.v}>{`Contrat : ${c.label}`}</option>
            ))}
          </select>
          <select
            className={selectCls}
            value={filters.source}
            onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
          >
            {SOURCES.map((s) => (
              <option key={s.v} value={s.v}>{`Source : ${s.label}`}</option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 bg-background/50 px-3 py-2 text-sm">
            🌍 Télétravail uniquement
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={filters.remote}
              onChange={(e) => setFilters((f) => ({ ...f, remote: e.target.checked }))}
            />
          </label>
        </div>
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
          <p className="text-sm text-muted-foreground">
            Aucune offre ne correspond à ces filtres — essaie d&apos;élargir ta recherche.
          </p>
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
                {loading ? "Chargement…" : `Charger plus (${jobs.length}/${total})`}
              </Button>
            </div>
          )}
        </>
      )}

      {/* ===== Mention légale ===== */}
      <footer className="rounded-xl border border-white/5 bg-background/50 p-4 text-xs text-muted-foreground">
        ⚖️ <strong>Offres agrégées via les API officielles</strong> (Arbeitnow, Remotive, Adzuna,
        JSearch/RapidAPI). PRONO affiche uniquement le titre, un extrait court et le lien vers
        l&apos;offre originale, toute candidature se fait sur le site source. Ce service est
        fourni à titre informatif.
      </footer>

      {/* Modale connexion / inscription (postuler sans compte) */}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        message="Connecte-toi ou crée ton compte gratuit pour postuler, l'offre s'ouvrira automatiquement après."
      />
    </div>
  );
}
