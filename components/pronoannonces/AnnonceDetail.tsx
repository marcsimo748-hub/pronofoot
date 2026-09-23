"use client";

/**
 * Détail d'une annonce (MODULE 5) — galerie photos, description complète,
 * révélation du contact, signalement avec raison.
 */

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryInfo, timeAgoFr, REPORT_REASONS, priceFr, SHIPPING_LABEL, CUSTOMS_LABEL, placeFr } from "./annonces-data";
import { ShareButton } from "@/components/shared/ShareButton";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import type { PronoAnnonce } from "@/lib/types";

interface Props {
  annonce: PronoAnnonce | null;
  isOwner: boolean;
  loggedIn: boolean;
  /** Connecté : démarrer la discussion privée (chat interne) */
  onChat?: (annonceId: string) => void;
  /** Non connecté : demander la connexion (modale) pour le chat ou le signalement */
  onAuthRequired?: (annonceId: string) => void;
  onClose: () => void;
  onReported: (id: string) => void;
}

export function AnnonceDetail({
  annonce,
  isOwner,
  loggedIn,
  onChat,
  onAuthRequired,
  onClose,
  onReported,
}: Props) {
  const { t } = useT();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [reportMsg, setReportMsg] = useState("");
  const [sending, setSending] = useState(false);

  if (!annonce) return null;
  const cat = categoryInfo(annonce.category);
  const photos = annonce.photos?.length ? annonce.photos : [];

  const sendReport = async () => {
    setSending(true);
    setReportMsg("");
    try {
      const res = await fetch("/api/prono-annonces/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: annonce.id, reason }),
      });
      if (res.status === 409) {
        setReportMsg(t("det.reportAlready"));
      } else if (res.ok) {
        const json = await res.json();
        setReportMsg(
          json.hidden
            ? t("det.reportDoneHidden")
            : t("det.reportDone")
        );
        onReported(annonce.id);
      } else {
        setReportMsg(t("det.reportFail"));
      }
    } catch {
      setReportMsg("Erreur réseau · réessaie.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={!!annonce} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-left text-lg leading-snug">
            {cat.emoji} {annonce.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            📍 {placeFr(annonce)}
            {annonce.country ? `, ${annonce.country}` : ""} · {timeAgoFr(annonce.created_at)}
          </DialogDescription>
        </DialogHeader>

        {/* Galerie */}
        {photos.length > 0 ? (
          <div className="space-y-2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-background/60">
              <Image
                src={photos[Math.min(photoIdx, photos.length - 1)]}
                alt={annonce.title}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
                unoptimized
              />
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2">
                {photos.map((p, i) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPhotoIdx(i)}
                    className={`relative h-16 w-16 overflow-hidden rounded-md border-2 ${
                      i === photoIdx ? "border-primary" : "border-transparent opacity-70"
                    }`}
                    aria-label={`Photo ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-background/60 text-6xl">
            {cat.emoji}
          </div>
        )}

        {/* Auteur */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={annonce.author?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="text-xs">
              {(annonce.author?.username ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <span className="font-medium">{annonce.author?.username ?? "Anonyme"}</span>
            {annonce.author?.email_verified ? (
              <span className="ml-1.5 text-emerald-400" title="Email vérifié">
                ✓ <span className="text-xs text-emerald-400/80">Vérifié</span>
              </span>
            ) : (
              <span className="ml-2 text-muted-foreground">· Membre PRONO</span>
            )}
          </div>
          <Badge variant="secondary" className="ml-auto">
            {cat.emoji} {cat.label}
          </Badge>
        </div>

        {/* Prix & logistique (annonces biens) */}
        {(annonce.price_eur != null || annonce.shipping === "aide" || (annonce.customs && annonce.customs !== "aucun")) && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            {annonce.price_eur != null && (
              <p className="text-lg font-black text-primary">{priceFr(annonce.price_eur)}</p>
            )}
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {annonce.shipping === "aide" && <li>{t("ship.help")}</li>}
              {annonce.customs === "vendeur" && <li>{t("cust.seller")}</li>}
              {annonce.customs === "acheteur" && <li>{t("cust.buyer")}</li>}
            </ul>
          </div>
        )}

        {/* Description */}
        {annonce.description && (
          <p className="whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-sm leading-relaxed text-foreground/90">
            {annonce.description}
          </p>
        )}

        {/* Contact : tout passe par le chat privé, coordonnées protégées */}
        {isOwner ? (
          <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
            {t("det.ownerNote")}
          </p>
        ) : (
          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              variant="glow"
              onClick={() => onChat?.(annonce.id)}
            >
              {t("det.talk")} {annonce.author?.username ?? "…"}
            </Button>
            <ShareButton
              title={`${annonce.title} · PRONO`}
              text={`🏪 ${annonce.title}${annonce.price_eur != null ? ` · ${priceFr(annonce.price_eur)}` : ""} · 📍 ${placeFr(annonce)} · ${t("share.seenOn")}`}
              url={`/prono-annonces?annonce=${annonce.id}`}
              variant="outline"
              className="h-9 w-full justify-center text-xs"
            />
          </div>
        )}

        {/* Invitation : toi aussi, propose ton service (visiteurs non connectés) */}
        {!isOwner && !loggedIn && (
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 text-center">
            <p className="text-sm font-bold">
              {t("det.ctaTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("det.ctaSub")}
              / Publish your service for free. / Deinen Service kostenlos anbieten.
            </p>
            <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href="/boutiques"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-transform duration-300 hover:scale-105"
              >
                🛍️ Créer ma boutique gratuite
              </Link>
              <button
                type="button"
                onClick={() => onAuthRequired?.(annonce.id)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-secondary px-4 py-2 text-xs font-bold transition-transform duration-300 hover:scale-105"
              >
                {t("ann.ctaAccount")}
              </button>
            </div>
          </div>
        )}

        {/* Signalement */}
        {!isOwner && (
          <div className="border-t border-white/10 pt-3">
            {!reporting ? (
              <button
                type="button"
                onClick={() => (loggedIn ? setReporting(true) : onAuthRequired?.(annonce.id))}
                className="text-xs text-muted-foreground hover:text-red-400"
              >
                {t("det.report")}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("det.reportWhy")}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="destructive" onClick={sendReport} disabled={sending}>
                    {sending ? "…" : t("det.send")}
                  </Button>
                </div>
              </div>
            )}
            {reportMsg && <p className="mt-2 text-xs text-muted-foreground">{reportMsg}</p>}
            <p className="mt-1 text-[10px] text-muted-foreground/60">
              {t("det.reportNote")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
