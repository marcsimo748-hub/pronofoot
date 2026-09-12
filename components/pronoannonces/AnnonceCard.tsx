"use client";

/**
 * Carte annonce (MODULE 5) — photo ou emoji catégorie, titre, ville, auteur, badges.
 */

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { categoryInfo, timeAgoFr } from "./annonces-data";
import type { PronoAnnonce } from "@/lib/types";

interface Props {
  annonce: PronoAnnonce;
  isOwner: boolean;
  onOpen: () => void;
  onHide?: () => void;
  onDelete?: () => void;
}

export function AnnonceCard({ annonce, isOwner, onOpen, onHide, onDelete }: Props) {
  const cat = categoryInfo(annonce.category);
  const photo = annonce.photos?.[0];

  return (
    <Card className="group overflow-hidden border-white/10 bg-secondary/40 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
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
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-5xl">{cat.emoji}</span>
        )}
        {annonce.status === "hidden" && (
          <span className="absolute left-2 top-2">
            <Badge className="bg-amber-500/90 text-amber-950">👁️ Masquée</Badge>
          </span>
        )}
        <span className="absolute right-2 top-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur">
            {cat.emoji} {cat.short}
          </Badge>
        </span>
        {annonce.photos && annonce.photos.length > 1 && (
          <span className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur">
              📷 {annonce.photos.length}
            </Badge>
          </span>
        )}
      </button>

      <CardContent className="space-y-2 p-3">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full text-left text-sm font-semibold leading-snug hover:text-primary"
        >
          {annonce.title}
        </button>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>📍 {annonce.city || "—"}</span>
          <span>{timeAgoFr(annonce.created_at)}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarImage src={annonce.author?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="text-[9px]">
              {(annonce.author?.username ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{annonce.author?.username ?? "Anonyme"}</span>
        </div>

        {isOwner ? (
          <div className="flex gap-2 pt-1">
            {annonce.status === "hidden" ? (
              <button
                type="button"
                onClick={onHide}
                className="flex-1 rounded-md bg-emerald-500/15 px-2 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25"
              >
                👁️ Afficher
              </button>
            ) : (
              <button
                type="button"
                onClick={onHide}
                className="flex-1 rounded-md bg-amber-500/15 px-2 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/25"
              >
                🚫 Masquer
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md bg-red-500/15 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25"
            >
              🗑️
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
