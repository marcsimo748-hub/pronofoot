import type { Metadata } from "next";
import { NewsCard } from "@/components/news/NewsCard";
import { Button } from "@/components/ui/button";
import { Newspaper } from "lucide-react";
import { RefreshNewsButton } from "@/components/news/RefreshNewsButton";
import { getLatestNews } from "@/lib/services/news.service";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Actualités africaines : Cameroun, Afrique centrale et diaspora",
  description:
    "Toute l'actualité africaine en direct : Cameroun, Afrique centrale, Lions Indomptables, CAN, football africain et vie de la diaspora en Europe. Sources fiables (RFI, France 24, Google News), rafraîchies en continu.",
  path: "/news",
  ogImage: "/og-news.png",
  type: "website",
  keywords: [
    "actualités africaines",
    "Cameroun",
    "Afrique centrale",
    "Lions Indomptables",
    "CAN",
    "football africain",
    "diaspora africaine Europe",
  ],
});

/**
 * Page /news — actualité AFRICAINE en priorité (Cameroun, Afrique centrale,
 * diaspora). Cache rafraîchi toutes les 10 minutes.
 *
 * Schema.org ItemList (news en carousel Google) + Schema.org WebSite.
 */
export default async function NewsPage() {
  const news = await getLatestNews(48);
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";

  // JSON-LD : ItemList pour Google News / Discover
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Actualités africaines — Cameroun, CAN, diaspora",
    description:
      "Flux d'actualités africaines en direct, prioritairement Cameroun et Afrique centrale.",
    itemListElement: news.slice(0, 20).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "NewsArticle",
        headline: a.title,
        description: a.description ?? undefined,
        datePublished: a.published_at ?? undefined,
        image: a.image_url ?? undefined,
        url: a.url ?? undefined,
        publisher: { "@type": "Organization", name: a.source ?? "Presse" },
      },
    })),
  };

  return (
    <div className="container space-y-8 py-8">
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black">
            <Newspaper className="h-8 w-8 text-primary" /> Actualité africaine
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            🌍 Cameroun, Afrique centrale, Lions Indomptables, CAN et diaspora africaine en Europe :
            clique sur une actu pour la lire ici directement.
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

      {/* Bouton "Voir plus" / flux RSS public */}
      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-card/50 p-4 text-sm">
        <span className="text-muted-foreground">
          Tu veux suivre ces actus depuis ton agrégateur ?
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/feed.xml" target="_blank" rel="noopener noreferrer">
              📡 Flux RSS
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/sitemap-news.xml" target="_blank" rel="noopener noreferrer">
              🗺️ Sitemap news
            </a>
          </Button>
        </div>
      </footer>
    </div>
  );
}
