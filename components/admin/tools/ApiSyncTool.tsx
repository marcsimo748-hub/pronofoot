"use client";

/**
 * ⚡ Outil 1 : Synchro API-Sports.
 * • Déclenchement manuel des synchros (scores / news)
 * • 🔑 Gestion de la clé API-FOOTBALL : saisie dans l'Admin (prono_secrets,
 *   privée) qui PRIME sur la variable Vercel — test en direct avant enregistrement.
 * • État du quota et des derniers sync.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Database, Gauge, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminFetch } from "../adminShared";
import type { SiteSettings } from "@/lib/types";

type KeyStatus = {
  dbKey: string | null;
  envKey: string | null;
  source: "admin" | "vercel" | "none";
  hasKey: boolean;
};

type KeyTest = {
  httpStatus: number;
  ok: boolean;
  liveFixturesFound: number;
  errors: Record<string, string> | null;
  quotaRemaining: string | null;
};

export function ApiSyncTool({ settings }: { settings: SiteSettings }) {
  const [busy, setBusy] = useState(false);
  const [newsBusy, setNewsBusy] = useState(false);
  const sync = settings.sync_state;

  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [testResult, setTestResult] = useState<KeyTest | null>(null);

  const loadKeyStatus = async () => {
    try {
      setKeyStatus(await adminFetch<KeyStatus>("/api/admin/api-sports-key", undefined, "GET"));
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => {
    void loadKeyStatus();
  }, []);

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
              ? "Ajoute la clé API-Sports ci-dessous (ou API_SPORTS_KEY chez Vercel)."
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

  async function saveKey() {
    const k = keyInput.trim();
    if (!k) {
      toast.error("Colle d'abord la clé API-Sports.");
      return;
    }
    setSavingKey(true);
    setTestResult(null);
    try {
      const data = await adminFetch<{ saved: boolean; test: KeyTest | null }>("/api/admin/api-sports-key", { key: k });
      setTestResult(data.test);
      if (data.test?.ok) {
        toast.success("Clé API-Sports enregistrée et validée ✅", {
          description: `${data.test.liveFixturesFound} match(s) live détecté(s) en ce moment · quota restant : ${data.test.quotaRemaining ?? "?"}`,
        });
      } else {
        toast.error("Clé refusée par API-Sports ❌", {
          description: data.test?.errors ? JSON.stringify(data.test.errors) : `HTTP ${data.test?.httpStatus}`,
        });
      }
      setKeyInput("");
      await loadKeyStatus();
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'enregistrement de la clé.");
    } finally {
      setSavingKey(false);
    }
  }

  async function deleteKey() {
    setSavingKey(true);
    try {
      await adminFetch("/api/admin/api-sports-key", { key: "" });
      toast.success("Clé admin supprimée — retour à la clé Vercel (si présente).");
      await loadKeyStatus();
    } catch {
      toast.error("Échec de la suppression.");
    } finally {
      setSavingKey(false);
    }
  }

  async function testCurrentKey() {
    setSavingKey(true);
    setTestResult(null);
    try {
      const data = await adminFetch<{ hasKey: boolean; test: KeyTest | null }>("/api/admin/api-sports-key", { test: true });
      setTestResult(data.test);
      if (data.test?.ok) {
        toast.success("Clé valide ✅", {
          description: `${data.test.liveFixturesFound} match(s) live détecté(s) · quota restant : ${data.test.quotaRemaining ?? "?"}`,
        });
      } else {
        toast.error("La clé active ne fonctionne pas ❌", {
          description: data.test?.errors ? JSON.stringify(data.test.errors) : "Clé absente ou refusée.",
        });
      }
    } catch {
      toast.error("Échec du test.");
    } finally {
      setSavingKey(false);
    }
  }

  return (
    <div className="space-y-5">
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

      {/* 🔑 GESTION DE LA CLÉ API-SPORTS */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-secondary/30 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold">Clé API-Football</h4>
          <Badge variant={keyStatus?.source === "admin" ? "default" : keyStatus?.source === "vercel" ? "secondary" : "destructive"}>
            {keyStatus?.source === "admin"
              ? `Active : Admin (${keyStatus.dbKey})`
              : keyStatus?.source === "vercel"
              ? `Active : Vercel (${keyStatus.envKey})`
              : "Aucune clé configurée"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Colle ici ta clé API-Sports (dashboard.api-football.com) : elle est stockée dans la table
          privée <span className="font-mono">prono_secrets</span> et <strong>prime sur la variable
          Vercel</strong>. Elle est testée en direct avant enregistrement — une clé refusée
          (compte suspendu, faute de frappe) n'est jamais sauvegardée.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            type="password"
            placeholder="Nouvelle clé API-Sports…"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="min-w-[220px] flex-1"
          />
          <Button onClick={saveKey} disabled={savingKey} className="gap-2">
            {savingKey ? "Test en cours…" : "💾 Enregistrer + tester"}
          </Button>
          <Button onClick={testCurrentKey} disabled={savingKey} variant="outline" className="gap-2">
            🧪 Tester la clé active
          </Button>
          {keyStatus?.source === "admin" && (
            <Button onClick={deleteKey} disabled={savingKey} variant="ghost" className="gap-2">
              🗑️ Supprimer la clé admin
            </Button>
          )}
        </div>
        {testResult && (
          <div
            className={`rounded-lg border p-3 text-xs ${
              testResult.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"
            }`}
          >
            <p className="font-bold">
              {testResult.ok ? "✅ Clé fonctionnelle" : "❌ Problème avec la clé"} — HTTP {testResult.httpStatus}
            </p>
            <p className="mt-1">
              Matchs live détectés à l'instant : <strong>{testResult.liveFixturesFound}</strong> · Quota restant :{" "}
              <strong>{testResult.quotaRemaining ?? "?"}</strong>
            </p>
            {testResult.errors && (
              <p className="mt-1 font-mono text-[11px] opacity-80">{JSON.stringify(testResult.errors)}</p>
            )}
          </div>
        )}
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
