"use client";

/**
 * JobPrefsForm — "Mon profil emploi" (alimente le PronoScore) — FR/EN/DE.
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
import { useT } from "@/lib/i18n";
import type { JobPrefs } from "@/lib/types";

const LEVEL_KEYS = [
  { v: "none", key: "job.lvNone" },
  { v: "A1", key: "job.lvA1" },
  { v: "A2", key: "job.lvA2" },
  { v: "B1", key: "job.lvB1" },
  { v: "B2", key: "job.lvB2" },
  { v: "C1", key: "job.lvC1" },
  { v: "C2", key: "job.lvC2" },
] as const;

const CONTRACT_KEYS = [
  { v: "", key: "job.contractAll" },
  { v: "full-time", key: "job.cFull" },
  { v: "part-time", key: "job.cPart" },
  { v: "contract", key: "job.cCdd" },
  { v: "internship", key: "job.cIntern" },
  { v: "freelance", key: "job.cFree" },
] as const;

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
  const { t } = useT();
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
        setMessage(t("job.prefsSaved"));
      } else if (json.code === "no_table") {
        setMessage(t("job.prefsNoTable"));
      } else {
        setMessage(t("job.prefsErr"));
      }
    } catch {
      setMessage(t("job.prefsNet"));
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
          {t("job.prefsTitle")}
          <span className="text-xs font-normal text-muted-foreground">
            · {t("job.prefsHint")}
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
                {t("job.loginA")}
              </Link>{" "}
              {t("job.loginB")}
            </p>
          ) : !dbReady ? (
            <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-400">
              💾 {t("job.prefsNoTable")}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jp-keywords">{t("job.prefsKeywords")}</Label>
              <Input
                id="jp-keywords"
                placeholder={t("job.prefsKeywordsPh")}
                value={form.keywords}
                onChange={(e) => set("keywords", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jp-city">{t("job.prefsCity")}</Label>
              <Input
                id="jp-city"
                placeholder={t("job.prefsCityPh")}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jp-german">{t("job.prefsGerman")}</Label>
              <select
                id="jp-german"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.german_level}
                onChange={(e) => set("german_level", e.target.value)}
              >
                {LEVEL_KEYS.map((l) => (
                  <option key={l.v} value={l.v}>{t(l.key)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jp-english">{t("job.prefsEnglish")}</Label>
              <select
                id="jp-english"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.english_level}
                onChange={(e) => set("english_level", e.target.value)}
              >
                {LEVEL_KEYS.map((l) => (
                  <option key={l.v} value={l.v}>{t(l.key)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jp-contract">{t("job.prefsContract")}</Label>
              <select
                id="jp-contract"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.contract}
                onChange={(e) => set("contract", e.target.value)}
              >
                {CONTRACT_KEYS.map((c) => (
                  <option key={c.v} value={c.v}>{t(c.key)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-background/50 px-3 py-2">
              <Label htmlFor="jp-remote">{t("job.prefsRemote")}</Label>
              <Switch
                id="jp-remote"
                checked={form.remote_only}
                onCheckedChange={(v) => set("remote_only", v)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={save} disabled={!loggedIn || saving}>
              {saving ? t("job.saving") : t("job.prefsSave")}
            </Button>
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
