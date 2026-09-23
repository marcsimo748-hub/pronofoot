"use client";

/** 📢 Outil 9 : Annonce publique (bandeau visible par tous les joueurs) */

import { useState } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { saveSetting } from "../adminShared";
import type { SiteSettings } from "@/lib/types";

const LEVELS: { key: "info" | "warn" | "success"; label: string }[] = [
  { key: "info", label: "ℹ️ Info" },
  { key: "warn", label: "⚠️ Alerte" },
  { key: "success", label: "✅ Succès" },
];

export function AnnouncementTool({ settings }: { settings: SiteSettings }) {
  const [message, setMessage] = useState(settings.announcement.message);
  const [level, setLevel] = useState(settings.announcement.level);
  const [active, setActive] = useState(settings.announcement.active);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await saveSetting("announcement", { message: message.trim(), level, active });
      toast.success(active ? "Annonce publiée 📢" : "Annonce enregistrée (inactive)");
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-4 rounded-lg border bg-background/50 p-4">
        <span className="flex items-center gap-2 font-semibold">
          <Megaphone className="h-4 w-4 text-primary" /> Annonce active
        </span>
        <Switch checked={active} onCheckedChange={setActive} />
      </label>

      <div className="space-y-2">
        <span className="text-sm font-semibold">Message</span>
        <Textarea
          placeholder="Ex : 🎉 Nouvelle journée de championnat disponible, pronostiquez avant samedi 15h !"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={220}
        />
        <p className="text-right text-xs text-muted-foreground">{message.length}/220</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            onClick={() => setLevel(l.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              level === l.key ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Aperçu */}
      {message && active && (
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
          Aperçu : {message}
        </div>
      )}

      <Button onClick={save} disabled={busy}>{busy ? "…" : "Publier l'annonce"}</Button>
    </div>
  );
}
