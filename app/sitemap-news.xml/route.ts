import { getLatestNews } from "@/lib/services/news.service";

/**
 * sitemap-news.xml — sitemap dédié Google News / Google Discover.
 *
 * Google accepte un sitemap séparé pour les articles d'actualité
 * (Google News Publisher). Format conforme aux specs Google :
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 *
 * Critères Google News :
 * - URL article (pas catégorie)
 * - title / publication date (W3C datetime)
 * - <news:news> wrapper avec <news:publication><news:name>
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";

export async function GET() {
  const items = await getLatestNews(100);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items
  .filter((a) => a.url)
  .map((a) => {
    const pubDate = a.published_at
      ? new Date(a.published_at).toISOString()
      : new Date().toISOString();
    const title = (a.title ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lang = "fr"; // le site est principalement FR (UI) + contenu FR
    return `  <url>
    <loc>${a.url}</loc>
    <news:news>
      <news:publication>
        <news:name>${a.source ?? "PRONO"}</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
