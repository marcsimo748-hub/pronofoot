/**
 * robots.txt — multi-sitemap (pages + news + RSS).
 *
 * Le contenu public est indexable, les espaces privés, l'admin et
 * les API ne le sont jamais.
 *
 * Les agrégateurs (Googlebot, Bingbot…) sont explicitement autorisés
 * sur les sitemaps satellites pour maximiser l'indexation.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";

export async function GET() {
  const body = `# PRONO · robots.txt
# Mis à jour automatiquement. Pages publiques uniquement.

User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /api/
Disallow: /reset-password
Disallow: /pronos
Disallow: /messages

# Crawlers de news (Google News, Bing News…) explicitement autorisés
User-agent: Googlebot-News
Allow: /

User-agent: Bingbot
Allow: /

# Référencement des sitemaps (max 50 000 URLs par sitemap)
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-news.xml

# Flux RSS public pour les agrégateurs tiers
# (Feedly, Inoreader, Netvibes, etc.)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
