"use client";

/**
 * ⚡ Outil 1 : Synchro + FOURNISSEURS DE DONNÉES.
 * Chaîne de secours automatique :
 *   1. API-Football (live + événements buteurs/cartons)
 *   2. football-data.org (nos 6 compétitions, gratuit à vie)
 *   3. ESPN (sans clé, toujours dispo)
 * Le premier qui répond sert la synchro ; en cas d'échec on bascule seul.
 * Section EMPLOI : Indeed via JSearch (RapidAPI) pour les offres d'emploi.
 * Les clés sont testées en direct avant enregistrement (prono_secrets, privée).
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Database, Gauge, KeyRound, ShieldCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminFetch } from "../adminShared";
import type { SiteSettings } from "@/lib/types";

type ProviderId = "api_sports" | "football_data" | "espn" | "rapidapi";

type ProviderStatus = {
  id: ProviderId;
  label: string;
  needsKey: boolean;
  dbKey?: string | null;
  envKey?: string | null;
  source: "admin" | "vercel" | "none" | "always";
};

type KeyTest = {
  httpStatus: number;
  ok: boolean;
  liveFixturesFound: number;
  errors: Record<string, string> | null;
  quotaRemaining: string | null;
};

type ProviderDef = { id: ProviderId; num: number; desc: string; keyHint?: string };

const PROVIDER_ORDER: ProviderDef[] = [
  { id: "api_sports", num: 1, desc: "Live + événements (buteurs, cartons). 100 req/jour gratuit.", keyHint: "dashboard.api-football.com" },
  { id: "football_data", num: 2, desc: "Nos 6 compétitions + classements. Gratuit à vie, 10 req/min.", keyHint: "www.football-data.org" },
  { id: "espn", num: 3, desc: "Secours sans clé — scores du jour. Toujours disponible, aucune inscription." },
];

const JOB_PROVIDER: ProviderDef = {
  id: "rapidapi",
  num: 0,
  desc: "Offres Indeed + LinkedIn agrégées (API JSearch). Le site l'appelle 2×/jour pour rester dans le quota gratuit (100 req/mois).",
  keyHint: "rapidapi.com → chercher « JSearch » → Subscribe (plan gratuit)",
};

export function ApiSyncTool({ settings }: { settings: SiteSettings }) {
  const [busy, setBusy] = useState(false);
  const [newsBusy, setNewsBusy] = useState(false);
  const sync = settings.sync_state;

  const [statuses, setStatuses] = useState<ProviderStatus[] | null>(null);
  const [keyInput, setKeyInput] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, KeyTest | null>>({});

  const loadStatuses = async () => {
    try {
      const data = await adminFetch<{ providers: ProviderStatus[] }>("/api/admin/provider-keys", undefined, "GET");
      setStatuses(data.providers);
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => {
    void loadStatuses();
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
              ? "Trop récente — le throttle protège le quota."
              : json.skipped === "all_providers_failed"
              ? "Aucun fournisseur n'a répondu — vérifie les clés ci-dessous."
              : undefined,
        });
      } else {
        const provider = json.data?.provider ? ` via ${json.data.provider}` : "";
        toast.success(`Synchro ${kind} terminée${provider} ✅`, {
          description: `${json.data?.synced ?? 0} live · ${json.data?.settled ?? 0} clôturés`,
        });
      }
    } catch {
      toast.error("Échec de la synchronisation.");
    } finally {
      kind === "scores" ? setBusy(false) : setNewsBusy(false);
    }
  }

  async function saveKey(provider: ProviderId) {
    const k = (keyInput[provider] ?? "").trim();
    if (!k) {
      toast.error("Colle d'abord la clé.");
      return;
    }
    setSaving(provider);
    setTests((t) => ({ ...t, [provider]: null }));
    try {
      const data = await adminFetch<{ saved: boolean; test: KeyTest | null }>("/api/admin/provider-keys", {
        provider,
        key: k,
      });
      setTests((t) => ({ ...t, [provider]: data.test }));
      if (data.test?.ok) {
        toast.success("Clé enregistrée et validée ✅", {
          description: `${data.test.liveFixturesFound} résultat(s) détecté(s)${data.test.quotaRemaining ? ` · quota : ${data.test.quotaRemaining}` : ""}`,
        });
      } else {
        toast.error("Clé refusée ❌", {
          description: data.test?.errors ? JSON.stringify(data.test.errors) : `HTTP ${data.test?.httpStatus}`,
        });
      }
      setKeyInput((i) => ({ ...i, [provider]: "" }));
      await loadStatuses();
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'enregistrement.");
    } finally {
      setSaving(null);
    }
  }

  async function testProvider(provider: ProviderId) {
    setSaving(provider);
    setTests((t) => ({ ...t, [provider]: null }));
    try {
      const data = await adminFetch<{ hasKey: boolean; test: KeyTest | null }>("/api/admin/provider-keys", {
        provider,
        test: true,
      });
      setTests((t) => ({ ...t, [provider]: data.test }));
      if (data.test?.ok) {
        toast.success("Fournisseur opérationnel ✅", {
          description: `${data.test.liveFixturesFound} résultat(s) détecté(s)`,
        });
      } else {
        toast.error("Ce fournisseur ne répond pas ❌", {
          description: data.test?.errors ? JSON.stringify(data.test.errors) : "Clé absente ou refusée.",
        });
      }
    } catch {
      toast.error("Échec du test.");
    } finally {
      setSaving(null);
    }
  }

  async function deleteKey(provider: ProviderId) {
    setSaving(provider);
    try {
      await adminFetch("/api/admin/provider-keys", { provider, key: "" });
      toast.success("Clé admin supprimée.");
      await loadStatuses();
    } catch {
      toast.error("Échec de la suppression.");
    } finally {
      setSaving(null);
    }
  }

  function renderCard(p: ProviderDef, opts: { showNum: boolean } = { showNum: true }) {
    const st = statuses?.find((s) => s.id === p.id);
    const test = tests[p.id];
    const isJob = p.id === "rapidapi";
    return (
      <div key={p.id} className="space-y-2 rounded-xl border border-white/10 bg-secondary/30 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {opts.showNum && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-xs font-black text-primary">
              {p.num}
            </span>
          )}
          {isJob && <Briefcase className="h-4 w-4 text-primary" />}
          <h4 className="text-sm font-bold">{st?.label ?? p.id}</h4>
          {p.id === "espn" ? (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3 w-3" /> sans clé
            </Badge>
          ) : (
            <Badge variant={st?.source === "admin" ? "default" : st?.source === "vercel" ? "secondary" : "destructive"}>
              {st?.source === "admin"
                ? `Clé Admin (${st.dbKey})`
                : st?.source === "vercel"
                ? `Clé Vercel (${st.envKey})`
                : "Aucune clé"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{p.desc}</p>
        {p.keyHint && <p className="text-[11px] text-muted-foreground/70">Créer une clé : {p.keyHint}</p>}
        <div className="flex flex-wrap gap-2">
          {p.id !== "espn" && (
            <Input
              type="password"
              placeholder="Coller la clé…"
              value={keyInput[p.id] ?? ""}
              onChange={(e) => setKeyInput((i) => ({ ...i, [p.id]: e.target.value }))}
              className="min-w-[200px] flex-1"
            />
          )}
          {p.id !== "espn" && (
            <Button size="sm" onClick={() => saveKey(p.id)} disabled={saving === p.id}>
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              {saving === p.id ? "Test…" : "💾 Enregistrer + tester"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => testProvider(p.id)} disabled={saving === p.id}>
            🧪 Tester
          </Button>
          {p.id !== "espn" && st?.source === "admin" && (
            <Button size="sm" variant="ghost" onClick={() => deleteKey(p.id)} disabled={saving === p.id}>
              🗑️
            </Button>
          )}
        </div>
        {test && (
          <div
            className={`rounded-lg border p-2.5 text-xs ${
              test.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"
            }`}
          >
            <p className="font-bold">
              {test.ok ? "✅ Opérationnel" : "❌ Problème"} — HTTP {test.httpStatus}
            </p>
            <p className="mt-0.5">
              Résultats détectés : <strong>{test.liveFixturesFound}</strong>
              {test.quotaRemaining ? <> · Quota : <strong>{test.quotaRemaining}</strong></> : null}
            </p>
            {test.errors && <p className="mt-1 font-mono text-[11px] opacity-80">{JSON.stringify(test.errors)}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Trois fournisseurs de données football se relaient <strong>automatiquement</strong> : si l&apos;un
        échoue (compte suspendu, quota, panne), la synchro bascule seule sur le suivant. Le
        premier qui répond sert les scores du site.
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

      {/* 🔑 LA CHAÎNE FOOTBALL (1-2-3) */}
      <div className="space-y-3">
        {PROVIDER_ORDER.map((p) => renderCard(p))}
      </div>

      {/* 💼 EMPLOI : Indeed via JSearch */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
          <Briefcase className="h-4 w-4" /> Offres d&apos;emploi
        </h3>
        {renderCard(JOB_PROVIDER, { showNum: false })}
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
          label="Quota API-Football restant"
          value={sync.requests_remaining !== null ? `${sync.requests_remaining} requêtes (au ${sync.requests_day ?? "?"})` : "inconnu"}
        />
        <InfoRow
          icon={<Database className="h-3.5 w-3.5" />}
          label="Classements en cache"
          value={Object.keys(settings.standings_cache.leagues).length ? `${Object.keys(settings.standings_cache.leagues).length} championnats` : "aucun"}
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
