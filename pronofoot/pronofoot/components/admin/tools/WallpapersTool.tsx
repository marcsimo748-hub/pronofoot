"use client";

/** 🖼️ Outil 4 : Fonds d'écran globaux (Connexion / Accueil) */

import { useState } from "react";
import { toast } from "sonner";
import { Upload, Link2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadToStorage, saveSetting } from "../adminShared";
import type { SiteSettings } from "@/lib/types";

export function WallpapersTool({ settings }: { settings: SiteSettings }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <WallpaperField
        label="🖼️ Fond d'écran — Page de connexion"
        value={settings.wallpapers.login}
        onSave={(url) => saveSetting("wallpapers", { login: url })}
      />
      <WallpaperField
        label="🏠 Fond d'écran — Accueil (hero)"
        value={settings.wallpapers.home}
        onSave={(url) => saveSetting("wallpapers", { home: url })}
      />
    </div>
  );
}

export function WallpaperField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (url: string) => Promise<unknown>;
}) {
  const [url, setUrl] = useState(value);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const publicUrl = await uploadToStorage(file, "media", "wallpapers");
      setUrl(publicUrl);
      await onSave(publicUrl);
      toast.success("Fond d'écran mis à jour ✅");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background/50 p-4">
      <p className="text-sm font-semibold">{label}</p>

      {/* Aperçu */}
      <div className="h-28 overflow-hidden rounded-md border bg-secondary/40">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Aperçu" className="h-full w-full object-cover" />
        ) : (
          <p className="grid h-full place-items-center text-xs text-muted-foreground">Aucun fond défini</p>
        )}
      </div>

      {/* URL */}
      <div className="flex gap-2">
        <Input placeholder="https://… (URL de l'image)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 gap-1.5"
          disabled={busy || url === value}
          onClick={async () => {
            try { await onSave(url); toast.success("Enregistré ✅"); } catch { toast.error("Erreur"); }
          }}
        >
          <Link2 className="h-3.5 w-3.5" /> OK
        </Button>
      </div>

      {/* Upload */}
      <div className="flex gap-2">
        <label className="flex-1">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <span className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground">
            <Upload className="h-4 w-4" /> {busy ? "Upload…" : "Téléverser une image"}
          </span>
        </label>
        {url && (
          <Button
            size="sm" variant="destructive" className="shrink-0"
            onClick={async () => {
              setUrl("");
              try { await onSave(""); toast.success("Fond retiré"); } catch { toast.error("Erreur"); }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
