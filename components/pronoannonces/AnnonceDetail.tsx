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
import { categoryInfo, timeAgoFr, REPORT_REASONS } from "./annonces-data";
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
        setReportMsg("Tu as déjà signalé cette annonce ✅");
      } else if (res.ok) {
        const json = await res.json();
        setReportMsg(
          json.hidden
            ? "Merci ! Signalement enregistré — l'annonce a été masquée automatiquement (3 signalements)."
            : "Merci ! L'équipe va examiner cette annonce."
        );
        onReported(annonce.id);
      } else {
        setReportMsg("Signalement impossible pour le moment.");
      }
    } catch {
      setReportMsg("Erreur réseau — réessaie.");
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
            📍 {annonce.city || "—"}
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

        {/* Description */}
        {annonce.description && (
          <p className="whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-sm leading-relaxed text-foreground/90">
            {annonce.description}
          </p>
        )}

        {/* Contact : tout passe par le chat privé, coordonnées protégées */}
        {isOwner ? (
          <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
            🔒 Ton contact reste privé. Les membres te contactent par le chat PRONO
            et tu choisis quand révéler tes coordonnées.
          </p>
        ) : (
          <Button
            className="w-full gap-2"
            variant="glow"
            onClick={() => onChat?.(annonce.id)}
          >
            💬 Discuter avec {annonce.author?.username ?? "l'auteur"}
          </Button>
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
                🚩 Signaler cette annonce
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Pourquoi signales-tu cette annonce ?</p>
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
                    {sending ? "…" : "Envoyer"}
                  </Button>
                </div>
              </div>
            )}
            {reportMsg && <p className="mt-2 text-xs text-muted-foreground">{reportMsg}</p>}
            <p className="mt-1 text-[10px] text-muted-foreground/60">
              3 signalements différents = masquage automatique de l'annonce.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
