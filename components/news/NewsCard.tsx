"use client";

/**
 * Carte d'article d'actualité.
 */

import { ExternalLink, Newspaper } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { NewsItem } from "@/lib/types";

export function NewsCard({ article }: { article: NewsItem }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group card-hover flex flex-col overflow-hidden rounded-xl border bg-card"
    >
      {article.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image_url}
          alt=""
          loading="lazy"
          className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      ) : (
        <div className="cover-fallback flex h-36 w-full items-center justify-center">
          <Newspaper className="h-10 w-10 text-foreground/30" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
          {article.title}
        </h3>
        {article.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{article.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
          <span className="truncate font-medium text-primary/80">{article.source ?? "Presse"}</span>
          <span className="flex shrink-0 items-center gap-1">
            {article.published_at ? timeAgo(article.published_at) : ""}
            <ExternalLink className="h-3 w-3 opacity-50" />
          </span>
        </div>
      </div>
    </a>
  );
}
