"use client";

/** 🎨 Outil 8 : Couleur du thème du site (appliquée en direct) */

import { useState } from "react";
import { toast } from "sonner";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSetting } from "../adminShared";
import { hexToHsl, cn } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";

const PRESETS = [
  { name: "Émeraude", value: "#10b981" },
  { name: "Ocean", value: "#3b82f6" },
  { name: "Violet", value: "#a855f7" },
  { name: "Rose", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Rouge", value: "#ef4444" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Or", value: "#f59e0b" },
];

export function ThemeTool({ settings }: { settings: SiteSettings }) {
  const [color, setColor] = useState(settings.theme.primary);

  /** Applique immédiatement en local pour prévisualiser */
  function preview(hex: string) {
    setColor(hex);
    document.documentElement.style.setProperty("--primary", hexToHsl(hex));
    document.documentElement.style.setProperty("--ring", hexToHsl(hex));
  }

  async function save() {
    try {
      await saveSetting("theme", { primary: color });
      toast.success("Thème enregistré ✅", { description: "Il s'applique à tout le site (nouvelles sessions incluses)." });
    } catch {
      toast.error("Erreur d'enregistrement");
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        La couleur principale du site (boutons, liens, surbrillances). Prévisualisation instantanée,
        enregistrement pour tous les visiteurs.
      </p>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => preview(p.value)}
            title={p.name}
            className={cn(
              "grid h-12 place-items-center rounded-lg border-2 transition-transform hover:scale-105",
              color.toLowerCase() === p.value ? "border-white" : "border-transparent"
            )}
            style={{ backgroundColor: p.value }}
          >
            {color.toLowerCase() === p.value && <Check className="h-4 w-4 text-white drop-shadow" />}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <Input
          type="color"
          value={color}
          onChange={(e) => preview(e.target.value)}
          className="h-9 w-16 cursor-pointer p-1"
          aria-label="Couleur personnalisée"
        />
        <Input
          value={color}
          onChange={(e) => preview(e.target.value)}
          className="w-28 font-mono"
          maxLength={7}
          aria-label="Code hexadécimal"
        />
        <Button onClick={save} className="ml-auto">Enregistrer le thème</Button>
      </div>
    </div>
  );
}
