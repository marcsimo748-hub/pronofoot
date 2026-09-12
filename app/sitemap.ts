import type { MetadataRoute } from "next";

/**
 * sitemap.xml — pages publiques uniquement (les espaces privés,
 * l'admin et les API n'ont rien à faire dans un moteur de recherche).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";
  const now = new Date();
  const pages = [
    { path: "", priority: 1 },
    { path: "/prono-job", priority: 0.9 },
    { path: "/prono-annonces", priority: 0.9 },
    { path: "/prono-housing", priority: 0.9 },
    { path: "/prono-visa", priority: 0.9 },
    { path: "/scores", priority: 0.7 },
    { path: "/news", priority: 0.7 },
    { path: "/music", priority: 0.5 },
    { path: "/classement", priority: 0.6 },
    { path: "/login", priority: 0.4 },
    { path: "/signup", priority: 0.6 },
  ];
  return pages.map((p) => ({
    url: `${base}${p.path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p.priority,
  }));
}
