import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";

/**
 * Helpers SEO centralisés — évite de répéter les blocs Open Graph /
 * Twitter / robots sur chaque page, garantit la cohérence (URL canonique,
 * locale fr-FR + alternates en-GB + de-DE) et unifie les images OG.
 *
 * Usage :
 *   export const metadata = pageMetadata({
 *     title: "Actualités africaines",
 *     description: "Toute l'actu...",
 *     path: "/news",
 *     ogImage: "/og-news.png",
 *     type: "website", // ou "article" pour news
 *   });
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";

export type PageMetadataInput = {
  /** Titre de la page (sans le suffixe PRONO) */
  title: string;
  /** Description pour Google + Open Graph (150-160 caractères idéalement) */
  description: string;
  /** Chemin relatif de la page (ex : "/news", "/classement"). Sans slash final. */
  path: string;
  /** Image OG absolue ou chemin depuis /public. Par défaut : og-annonces.png */
  ogImage?: string;
  /** Type Open Graph. Par défaut "website". "article" pour les news. */
  type?: "website" | "article" | "profile";
  /** Mots-clés (rarement utilisé par Google, mais utile pour Pinterest) */
  keywords?: string[];
  /** Empêcher l'indexation (noindex) — utile pour pages privées */
  noindex?: boolean;
  /** Date de publication (pour type=article) */
  publishedTime?: string;
  /** Date de modification (pour type=article) */
  modifiedTime?: string;
  /** Image OG pour Twitter (sinon = ogImage) */
  twitterImage?: string;
};

/**
 * Normalise une URL d'image OG : si relative, la préfixe avec SITE_URL.
 */
function absImage(img?: string): string {
  if (!img) return `${SITE_URL}/og-annonces.png`;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const clean = img.startsWith("/") ? img : `/${img}`;
  return `${SITE_URL}${clean}`;
}

/**
 * Construit un objet Metadata Next.js complet (title, description,
 * canonical, OG, Twitter, robots, alternates hreflang).
 */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const {
    title,
    description,
    path,
    ogImage,
    type = "website",
    keywords,
    noindex,
    publishedTime,
    modifiedTime,
    twitterImage,
  } = input;

  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImg = absImage(ogImage);
  const twImg = absImage(twitterImage ?? ogImage);

  const meta: Metadata = {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: {
        "fr-FR": url,
        "en-GB": url,
        "de-DE": url,
      },
    },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: "fr_FR",
      alternateLocale: ["en_GB", "de_DE"],
      images: [
        {
          url: ogImg,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twImg],
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };

  return meta;
}
