"use client";

/**
 * AnschreibenGenerator : Postuler via PRONO (MODULE 4).
 * Génère automatiquement une lettre de motivation logement (allemand + français)
 * à partir du profil du joueur (module 2), éditable, avec copie / WhatsApp /
 * e-mail / impression. Sauvegardable dans prono_housing_letters.
 */

import { useEffect, useMemo, useState } from "react";
import { Copy, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { setRedirectAfterLogin } from "@/lib/auth-redirect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LETTER_DATA,
  generateLetterDe,
  generateLetterFr,
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
  const [data, setData] = useState<LetterData>({ ...DEFAULT_LETTER_DATA, ...saved?.data, ...prefill });
  const [lang, setLang] = useState<"de" | "fr">("de");
  const [editable, setEditable] = useState<string | null>(saved?.letter_de ?? null);
  const [flash, setFlash] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // La lettre affichée : version éditée si le joueur l'a modifiée, sinon générée
  const generatedDe = useMemo(() => generateLetterDe(data), [data]);
  const generatedFr = useMemo(() => generateLetterFr(data), [data]);
  const letter = editable ?? (lang === "de" ? generatedDe : generatedFr);

  useEffect(() => {
    // Si le joueur n'a pas encore édité, la lettre suit le formulaire en direct
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
      setFlash("✅ Lettre copiée ! Colle-la dans ton message WG-Gesucht / e-mail.");
    } catch {
      setFlash("⚠️ Copie impossible — sélectionne le texte manuellement.");
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
        body: JSON.stringify({ data, letter_de: editable ?? generatedDe, letter_fr: editable ?? generatedFr }),
      });
      const json = await res.json();
      setFlash(
        json.ok
          ? "✅ Lettre sauvegardée dans ton compte !"
          : json.code === "no_table"
            ? "⚠️ Exécute 007_prono_housing.sql dans Supabase pour activer la sauvegarde."
            : "⚠️ Sauvegarde impossible."
      );
    } catch {
      setFlash("⚠️ Réseau indisponible.");
    } finally {
      setSaving(false);
      setTimeout(() => setFlash(null), 4000);
    }
  }

  const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <div className="space-y-6 rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm md:p-6">
      <div>
        <h2 className="text-xl font-bold">✍️ Ta lettre de motivation logement</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Générée en allemand (Anschreiben) et en français à partir de ton profil — le document
          n°1 demandé par les propriétaires et les colocs allemands. Modifie, copie, envoie.
        </p>
      </div>

      {/* Formulaire */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Type de lettre</Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { v: "wg", label: "🛏️ Chambre en coloc" },
                { v: "apartment", label: "🏠 Appartement" },
              ] as const
            ).map((t) => (
              <button
                key={t.v}
                onClick={() => set("target", t.v)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  data.target === t.v
                    ? "border-primary/60 bg-primary/15"
                    : "border-white/10 bg-background/40 hover:border-primary/30"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Nom complet</Label>
          <Input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="Prénom Nom" />
        </div>
        <div className="space-y-1.5">
          <Label>Âge</Label>
          <Input value={data.age} onChange={(e) => set("age", e.target.value)} placeholder="Ex : 26" />
        </div>
        <div className="space-y-1.5">
          <Label>Pays d&apos;origine</Label>
          <Input value={data.country} onChange={(e) => set("country", e.target.value)} placeholder="Ex : Cameroun" />
        </div>
        <div className="space-y-1.5">
          <Label>Profession / études</Label>
          <Input value={data.profession} onChange={(e) => set("profession", e.target.value)} placeholder="Ex : cuisinier dans un restaurant" />
        </div>
        <div className="space-y-1.5">
          <Label>Disponible à partir du</Label>
          <Input value={data.moveIn} onChange={(e) => set("moveIn", e.target.value)} placeholder="Ex : 01.10.2026" />
        </div>
        <div className="space-y-1.5">
          <Label>Ville recherchée</Label>
          <Input value={data.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex : Berlin" />
        </div>
        <div className="space-y-1.5">
          <Label>Budget max (€ warm)</Label>
          <Input value={data.budget} onChange={(e) => set("budget", e.target.value)} placeholder="Ex : 550" />
        </div>
        <div className="space-y-1.5">
          <Label>Niveau d&apos;allemand</Label>
          <select className={inputCls} value={data.germanLevel} onChange={(e) => set("germanLevel", e.target.value)}>
            {["none", "A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
              <option key={l} value={l}>{l === "none" ? "Pas encore" : l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Autres langues</Label>
          <Input value={data.otherLanguages} onChange={(e) => set("otherLanguages", e.target.value)} placeholder="Ex : français (natif), anglais B2" />
        </div>
        <div className="space-y-1.5">
          <Label>Hobbies / passions</Label>
          <Input value={data.hobbies} onChange={(e) => set("hobbies", e.target.value)} placeholder="Ex : cuisine, football, musique" />
        </div>
        <div className="space-y-1.5">
          <Label>Revenus / garantie</Label>
          <Input value={data.income} onChange={(e) => set("income", e.target.value)} placeholder="Ex : 2 300 €/mois net, contrat CDI" />
        </div>
        <div className="space-y-1.5">
          <Label>Téléphone</Label>
          <Input value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+49…" />
        </div>
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="toi@exemple.com" />
        </div>
      </div>

      {/* Aperçu de la lettre */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg border border-white/10 bg-background/40 p-1">
            {(
              [
                { v: "de", label: "🇩🇪 Deutsch" },
                { v: "fr", label: "🇫🇷 Français" },
              ] as const
            ).map((l) => (
              <button
                key={l.v}
                onClick={() => setLang(l.v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  lang === l.v ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          {editable !== null && (
            <button onClick={resetEdits} className="text-xs text-primary hover:underline">
              ↺ Revenir à la version générée automatiquement
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
          <Copy className="h-4 w-4" /> Copier la lettre
        </Button>
        <Button variant="outline" onClick={whatsapp}>📲 WhatsApp</Button>
        <Button variant="outline" onClick={mailto}>✉️ E-mail</Button>
        <Button variant="outline" onClick={print} className="gap-1.5">
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </Button>
        {loggedIn ? (
          <Button variant="secondary" onClick={save} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" /> {saving ? "Sauvegarde…" : "Sauvegarder"}
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
            <Save className="h-4 w-4" /> Se connecter pour sauvegarder
          </Button>
        )}
        {flash && <span className="text-sm text-muted-foreground">{flash}</span>}
      </div>

      {/* Modale connexion / inscription (sauvegarder sans compte) */}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        message="Connecte-toi ou crée ton compte gratuit pour sauvegarder ta lettre, tu reviendras directement dessus."
      />
    </div>
  );
}
