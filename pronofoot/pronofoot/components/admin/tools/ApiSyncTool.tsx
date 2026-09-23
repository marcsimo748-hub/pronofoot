"use client";

/** ⚡ Outil 1 : Synchro API-Sports (scores + matchs + classements + quota) */

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Database, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "../adminShared";
import type { SiteSettings } from "@/lib/types";

export function ApiSyncTool({ settings }: { settings: SiteSettings }) {
  const [busy, setBusy] = useState(false);
  const [newsBusy, setNewsBusy] = useState(false);
  const sync = settings.sync_state;

  async function runSync(kind: "scores" | "news") {
    kind === "scores" ? setBusy(true) : setNewsBusy(true);
    try {
      const res = await fetch(`/api/${kind}/sync`, { method: "POST" });
      const json = await res.json();
      if (json.skipped) {
        toast.info(`Synchronisation ${kind} ignorée : ${json.skipped}`, {
          description:
            json.skipped === "throttled"
              ? "Trop récente — le throttle protège le quota de l'API."
              : json.skipped === "no_api_key"
              ? "Ajoute API_SPORTS_KEY (ou GNEWS_API_KEY) dans les variables d'environnement."
              : undefined,
        });
      } else {
        toast.success(`Synchro ${kind} terminée ✅`, { description: JSON.stringify(json) });
      }
    } catch {
      toast.error("Échec de la synchronisation.");
    } finally {
      kind === "scores" ? setBusy(false) : setNewsBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Déclenche manuellement la synchronisation serveur. En temps normal, tout est automatique
        (SyncManager côté client toutes les 90 s / 10 min + crons configurés).
      </p>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => runSync("scores")} disabled={busy} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Synchronisation…" : "Synchro scores + matchs"}
        </Button>
        <Button onClick={() => runSync("news")} disabled={newsBusy} variant="secondary" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${newsBusy ? "animate-spin" : ""}`} />
          Synchro news
        </Button>
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <InfoRow
          icon={<Database className="h-3.5 w-3.5" />}
          label="Dernière synchro scores"
          value={sync.last_scores_sync ? new Date(sync.last_scores_sync).toLocaleString("fr-FR") : "jamais"}
        />
        <InfoRow
          icon={<Database className="h-3.5 w-3.5" />}
          label="Dernière synchro news"
          value={sync.last_news_sync ? new Date(sync.last_news_sync).toLocaleString("fr-FR") : "jamais"}
        />
        <InfoRow
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Quota API-Sports restant"
          value={sync.requests_remaining !== null ? `${sync.requests_remaining} requêtes (au ${sync.requests_day ?? "?"})` : "inconnu (aucun appel encore effectué)"}
        />
        <InfoRow
          icon={<Database className="h-3.5 w-3.5" />}
          label="Classements en cache"
          value={Object.keys(settings.standings_cache.leagues).length ? `${Object.keys(settings.standings_cache.leagues).length} championnats (${settings.standings_cache.updated_at ? new Date(settings.standings_cache.updated_at).toLocaleTimeString("fr-FR") : "?"})` : "aucun"}
        />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-3 py-2">
      <span className="flex items-center gap-1.5 text-muted-foreground">{icon} {label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
