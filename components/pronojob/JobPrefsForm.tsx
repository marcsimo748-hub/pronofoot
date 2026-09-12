"use client";

/**
 * JobPrefsForm — "Mon profil emploi" (alimente le PronoScore).
 * Mots-clés métier, ville souhaitée, télétravail, niveau d'allemand/anglais,
 * type de contrat. Sauvegardé dans prono_job_prefs (RLS : propriétaire).
 */

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { JobPrefs } from "@/lib/types";

const LEVELS = [
  { v: "none", label: "Aucun" },
  { v: "A1", label: "A1 — Débutant" },
  { v: "A2", label: "A2 — Élémentaire" },
  { v: "B1", label: "B1 — Intermédiaire" },
  { v: "B2", label: "B2 — Avancé" },
  { v: "C1", label: "C1 — Autonome" },
  { v: "C2", label: "C2 — Maîtrise" },
];

const CONTRACTS = [
  { v: "", label: "Tous les contrats" },
  { v: "full-time", label: "Temps plein" },
  { v: "part-time", label: "Temps partiel" },
  { v: "contract", label: "CDD / Mission" },
  { v: "internship", label: "Stage / Alternance" },
  { v: "freelance", label: "Freelance" },
];

export function JobPrefsForm({
  prefs,
  loggedIn,
  dbReady,
  onSaved,
}: {
  prefs: JobPrefs | null;
  loggedIn: boolean;
  dbReady: boolean;
  onSaved: (prefs: JobPrefs) => void;
}) {
  const [open, setOpen] = useState(!prefs); // ouvert par défaut si pas encore de profil
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<JobPrefs>(
    prefs ?? {
      keywords: "",
      city: "",
      remote_only: false,
      german_level: "none",
      english_level: "none",
      contract: "",
    }
  );

  const set = <K extends keyof JobPrefs>(key: K, value: JobPrefs[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (!loggedIn) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/prono-jobs/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.ok) {
        onSaved(form);
        setMessage("✅ Profil enregistré — PronoScore mis à jour !");
      } else if (json.code === "no_table") {
        setMessage("⚠️ Les tables ne sont pas encore créées — exécute 004_prono_jobs.sql dans Supabase.");
      } else {
        setMessage("❌ Erreur d'enregistrement, réessaie.");
      }
    } catch {
      setMessage("❌ Connexion impossible, réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm">
      <button
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          Mon profil emploi
          <span className="text-xs font-normal text-muted-foreground">
            — active ton PronoScore personnalisé
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {!loggedIn ? (
            <p className="rounded-lg bg-secondary/50 p-3 text-sm">
              🔐{" "}
              <Link href="/login" className="font-medium text-primary underline underline-offset-2">
                Connecte-toi
              </Link>{" "}
              pour enregistrer ton profil emploi et suivre tes candidatures.
            </p>
          ) : !dbReady ? (
            <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-400">
              💾 Module en mode lecture seule : exécute le script{" "}
              <code className="rounded bg-black/30 px-1">004_prono_jobs.sql</code> dans Supabase
              (SQL Editor) pour activer le PronoScore personnalisé et le suivi des candidatures.
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jp-keywords">Métiers / mots-clés</Label>
              <Input
                id="jp-keywords"
                placeholder="Ex : chauffeur, cuisine, logistique, développeur…"
                value={form.keywords}
                onChange={(e) => set("keywords", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jp-city">Ville souhaitée</Label>
              <Input
                id="jp-city"
                placeholder="Ex : Berlin"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jp-german">Niveau d&apos;allemand</Label>
              <select
                id="jp-german"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.german_level}
                onChange={(e) => set("german_level", e.target.value)}
              >
                {LEVELS.map((l) => (
                  <option key={l.v} value={l.v}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jp-english">Niveau d&apos;anglais</Label>
              <select
                id="jp-english"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.english_level}
                onChange={(e) => set("english_level", e.target.value)}
              >
                {LEVELS.map((l) => (
                  <option key={l.v} value={l.v}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jp-contract">Contrat recherché</Label>
              <select
                id="jp-contract"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.contract}
                onChange={(e) => set("contract", e.target.value)}
              >
                {CONTRACTS.map((c) => (
                  <option key={c.v} value={c.v}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-background/50 px-3 py-2">
              <Label htmlFor="jp-remote">Télétravail uniquement</Label>
              <Switch
                id="jp-remote"
                checked={form.remote_only}
                onCheckedChange={(v) => set("remote_only", v)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={save} disabled={!loggedIn || saving}>
              {saving ? "Enregistrement…" : "💾 Enregistrer mon profil"}
            </Button>
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
