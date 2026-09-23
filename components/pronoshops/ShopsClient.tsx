"use client";

/**
 * Boutiques des membres : annuaire + création / modification de MA boutique.
 * Thèmes visuels au choix, logo optionnel (même stockage que les annonces).
 * Les articles se publient depuis /prono-annonces : ils apparaissent
 * automatiquement dans la boutique de leur auteur.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { SHOP_THEMES, shopTheme } from "./shop-themes";
import { useT } from "@/lib/i18n";
import { AuthModal } from "@/components/auth/AuthModal";
import { setRedirectAfterLogin } from "@/lib/auth-redirect";
import type { PronoShop } from "@/lib/services/pronoshops.service";

interface Props {
  initialShops: PronoShop[];
  counts: Record<string, number>;
  myShop: PronoShop | null;
  loggedIn: boolean;
  prefill?: { city?: string };
}

/** Redimensionne une image via canvas (max 1200 px, JPEG 0.82) */
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
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("no_blob"))), "image/jpeg", quality);
  });
}

export function ShopsClient({ initialShops, counts, myShop, loggedIn, prefill }: Props) {
  const router = useRouter();
  const { t } = useT();
  const [formOpen, setFormOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulaire
  const [name, setName] = useState(myShop?.name ?? "");
  const [tagline, setTagline] = useState(myShop?.tagline ?? "");
  const [description, setDescription] = useState(myShop?.description ?? "");
  const [city, setCity] = useState(myShop?.city ?? prefill?.city ?? "");
  const [quartier, setQuartier] = useState(myShop?.quartier ?? "");
  const [postal, setPostal] = useState(myShop?.postal ?? "");
  const [whatsapp, setWhatsapp] = useState(myShop?.whatsapp ?? "");
  const [theme, setTheme] = useState(myShop?.theme ?? "nuit");
  const [logo, setLogo] = useState(myShop?.logo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const openForm = () => {
    if (!loggedIn) {
      setRedirectAfterLogin("/boutiques");
      setAuthOpen(true);
      return;
    }
    setError("");
    setFormOpen(true);
  };

  const uploadLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("shopf.errPhoto"));
      return;
    }
    setUploading(true);
    setError("");
    try {
      const blob = await resizeToJpeg(file, 600, 0.85);
      const form = new FormData();
      form.append("file", new File([blob], "logo.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/prono-annonces/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(res.status === 401 ? "Connecte-toi d'abord." : "Logo non envoyé, réessaie.");
        return;
      }
      setLogo(json.url);
    } catch {
      setError("Impossible de lire cette image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    setError("");
    if (name.trim().length < 3) {
      setError(t("shopf.errName"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/pronoshops", {
        method: myShop ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tagline, description, city, quartier, postal, whatsapp, theme, logo_url: logo }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) setError(t("shopf.errLogin"));
        else if (json.error === "already_has_shop") setError("Tu as déjà une boutique : modifie-la ici.");
        else if (res.status === 503) setError("Les boutiques arrivent dans un instant (mise à jour du serveur). Reviens dans 2 minutes.");
        else setError(t("shopf.errGeneric"));
        return;
      }
      setFormOpen(false);
      toast.success(myShop ? t("shopf.toastEdit") : t("shopf.toastCreate"));
      if (!myShop && json.shop?.slug) {
        router.push(`/boutiques/${json.shop.slug}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Connexion interrompue, réessaie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bandeau d'action */}
      <div className="glass flex flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <div>
          <p className="font-bold">🛍️ {myShop ? t("shop.myShop") : t("shop.myShopWaiting")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {myShop
              ? `${myShop.name}${myShop.tagline ? ` : ${myShop.tagline}` : ""}`
              : t("shop.myShopSub")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {myShop && (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`/boutiques/${myShop.slug}`}>{t("shop.viewMine")}</Link>
            </Button>
          )}
          <Button variant="glow" className="gap-2" onClick={openForm}>
            {myShop ? t("shop.customize") : t("shop.create")}
          </Button>
        </div>
      </div>

      {/* Annuaires */}
      {initialShops.length === 0 ? (
        <div className="glass rounded-2xl border-dashed p-14 text-center">
          <p className="text-5xl">🛍️</p>
          <p className="mt-4 text-sm text-muted-foreground">
            <strong>{t("shop.emptyDir")}</strong>
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {initialShops.map((s, i) => {
            const t = shopTheme(s.theme);
            const n = counts[s.user_id] ?? 0;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.05 }}
              >
                <Link
                  href={`/boutiques/${s.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-white/10 bg-secondary/40 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:shadow-xl"
                >
                  {/* Bandeau thème */}
                  <div
                    className="relative flex h-24 items-center justify-center text-4xl"
                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                  >
                    {s.logo_url ? (
                      <span className="absolute inset-0 overflow-hidden">
                        <Image src={s.logo_url} alt="" fill className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-110" unoptimized />
                      </span>
                    ) : (
                      <span className="transition-transform duration-500 group-hover:scale-125">{t.emoji}</span>
                    )}
                    <span className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
                      {t.label}
                    </span>
                  </div>
                  <div className="space-y-1.5 p-4">
                    <p className="font-black transition-colors group-hover:text-primary">{s.name}</p>
                    {s.tagline && <p className="text-xs font-semibold" style={{ color: t.accent }}>{s.tagline}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>👤 {s.author?.username ?? "Membre"}</span>
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-bold text-primary">
                        {n}
                      </span>
                    </div>
                    {s.city && <p className="text-xs text-muted-foreground">📍 {s.city}</p>}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modale création / édition */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{myShop ? t("shopf.editTitle") : t("shopf.title")}</DialogTitle>
            <DialogDescription>
              {t("shopf.desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Thèmes */}
            <div className="space-y-2">
              <Label>{t("shopf.theme")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {SHOP_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`group relative overflow-hidden rounded-xl border-2 p-3 text-center transition-all duration-300 hover:scale-105 ${
                      theme === t.id ? "border-white shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                    aria-label={t.label}
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="mt-1 block text-[10px] font-black uppercase tracking-wide text-white">
                      {t.label}
                    </span>
                    {theme === t.id && (
                      <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-black text-black">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("shopf.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Ex : Chez Mama Shop" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shopf.tagline")}</Label>
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={90} placeholder="Ex : Mode & tissus wax authentiques" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("shopf.description")}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1200} placeholder="Ce que tu vends, tes services, tes horaires…" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("shopf.city")}</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={70} placeholder="Berlin" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shopf.district")}</Label>
                <div className="flex gap-2">
                  <Input value={quartier} onChange={(e) => setQuartier(e.target.value)} maxLength={70} placeholder="Wedding" />
                  <Input value={postal} onChange={(e) => setPostal(e.target.value.replace(/[^0-9A-Za-z -]/g, ""))} maxLength={10} placeholder="13347" className="max-w-[110px]" />
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("shopf.whatsapp")}</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={30} placeholder="+49 157…" />
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-1.5">
              <Label>{t("shopf.cover")}</Label>
              <div className="flex items-center gap-3">
                <span
                  className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 text-2xl"
                  style={{ background: `linear-gradient(135deg, ${shopTheme(theme).from}, ${shopTheme(theme).to})` }}
                >
                  {logo ? (
                    <Image src={logo} alt="Logo" width={64} height={64} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    shopTheme(theme).emoji
                  )}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && void uploadLogo(e.target.files[0])}
                />
                <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? t("shopf.uploading") : logo ? t("shopf.changePhoto") : t("shopf.pickPhoto")}
                </Button>
                {logo && (
                  <Button type="button" variant="ghost" onClick={() => setLogo("")}>{t("shopf.remove")}</Button>
                )}
              </div>
            </div>

            {/* Comment ajouter des articles */}
            <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              💡 {t("shopf.hint")}
            </p>

            {error && <p className="text-sm font-semibold text-red-400">{error}</p>}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={submit} disabled={saving || uploading}>
                {saving ? t("shopf.saving") : myShop ? t("shopf.save") : t("shopf.create")}
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                {t("shopf.cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
