"use client";

/**
 * Carte d'article d'actualité — LECTURE SUR LA PAGE.
 * Un clic ouvre l'article directement dans la carte (texte du flux,
 * source, date). Le lien vers le site source est discret et facultatif :
 * le visiteur n'est JAMAIS redirigé automatiquement ailleurs.
 *
 * Bouton partage (mobile natif / desktop WA/TG/FB/Copy) quand ouvert.
 */

import { useState } from "react";
import { ChevronDown, ExternalLink, Newspaper } from "lucide-react";
import { ClientTimeAgo } from "@/components/ui/ClientTimeAgo";
import { ShareButton } from "@/components/shared/ShareButton";
import type { NewsItem } from "@/lib/types";

export function NewsCard({ article }: { article: NewsItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`card-hover flex flex-col overflow-hidden rounded-xl border bg-card transition-colors ${
        open ? "border-primary/40" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full flex-1 flex-col text-left"
      >
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            loading="lazy"
            className={`w-full object-cover transition-all duration-300 ${
              open ? "h-44" : "h-36 group-hover:scale-[1.03]"
            }`}
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div className="cover-fallback flex h-36 w-full items-center justify-center">
            <Newspaper className="h-10 w-10 text-foreground/30" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-3 text-sm font-semibold leading-snug group-hover:text-primary">
            {article.title}
          </h3>
          {!open && article.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{article.description}</p>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground">
            <span className="truncate font-medium text-primary/80">{article.source ?? "Presse"}</span>
            <span className="flex shrink-0 items-center gap-1">
              {article.published_at ? <ClientTimeAgo date={article.published_at} prefix="" /> : null}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  open ? "rotate-180 text-primary" : "opacity-50"
                }`}
              />
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t bg-muted/20 px-4 pb-4 pt-3">
          {article.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {article.description}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">Résumé non fourni par la source.</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {article.url ? (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary/80 hover:text-primary"
              >
                Suite sur {article.source ?? "le site source"} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span />
            )}
            {article.url && (
              <ShareButton
                title={article.title}
                text={article.description ?? article.title}
                url={article.url}
                size="sm"
                variant="ghost"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
