"use client";

/**
 * AnschreibenGenerator : Postuler via PRONO (MODULE 4) — FR/EN/DE.
 * Génère automatiquement une lettre de motivation logement (3 langues :
 * allemand, français, anglais) à partir du profil du joueur, éditable,
 * avec copie / WhatsApp / e-mail / impression.
 * Sauvegardable dans prono_housing_letters.
 */

import { useEffect, useMemo, useState } from "react";
import { Copy, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { setRedirectAfterLogin } from "@/lib/auth-redirect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useT, type Lang } from "@/lib/i18n";
import {
  DEFAULT_LETTER_DATA,
  generateLetter,
  type LetterData,
} from "./housing-data";

export interface SavedLetter {
  data: LetterData;
  letter_de: string;
  letter_fr: string;
}

export function AnschreibenGenerator({
  loggedIn,
  saved,
  prefill,
}: {
  loggedIn: boolean;
  saved: SavedLetter | null;
  prefill: Partial<LetterData>;
}) {
  const { t, lang } = useT();
  const L = (lang || "fr") as Lang;

  const [data, setData] = useState<LetterData>({ ...DEFAULT_LETTER_DATA, ...saved?.data, ...prefill });
  const [chosenLang, setChosenLang] = useState<Lang>("de");
  const [editable, setEditable] = useState<string | null>(
    saved ? saved.letter_de ?? saved.letter_fr ?? null : null
  );
  const [flash, setFlash] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // La lettre affichée : version éditée si le joueur l'a modifiée, sinon générée
  const generatedDe = useMemo(() => generateLetter(data, "de"), [data]);
  const generatedFr = useMemo(() => generateLetter(data, "fr"), [data]);
  const generatedEn = useMemo(() => generateLetter(data, "en"), [data]);
  const byLang = { de: generatedDe, fr: generatedFr, en: generatedEn } as const;
  const letter = editable ?? byLang[chosenLang];

  // Si on change la langue d'affichage et qu'on n'a pas d'édition, la lettre suit
  useEffect(() => {
    if (editable === null) return;
  }, [editable]);

  const set = <K extends keyof LetterData>(key: K, value: LetterData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  function resetEdits() {
    setEditable(null);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter);
      setFlash(t("hou.letterFlashCopied"));
    } catch {
      setFlash(t("hou.letterFlashCopyFail"));
    }
    setTimeout(() => setFlash(null), 4000);
  }

  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(letter)}`, "_blank", "noopener");
  }

  function mailto() {
    const subject = data.target === "wg" ? "Bewerbung um das WG-Zimmer" : "Bewerbung um die Wohnung";
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(letter)}`;
  }

  function print() {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(
      `<html><head><title>Anschreiben</title></head><body style="font-family:Arial;white-space:pre-wrap;padding:40px;max-width:700px">${letter
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</body></html>`
    );
    w.document.close();
    w.print();
  }

  async function save() {
    if (!loggedIn) return;
    setSaving(true);
    try {
      const res = await fetch("/api/prono-housing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, letter_de: generatedDe, letter_fr: generatedFr }),
      });
      const json = await res.json();
      setFlash(
        json.ok
          ? t("hou.letterFlashSaved")
          : json.code === "no_table"
            ? t("hou.letterFlashNoTable")
            : t("hou.letterFlashSaveFail")
      );
    } catch {
      setFlash(t("hou.letterFlashNet"));
    } finally {
      setSaving(false);
      setTimeout(() => setFlash(null), 4000);
    }
  }

  const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <div className="space-y-6 rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm md:p-6">
      <div>
        <h2 className="text-xl font-bold">{t("hou.letterTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("hou.letterIntro")}</p>
      </div>

      {/* Formulaire */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("hou.letterType")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { v: "wg", lk: "hou.letterWG" },
                { v: "apartment", lk: "hou.letterApt" },
              ] as const
            ).map((tt) => (
              <button
                key={tt.v}
                onClick={() => set("target", tt.v)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  data.target === tt.v
                    ? "border-primary/60 bg-primary/15"
                    : "border-white/10 bg-background/40 hover:border-primary/30"
                )}
              >
                {t(tt.lk)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterName")}</Label>
          <Input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder={t("hou.letterNamePh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterAge")}</Label>
          <Input value={data.age} onChange={(e) => set("age", e.target.value)} placeholder={t("hou.letterAgePh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterCountry")}</Label>
          <Input value={data.country} onChange={(e) => set("country", e.target.value)} placeholder={t("hou.letterCountryPh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterProfession")}</Label>
          <Input value={data.profession} onChange={(e) => set("profession", e.target.value)} placeholder={t("hou.letterProfessionPh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterMoveIn")}</Label>
          <Input value={data.moveIn} onChange={(e) => set("moveIn", e.target.value)} placeholder={t("hou.letterMoveInPh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterCity")}</Label>
          <Input value={data.city} onChange={(e) => set("city", e.target.value)} placeholder={t("hou.letterCityPh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterBudget")}</Label>
          <Input value={data.budget} onChange={(e) => set("budget", e.target.value)} placeholder={t("hou.letterBudgetPh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterGerman")}</Label>
          <select className={inputCls} value={data.germanLevel} onChange={(e) => set("germanLevel", e.target.value)}>
            {["none", "A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
              <option key={l} value={l}>{l === "none" ? t("hou.letterGermanNone") : l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterOtherLangs")}</Label>
          <Input value={data.otherLanguages} onChange={(e) => set("otherLanguages", e.target.value)} placeholder={t("hou.letterOtherLangsPh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterHobbies")}</Label>
          <Input value={data.hobbies} onChange={(e) => set("hobbies", e.target.value)} placeholder={t("hou.letterHobbiesPh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterIncome")}</Label>
          <Input value={data.income} onChange={(e) => set("income", e.target.value)} placeholder={t("hou.letterIncomePh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterPhone")}</Label>
          <Input value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder={t("hou.letterPhonePh")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("hou.letterEmail")}</Label>
          <Input value={data.email} onChange={(e) => set("email", e.target.value)} placeholder={t("hou.letterEmailPh")} />
        </div>
      </div>

      {/* Aperçu de la lettre */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg border border-white/10 bg-background/40 p-1">
            {(
              [
                { v: "de" as Lang, label: "🇩🇪 Deutsch" },
                { v: "fr" as Lang, label: "🇫🇷 Français" },
                { v: "en" as Lang, label: "🇬🇧 English" },
              ]
            ).map((l) => (
              <button
                key={l.v}
                onClick={() => setChosenLang(l.v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  chosenLang === l.v ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          {editable !== null && (
            <button onClick={resetEdits} className="text-xs text-primary hover:underline">
              {t("hou.letterReset")}
            </button>
          )}
        </div>
        <textarea
          className="min-h-[340px] w-full rounded-xl border border-white/10 bg-white p-5 font-mono text-[13px] leading-relaxed text-slate-900"
          value={letter}
          onChange={(e) => setEditable(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
        <Button onClick={copy} className="gap-1.5">
          <Copy className="h-4 w-4" /> {t("hou.letterCopy")}
        </Button>
        <Button variant="outline" onClick={whatsapp}>📲 WhatsApp</Button>
        <Button variant="outline" onClick={mailto}>✉️ E-mail</Button>
        <Button variant="outline" onClick={print} className="gap-1.5">
          <Printer className="h-4 w-4" /> PDF / 🖨
        </Button>
        {loggedIn ? (
          <Button variant="secondary" onClick={save} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" /> {saving ? t("hou.letterSaving") : t("job.saving")}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setRedirectAfterLogin("/prono-housing");
              setAuthOpen(true);
            }}
          >
            <Save className="h-4 w-4" /> {t("hou.letterSave")}
          </Button>
        )}
        {flash && <span className="text-sm text-muted-foreground">{flash}</span>}
      </div>

      {/* Modale connexion / inscription (sauvegarder sans compte) */}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        message={t("hou.letterAuthMsg")}
      />
    </div>
  );
}
