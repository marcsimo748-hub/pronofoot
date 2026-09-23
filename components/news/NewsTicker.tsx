"use client";

/**
 * NewsTicker — bandeau d'actualités mondiales défilant en boucle infinie
 * (react-fast-marquee), placé tout en haut du site.
 * Lit le cache Supabase `news` (rafraîchi toutes les 10 min par le serveur).
 */

import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import Link from "next/link";
import { Globe2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ClientTimeAgo } from "@/components/ui/ClientTimeAgo";
import type { NewsItem } from "@/lib/types";

export function NewsTicker({ initialNews }: { initialNews: NewsItem[] }) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);

  // Relecture du cache toutes les 10 minutes
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("news")
          .select("*")
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(15);
        if (data?.length) setNews(data as NewsItem[]);
      } catch {
        /* silencieux */
      }
    };
    const timer = setInterval(load, 600_000);
    return () => clearInterval(timer);
  }, []);

  if (!news.length) return null;

  return (
    <div className="border-b border-white/5 bg-secondary/40">
      <div className="flex items-center">
        <div className="flex shrink-0 items-center gap-1.5 bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
          <Globe2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">ACTUS MONDE</span>
        </div>
        <Marquee pauseOnHover speed={55} gradient gradientColor="hsl(240 12% 5%)" className="flex-1">
          {news.map((n) => (
            <Link
              key={n.id}
              href="/news"
              className="mx-4 flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="font-semibold text-foreground/80">{n.source ?? "Presse"}</span>
              <span className="max-w-[420px] truncate">{n.title}</span>
              {n.published_at && (
                <span className="opacity-50">
                  <ClientTimeAgo date={n.published_at} />
                </span>
              )}
            </Link>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
