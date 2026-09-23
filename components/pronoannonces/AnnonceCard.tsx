"use client";

/**
 * Carte annonce (MODULE 5) — version premium.
 * Photo avec zoom fluide + voile dégradé, badge prix lumineux, badge « Nouveau »,
 * survol : élévation + halo coloré, tout en transitions douces (300-500 ms).
 */

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { categoryInfo, timeAgoFr, priceFr, placeFr } from "./annonces-data";
import { ShareButton } from "@/components/shared/ShareButton";
import { useT } from "@/lib/i18n";
import type { PronoAnnonce } from "@/lib/types";

interface Props {
  annonce: PronoAnnonce;
  isOwner: boolean;
  onOpen: () => void;
  onHide?: () => void;
  onDelete?: () => void;
}

export function AnnonceCard({ annonce, isOwner, onOpen, onHide, onDelete }: Props) {
  const { t } = useT();
  const cat = categoryInfo(annonce.category);
  const photo = annonce.photos?.[0];
  const isNew = Date.now() - new Date(annonce.created_at).getTime() < 48 * 3600 * 1000;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-white/10 bg-secondary/40 p-0 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
      {/* Halo lumineux au survol */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 40px rgba(var(--primary-rgb, 22 163 74) / 0.06)" }}
      />

      {/* Zone photo / emoji */}
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-background/60 text-left"
        aria-label={annonce.title}
      >
        {photo ? (
          <Image
            src={photo}
            alt={annonce.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/80 to-background text-6xl transition-transform duration-500 ease-out group-hover:scale-125">
            {cat.emoji}
          </span>
        )}

        {/* Voile dégradé bas de photo */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 via-background/30 to-transparent"
        />

        {/* Badge catégorie (bas gauche) */}
        <span className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="border border-white/10 bg-background/70 backdrop-blur-md">
            {cat.emoji} {cat.short}
          </Badge>
        </span>

        {/* Photos multiples (bas droite) */}
        {annonce.photos && annonce.photos.length > 1 && (
          <span className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="border border-white/10 bg-background/70 backdrop-blur-md">
              📷 {annonce.photos.length}
            </Badge>
          </span>
        )}

        {/* Prix (haut gauche) · lumineux */}
        {annonce.price_eur != null && (
          <span className="absolute left-2 top-2">
            <Badge className="border border-emerald-300/40 bg-gradient-to-r from-emerald-500 to-green-600 text-sm font-black text-white shadow-lg shadow-emerald-500/30 transition-transform duration-300 group-hover:scale-105">
              {priceFr(annonce.price_eur)}
            </Badge>
          </span>
        )}

        {/* Envoi Afrique (haut gauche, sous le prix) */}
        {annonce.shipping === "aide" && (
          <span className={annonce.price_eur != null ? "absolute left-2 top-11" : "absolute left-2 top-2"}>
            <Badge className="border border-sky-300/30 bg-sky-500/90 text-xs font-bold text-white shadow-md shadow-sky-500/20">
              🚢 Afrique
            </Badge>
          </span>
        )}

        {/* Nouveau (haut droite) */}
        {isNew && annonce.status === "active" && (
          <span className="absolute right-2 top-2">
            <Badge className="animate-pulse border border-white/20 bg-primary text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/40">
              ✨ {t("card.new")}
            </Badge>
          </span>
        )}

        {annonce.status === "hidden" && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Badge className="bg-amber-500/95 text-sm font-bold text-amber-950 shadow-lg">👁️ {t("card.hidden")}</Badge>
          </span>
        )}
      </button>

      <CardContent className="space-y-2.5 p-4">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full text-left text-sm font-semibold leading-snug transition-colors duration-200 hover:text-primary"
        >
          {annonce.title}
        </button>

        {(annonce.price_eur != null || annonce.shipping === "aide") && (
          <div className="flex flex-wrap items-center gap-1.5">
            {annonce.price_eur != null && (
              <span className="text-base font-black text-emerald-400">
                {priceFr(annonce.price_eur)}
              </span>
            )}
            {annonce.shipping === "aide" && (
              <Badge variant="secondary" className="border border-sky-400/30 bg-sky-500/15 text-sky-300">
                {t("card.shipAble")}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate" title={placeFr(annonce)}>
            📍 {placeFr(annonce)}
          </span>
          <span className="shrink-0">{timeAgoFr(annonce.created_at)}</span>
        </div>

        <div className="flex items-center gap-2 border-t border-white/5 pt-2.5 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5 ring-1 ring-white/10 transition-transform duration-300 group-hover:ring-primary/40">
            <AvatarImage src={annonce.author?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="text-[9px]">
              {(annonce.author?.username ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{annonce.author?.username ?? "Anonyme"}</span>
          {annonce.author?.email_verified && (
            <span className="shrink-0 text-emerald-400" title="Email vérifié">✓</span>
          )}
        </div>

        <ShareButton
          title={`${annonce.title} · PRONO`}
          text={`🏪 ${annonce.title}${annonce.price_eur != null ? ` · ${priceFr(annonce.price_eur)}` : ""} · 📍 ${placeFr(annonce)} · ${t("share.seenOn")}`}
          url={`/prono-annonces?annonce=${annonce.id}`}
          variant="outline"
          className="h-7 w-full justify-center px-2 text-xs transition-colors hover:border-primary/40 hover:text-primary"
        />

        {isOwner ? (
          <div className="flex gap-2 pt-1">
            {annonce.status === "hidden" ? (
              <button
                type="button"
                onClick={onHide}
                className="flex-1 rounded-md bg-emerald-500/15 px-2 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
              >
                👁️ Afficher
              </button>
            ) : (
              <button
                type="button"
                onClick={onHide}
                className="flex-1 rounded-md bg-amber-500/15 px-2 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
              >
                🚫 Masquer
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="flex-1 rounded-md bg-red-500/15 px-2 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25"
            >
              🗑️ Supprimer
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
