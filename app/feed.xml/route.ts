import { getLatestNews } from "@/lib/services/news.service";

/**
 * /feed.xml — Flux RSS 2.0 public pour les actualités africaines.
 * Agrégateurs (Feedly, Inoreader, Netvibes…) peuvent suivre ce flux pour
 * redistribuer le contenu, créant des backlinks SEO et de la visibilité.
 *
 * Format : RSS 2.0 avec enclosure image quand disponible.
 * Pas de cache long : on rafraîchit à chaque appel (Vercel CDN absorbe).
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";

const SITE_NAME = "PRONO";
const SITE_DESCRIPTION =
  "Actualités africaines : Cameroun, Afrique centrale, diaspora en Europe. Foot, Lions Indomptables, CAN et vie quotidienne.";

function escape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(date: string | Date | undefined): string {
  if (!date) return new Date().toUTCString();
  return new Date(date).toUTCString();
}

export async function GET() {
  const items = await getLatestNews(30);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escape(SITE_NAME)} — Actualité africaine</title>
    <link>${SITE_URL}/news</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escape(SITE_DESCRIPTION)}</description>
    <language>fr-FR</language>
    <lastBuildDate>${rfc822(new Date())}</lastBuildDate>
    <generator>PRONO feed generator</generator>
    <image>
      <url>${SITE_URL}/icons/icon-512.png</url>
      <title>${escape(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
      <width>512</width>
      <height>512</height>
    </image>
${items
  .map((a) => {
    const title = escape(a.title ?? "");
    const description = escape(a.description ?? a.title ?? "");
    const link = escape(a.url ?? `${SITE_URL}/news`);
    const pubDate = rfc822(a.published_at);
    const source = escape(a.source ?? "Presse");
    const imageTag = a.image_url
      ? `      <media:content url="${escape(a.image_url)}" type="image/jpeg" medium="image" />\n`
      : "";
    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="false">prono-news-${escape(a.id)}</guid>
      <description>${description}</description>
      <source url="${escape(SITE_URL)}">${source}</source>
      <pubDate>${pubDate}</pubDate>
${imageTag}    </item>`;
  })
  .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=60",
    },
  });
}
