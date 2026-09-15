import type { Metadata } from "next";
import { NewsCard } from "@/components/news/NewsCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Newspaper } from "lucide-react";
import { RefreshNewsButton } from "@/components/news/RefreshNewsButton";
import { getLatestNews } from "@/lib/services/news.service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Actualités" };

/**
 * Page /news — toutes les actus en cache (10 min).
 */
export default async function NewsPage() {
  const news = await getLatestNews(48);

  return (
    <div className="container space-y-8 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black">
            <Newspaper className="h-8 w-8 text-primary" /> Actualités du monde
          </h1>
          <p className="mt-2 text-muted-foreground">
            Actualité internationale en direct — cache rafraîchi toutes les 10 minutes (GNews + Google News).
          </p>
        </div>
        <RefreshNewsButton />
      </header>

      {news.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 font-semibold">Aucune actualité en cache pour l'instant</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les dernières actus du foot arrivent ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {news.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
