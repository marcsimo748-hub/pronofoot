"use client";

/**
 * Formulaire de publication d'une annonce (MODULE 5).
 * Photos : jusqu'à 3, redimensionnées en canvas (max 1200 px, JPEG 0.82),
 * uploadées dans le bucket Supabase Storage "prono-annonces" (dossier de l'utilisateur).
 */

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "./annonces-data";
import type { PronoAnnonce } from "@/lib/types";

interface Props {
  prefill?: { city?: string; country?: string; email?: string };
  onCreated: (annonce: PronoAnnonce) => void;
  onCancel: () => void;
}

/** Redimensionne une image via canvas (max 1200 px, JPEG qualité 0.82) */
async function resizeToJpeg(file: File, max = 1200, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("no_blob"))),
      "image/jpeg",
      quality
    );
  });
}

export function AnnonceForm({ prefill, onCreated, onCancel }: Props) {
  const [category, setCategory] = useState("ami");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(prefill?.city ?? "");
  const [country, setCountry] = useState(prefill?.country ?? "Allemagne");
  const [contactPreference, setContactPreference] = useState("whatsapp");
  const [contactValue, setContactValue] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = useCallback(async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Choisis une image (JPG ou PNG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Photo trop lourde (max 8 Mo avant compression).");
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeToJpeg(file);
      if (blob.size > 2 * 1024 * 1024) {
        setError("Photo encore trop lourde après compression, essaie une image plus petite.");
        return;
      }
      // Upload via le serveur (validation + quota + bucket auto-réparé)
      const form = new FormData();
      form.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/prono-annonces/upload", { method: "POST", body: form });
      if (!res.ok) {
        if (res.status === 401) setError("Connecte-toi pour ajouter des photos.");
        else if (res.status === 429) setError("Tu envoies les photos trop vite, patiente quelques secondes.");
        else if (res.status === 503) setError("Les photos sont momentanément indisponibles. Tu peux publier ton annonce sans photo.");
        else setError("Cette photo n'a pas pu être envoyée, essaie une autre.");
        return;
      }
      const json = await res.json();
      if (json.url) setPhotos((p) => [...p, json.url].slice(0, 3));
    } catch {
      setError("Impossible de lire cette image, essaie une autre photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, []);

  const removePhoto = (url: string) => setPhotos((p) => p.filter((x) => x !== url));

  const submit = async () => {
    setError("");
    if (title.trim().length < 5) {
      setError("Le titre doit faire au moins 5 caractères.");
      return;
    }
    if (!contactValue.trim()) {
      setError("Indique un moyen de contact (WhatsApp ou email).");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/prono-annonces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          description,
          city,
          country,
          photos,
          contact_preference: contactPreference,
          contact_value: contactValue,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError("Connecte-toi pour publier une annonce.");
        } else {
          setError("Publication momentanément indisponible, réessaie dans un instant.");
        }
        return;
      }
      onCreated(json.annonce as PronoAnnonce);
    } catch {
      setError("Erreur réseau, réessaie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Catégorie *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Titre *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={90}
            placeholder="Ex : Cherche une colocation à Berlin"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Décris ton annonce : qui tu es, ce que tu cherches ou proposes, conditions…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Ville</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={70} placeholder="Berlin" />
        </div>
        <div className="space-y-1.5">
          <Label>Pays</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={70} placeholder="Allemagne" />
        </div>
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <Label>Photos (max 3, compressées automatiquement)</Label>
        <div className="flex flex-wrap items-center gap-2">
          {photos.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Photo annonce" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs text-white"
                aria-label="Retirer la photo"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-white/20 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-50"
            >
              <span className="text-lg">{uploading ? "⏳" : "📷"}</span>
              {uploading ? "Envoi…" : "Ajouter"}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadPhoto(f);
          }}
        />
      </div>

      {/* Contact */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2 rounded-lg bg-secondary/40 p-2.5 text-xs text-muted-foreground">
          🔒 Ton contact reste privé : il n&apos;apparaît jamais dans l&apos;annonce.
          Les membres discutent avec toi par le chat PRONO, et tu choisis quand leur
          révéler tes coordonnées.
        </div>
        <div className="space-y-1.5">
          <Label>Contact préféré *</Label>
          <Select value={contactPreference} onValueChange={setContactPreference}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
              <SelectItem value="email">✉️ Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{contactPreference === "whatsapp" ? "Numéro WhatsApp *" : "Adresse email *"}</Label>
          <Input
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            maxLength={150}
            placeholder={contactPreference === "whatsapp" ? "+49 170 1234567" : prefill?.email ?? "toi@email.com"}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={submit} disabled={saving || uploading}>
          {saving ? "Publication…" : "📢 Publier mon annonce"}
        </Button>
      </div>
    </div>
  );
}
