"use client";
// components/admin/SyncAfricanMatchesButton.tsx
// =====================================================================
// AJOUT PUR (aucune modification des fichiers existants).
// Bouton admin qui déclenche /api/admin/sync-african-matches et affiche
// le résumé de la dernière sync.
// =====================================================================

import { useState } from "react";
import { Globe2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface SyncResult {
  ok: boolean;
  total_fetched?: number;
  total_upserted?: number;
  failed_requests?: number;
  by_league?: Record<string, number>;
  errors?: string[];
}

export function SyncAfricanMatchesButton({
  className = "",
}: {
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sync-african-matches", {
        method: "POST",
      });
      const json = (await res.json()) as SyncResult & { error?: string };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
      } else {
        setResult(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-xl border bg-card p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-emerald-600" />
          <div>
            <div className="font-semibold">
              Synchroniser les matchs africains
            </div>
            <div className="text-xs text-muted-foreground">
              CAN · Qualifications CDM · Amicaux · J-1 → J+14 (ESPN)
            </div>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sync…
            </>
          ) : (
            <>
              <Globe2 className="h-4 w-4" />
              Lancer la sync
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {result.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            <span className="font-semibold">
              {result.ok ? "Sync terminée" : "Sync partielle"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            <div>
              <div className="font-mono text-base text-foreground">
                {result.total_fetched ?? 0}
              </div>
              <div>matchs trouvés</div>
            </div>
            <div>
              <div className="font-mono text-base text-foreground">
                {result.total_upserted ?? 0}
              </div>
              <div>upsertés</div>
            </div>
            <div>
              <div className="font-mono text-base text-foreground">
                {result.failed_requests ?? 0}
              </div>
              <div>échecs réseau</div>
            </div>
            <div>
              <div className="font-mono text-base text-foreground">
                {Object.keys(result.by_league ?? {}).length}
              </div>
              <div>ligues</div>
            </div>
          </div>
          {result.by_league && Object.keys(result.by_league).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(result.by_league).map(([league, n]) => (
                <span
                  key={league}
                  className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                >
                  {league} · {n}
                </span>
              ))}
            </div>
          )}
          {result.errors && result.errors.length > 0 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">
                {result.errors.length} avertissement(s)
              </summary>
              <ul className="ml-4 list-disc">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
