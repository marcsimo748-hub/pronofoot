"use client";

/**
 * JobCard — carte d'une offre d'emploi PRONOJOB.
 * Affiche : titre + entreprise + lieu, badges (télétravail, contrat, source),
 * PronoScore (si profil renseigné), extrait court, bouton "Postuler depuis Pronofoot".
 * ⚖️ Conformité : titre + extrait court + lien vers la source originale uniquement.
 */

import { motion } from "framer-motion";
import { MapPin, Building2, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PronoScoredJob } from "@/lib/types";

const CONTRACT_LABELS: Record<string, string> = {
  "full-time": "Temps plein",
  "part-time": "Temps partiel",
  contract: "CDD / Mission",
  internship: "Stage / Alternance",
  freelance: "Freelance",
  other: "Autre",
};

const SOURCE_LABELS: Record<string, string> = {
  arbeitnow: "Arbeitnow 🇩🇪",
  remotive: "Remotive 🌍",
  adzuna: "Adzuna 🌐",
  jsearch: "Indeed/LinkedIn ↗",
};

/** "il y a 3 j" — affichage compact, calculé côté client uniquement */
export function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0 || Number.isNaN(ms)) return "";
  const min = Math.floor(ms / 60000);
  if (min < 60) return `il y a ${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 31) return `il y a ${d} j`;
  return `il y a ${Math.floor(d / 7)} sem.`;
}

export function JobCard({
  job,
  applied,
  onApply,
  index = 0,
}: {
  job: PronoScoredJob;
  applied: boolean;
  onApply: (job: PronoScoredJob) => void;
  index?: number;
}) {
  // Couleur du PronoScore
  const scoreColor =
    job.score === null
      ? "bg-secondary text-muted-foreground"
      : job.score >= 70
        ? "bg-green-500/15 text-green-400 border-green-500/30"
        : job.score >= 45
          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
          : "bg-secondary text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm transition-colors hover:border-primary/30"
    >
      {/* En-tête : titre + score */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold leading-tight" title={job.title}>
            {job.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            {job.company || "Entreprise"}
            {job.city && (
              <>
                <MapPin className="ml-1 h-3.5 w-3.5 shrink-0" />
                {job.city}
              </>
            )}
          </p>
        </div>
        <div
          className={`shrink-0 rounded-lg border px-2.5 py-1 text-center ${scoreColor}`}
          title={job.reasons.length ? `Pourquoi ce score : ${job.reasons.join(" • ")}` : "Remplis ton profil emploi pour activer le PronoScore"}
        >
          <span className="block text-sm font-black tabular-nums leading-none">
            {job.score === null ? "—" : `${job.score}%`}
          </span>
          <span className="block text-[9px] font-medium uppercase tracking-wide opacity-80">Score</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {job.remote && <Badge variant="outline" className="gap-1 border-green-500/30 text-green-400">🌍 Télétravail</Badge>}
        <Badge variant="secondary">{CONTRACT_LABELS[job.contract_type] ?? "Autre"}</Badge>
        {job.country && <Badge variant="outline">{job.country}</Badge>}
        <Badge variant="outline" className="text-muted-foreground">{SOURCE_LABELS[job.source] ?? job.source}</Badge>
        {job.published_at && (
          <span className="self-center text-[11px] text-muted-foreground">{timeAgo(job.published_at)}</span>
        )}
      </div>

      {/* Extrait court (conformité : jamais la description complète) */}
      {job.description_short && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{job.description_short}</p>
      )}

      {/* Actions */}
      <div className="mt-auto flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={applied ? "secondary" : "default"}
          className={applied ? "gap-1.5 text-green-400" : "gap-1.5"}
          onClick={() => onApply(job)}
        >
          {applied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Postulée
            </>
          ) : (
            <>🚀 Postuler depuis PRONO</>
          )}
        </Button>
        <a href={job.url} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="gap-1.5">
            Voir l&apos;offre <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>
    </motion.div>
  );
}
