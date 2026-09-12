/**
 * Service NEWS — GNews API (principal) + Google News RSS (fallback gratuit, sans clé).
 * Cache de 10 minutes dans la table `news`. Appelé uniquement par /api/news/sync.
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
// Source 1 : GNews API (clé gratuite sur gnews.io)
// ---------------------------------------------------------------
async function fetchFromGNews(): Promise<NormalizedArticle[] | null> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return null;

  const url = new URL("https://gnews.io/api/v4/top-headlines");
  url.searchParams.set("lang", "fr");
  url.searchParams.set("topic", "world");
  url.searchParams.set("max", "30");
  url.searchParams.set("apikey", key);

  const res = await fetch(url, { cache: "no-store" });
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
// Source 2 (fallback) : Google News RSS — 100% gratuit, sans clé
// ---------------------------------------------------------------
async function fetchFromGoogleRss(): Promise<NormalizedArticle[]> {
  const res = await fetch(
    "https://news.google.com/rss/headlines/topic/WORLD?hl=fr&gl=FR&ceid=FR:fr",
    {
      cache: "no-store",
      headers: { "user-agent": "Mozilla/5.0 (compatible; Pronofoot/1.0)" },
    }
  );
  if (!res.ok) throw new Error(`Google News RSS ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Google News RSS contient énormément d'entités HTML (&#39;…) :
    // on relève la limite de sécurité du parseur (défaut : 1000).
    processEntities: { enabled: true, maxTotalExpansions: 200_000, maxExpandedLength: 2_000_000 },
  });
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: RssItem[] } };
  };
  const items = parsed.rss?.channel?.item ?? [];

  return (Array.isArray(items) ? items : [items]).slice(0, 30).map((it) => {
    // Google News inclut la source dans le titre : "Titre - Source"
    let title = String(it.title ?? "");
    let source = "Google News";
    const dash = title.lastIndexOf(" - ");
    if (dash > 20) {
      source = title.slice(dash + 3).trim();
      title = title.slice(0, dash).trim();
    }
    const link = String(it.link ?? "");
    return {
      id: hashUrl(link),
      title,
      // Le contenu RSS contient du HTML : on le nettoie grossièrement
      description: String(it.description ?? "")
        .replace(/<[^>]*>/g, "")
        .slice(0, 280) || null,
      url: link,
      image_url: (it["media:content"]?.["@_url"] as string) ?? null,
      source,
      published_at: it.pubDate ? new Date(it.pubDate).toISOString() : null,
    };
  });
}

interface RssItem {
  title?: string | number;
  link?: string | number;
  description?: string | number;
  pubDate?: string | number;
  "media:content"?: { "@_url"?: string };
}

// ---------------------------------------------------------------
// Synchronisation (upsert + purge des vieux articles)
// ---------------------------------------------------------------
export async function syncNews(): Promise<{ fetched: number; source: string; skipped?: string }> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { fetched: 0, source: "none", skipped: "no_supabase" };

  // 1) On tente GNews, sinon fallback RSS (les deux peuvent échouer → skip)
  let articles: NormalizedArticle[] | null = null;
  let source = "gnews";
  try {
    articles = await fetchFromGNews();
  } catch (e) {
    console.warn("[news.service] GNews a échoué, fallback RSS :", (e as Error).message);
  }
  if (!articles?.length) {
    source = "google-rss";
    try {
      articles = await fetchFromGoogleRss();
    } catch (e) {
      console.warn("[news.service] RSS a échoué :", (e as Error).message);
      return { fetched: 0, source, skipped: "all_sources_failed" };
    }
  }

  // 2) Upsert en base
  const { error } = await admin.from("news").upsert(
    articles.map((a) => ({ ...a, fetched_at: new Date().toISOString() })),
    { onConflict: "id" }
  );
  if (error) throw error;

  // 3) Purge : on garde seulement les MAX_ARTICLES plus récents
  const { data: recent } = await admin
    .from("news")
    .select("id")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(MAX_ARTICLES);
  const keepIds = (recent ?? []).map((r) => r.id);
  if (keepIds.length) {
    await admin.from("news").delete().not("id", "in", `(${keepIds.join(",")})`);
  }

  return { fetched: articles.length, source };
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
