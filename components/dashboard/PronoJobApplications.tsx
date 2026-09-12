"use client";

/**
 * PronoJobApplications — section "Mes candidatures" du dashboard.
 * Charge les candidatures PronoJob enregistrées via /api/prono-jobs/apply.
 * S'affiche uniquement s'il y a des candidatures (aucun changement visuel sinon).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { JobApplication } from "@/lib/types";

export function PronoJobApplications() {
  const [apps, setApps] = useState<JobApplication[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/prono-jobs/apply")
      .then((r) => r.json())
      .then((json) => {
        if (alive && json.ok && Array.isArray(json.data) && json.data.length > 0) {
          setApps(json.data);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Rien à afficher (pas connecté, tables absentes ou zéro candidature) → invisible
  if (!apps) return null;

  return (
    <section className="rounded-xl border bg-card/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold">💼 Mes candidatures PronoJob</h3>
        <Badge variant="secondary">{apps.length}</Badge>
      </div>
      <div className="space-y-2">
        {apps.slice(0, 8).map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-background/40 p-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{a.job?.title ?? "Offre supprimée"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {a.job?.company}
                {a.job?.city ? ` · ${a.job.city}` : ""}
                {a.job?.remote ? " · 🌍" : ""} ·{" "}
                {new Date(a.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            {a.job?.url ? (
              <a
                href={a.job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                title="Ouvrir l'offre"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        ))}
      </div>
      <Link
        href="/prono-job"
        className="mt-3 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
      >
        Chercher d&apos;autres offres →
      </Link>
    </section>
  );
}
