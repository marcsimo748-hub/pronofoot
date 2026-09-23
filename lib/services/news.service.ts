/**
 * Service NEWS — actualité AFRICAINE en priorité.
 * Sources RSS 100 % gratuites et fiables : RFI Afrique, France 24 Afrique,
 * Google News ciblé Cameroun / Afrique centrale / Lions Indomptables /
 * diaspora africaine. GNews API (si clé) avec requête africaine.
 * Cache de 10 minutes dans la table `news`. Appelé par /api/news/sync.
 *
 * Ligne éditoriale : l'Afrique d'abord (Cameroun et Afrique centrale en
 * priorité) ; l'Europe uniquement quand ça concerne la diaspora africaine.
 */

import { XMLParser } from "fast-xml-parser";
import { createHash } from "crypto";
import type { NewsItem } from "@/lib/types";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeQuery } from "@/lib/utils";

const MAX_ARTICLES = 60; // nombre conservé en base

interface NormalizedArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source: string | null;
  published_at: string | null;
}

function hashUrl(url: string): string {
  return createHash("md5").update(url).digest("hex");
}

// ---------------------------------------------------------------
// Sources africaines (RSS gratuits)
// ---------------------------------------------------------------
interface FeedDef {
  url: string;
  label: string; // étiquette si le flux ne donne pas de source
}

const AFRICAN_FEEDS: FeedDef[] = [
  // Cameroun : toute l'actualité
  { url: "https://news.google.com/rss/search?q=Cameroun+when:3d&hl=fr&gl=FR&ceid=FR:fr", label: "Google News · Cameroun" },
  // Lions Indomptables & football africain
  { url: "https://news.google.com/rss/search?q=%22Lions+indomptables%22+OR+%22+football+africain%22+OR+%22CAN%22+when:7d&hl=fr&gl=FR&ceid=FR:fr", label: "Google News · Football africain" },
  // Afrique centrale
  { url: "https://news.google.com/rss/search?q=%22Afrique+centrale%22+OR+Gabon+OR+Centrafrique+OR+Tchad+OR+Congo+when:3d&hl=fr&gl=FR&ceid=FR:fr", label: "Google News · Afrique centrale" },
  // Diaspora africaine en Europe
  { url: "https://news.google.com/rss/search?q=%22diaspora+africaine%22+OR+%22migrants+africains%22+OR+%22Afrique%22+Europe+when:7d&hl=fr&gl=FR&ceid=FR:fr", label: "Google News · Diaspora" },
  // Médias africains de référence (RSS directs)
  { url: "https://www.rfi.fr/afrique/rss", label: "RFI Afrique" },
  { url: "https://www.france24.com/fr/afrique/rss", label: "France 24 Afrique" },
];

interface RssItem {
  title?: string | number;
  link?: string | number;
  description?: string | number;
  pubDate?: string | number;
  "media:content"?: { "@_url"?: string };
  "media:thumbnail"?: { "@_url"?: string };
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

/** Parse un flux RSS générique et normalise les articles */
async function fetchRssFeed(feed: FeedDef): Promise<NormalizedArticle[]> {
  const res = await fetch(feed.url, {
    cache: "no-store",
    headers: { "user-agent": "Mozilla/5.0 (compatible; Pronofoot/1.0)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${feed.label} ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    processEntities: { enabled: true, maxTotalExpansions: 200_000, maxExpandedLength: 2_000_000 },
  });
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: RssItem[] } };
    feed?: { entry?: RssItem[] };
  };

  const rawItems =
    parsed.rss?.channel?.item ??
    (parsed.feed?.entry as unknown as RssItem[] | undefined) ??
    [];

  return (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 15).map((it) => {
    // Google News inclut la source dans le titre : "Titre - Source"
    let title = String(it.title ?? "");
    let source = feed.label;
    const dash = title.lastIndexOf(" - ");
    if (dash > 20) {
      source = title.slice(dash + 3).trim();
      title = title.slice(0, dash).trim();
    }
    const link = String(it.link ?? "");
    const desc = stripHtml(String(it.description ?? "")).slice(0, 700);
    return {
      id: hashUrl(link),
      title,
      description: desc.length > 60 ? desc : null,
      url: link,
      image_url:
        (it["media:content"]?.["@_url"] as string) ??
        (it["media:thumbnail"]?.["@_url"] as string) ??
        null,
      source,
      published_at: it.pubDate ? new Date(String(it.pubDate)).toISOString() : null,
    };
  }).filter((a) => a.title && a.url);
}

// ---------------------------------------------------------------
// Source complémentaire : GNews API (si clé) avec requête africaine
// ---------------------------------------------------------------
async function fetchFromGNews(): Promise<NormalizedArticle[]> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return [];

  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("lang", "fr");
  url.searchParams.set("max", "20");
  url.searchParams.set("q", "Cameroun OR Afrique");
  url.searchParams.set("apikey", key);

  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`GNews ${res.status}`);

  const json = (await res.json()) as {
    articles?: {
      title: string;
      description: string | null;
      url: string;
      image: string | null;
      publishedAt: string | null;
      source: { name: string } | null;
    }[];
  };

  return (json.articles ?? []).map((a) => ({
    id: hashUrl(a.url),
    title: a.title,
    description: a.description,
    url: a.url,
    image_url: a.image,
    source: a.source?.name ?? "GNews",
    published_at: a.publishedAt,
  }));
}

// ---------------------------------------------------------------
// Synchronisation : flux africains en parallèle + upsert + purge
// ---------------------------------------------------------------
export async function syncNews(): Promise<{ fetched: number; source: string; skipped?: string }> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { fetched: 0, source: "none", skipped: "no_supabase" };

  // 1) Tous les flux africains en parallèle (un flux en panne ne bloque rien)
  const results = await Promise.allSettled([
    ...AFRICAN_FEEDS.map(fetchRssFeed),
    fetchFromGNews().catch(() => [] as NormalizedArticle[]),
  ]);

  // 2) Fusion + déduplication par URL (hash)
  const byId = new Map<string, NormalizedArticle>();
  let okFeeds = 0;
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    if (r.value.length) okFeeds++;
    for (const a of r.value) {
      if (!byId.has(a.id)) byId.set(a.id, a);
    }
  }
  if (!okFeeds || byId.size === 0) {
    return { fetched: 0, source: "afrique", skipped: "all_sources_failed" };
  }

  const articles = [...byId.values()]
    .sort((a, b) => {
      const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
      const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, MAX_ARTICLES);

  // 3) Upsert en base
  const { error } = await admin.from("news").upsert(
    articles.map((a) => ({ ...a, fetched_at: new Date().toISOString() })),
    { onConflict: "id" }
  );
  if (error) throw error;

  // 4) Purge : on garde seulement les MAX_ARTICLES utiles
  const { data: recent } = await admin
    .from("news")
    .select("id")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(MAX_ARTICLES);
  const keepIds = (recent ?? []).map((r) => r.id);
  if (keepIds.length) {
    await admin.from("news").delete().not("id", "in", `(${keepIds.join(",")})`);
  }

  return { fetched: articles.length, source: "afrique" };
}

/** Dernières news (lecture des pages serveur) */
export async function getLatestNews(limit = 15): Promise<NewsItem[]> {
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    return (data ?? []) as NewsItem[];
  }, []);
}
