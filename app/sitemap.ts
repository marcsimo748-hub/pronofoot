import type { MetadataRoute } from "next";

/**
 * sitemap.xml — pages publiques uniquement (les espaces privés,
 * l'admin et les API n'ont rien à faire dans un moteur de recherche).
 *
 * Les pages trilingues (housing, voyage, visa, job, transferts, profil,
 * annonces) sont indexées une seule fois (la langue passe par le cookie
 * côté serveur, ce n'est pas une URL différente).
 *
 * Les pages légales (AGB / Impressum / Datenschutz) sont en DE par défaut
 * mais FR/EN accessibles via le sélecteur de langue — elles restent
 * publiques pour la conformité DSGVO.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";
  const now = new Date();

  // Pages principales (priorité décroissante)
  const pages: { path: string; priority: number; freq?: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, freq: "daily" },
    // Modules diaspora (cœur de cible)
    { path: "/prono-job", priority: 0.9, freq: "weekly" },
    { path: "/prono-annonces", priority: 0.9, freq: "daily" },
    { path: "/prono-housing", priority: 0.9, freq: "weekly" },
    { path: "/prono-voyage", priority: 0.9, freq: "weekly" },
    { path: "/prono-visa", priority: 0.9, freq: "weekly" },
    { path: "/prono-afrique", priority: 0.9, freq: "weekly" },
    { path: "/prono-profil", priority: 0.7, freq: "monthly" },
    { path: "/prono-transferts", priority: 0.8, freq: "monthly" },</old_text>
    // Contenu live
    { path: "/scores", priority: 0.8, freq: "daily" },
    { path: "/news", priority: 0.7, freq: "daily" },
    { path: "/classement", priority: 0.6, freq: "daily" },
    // Communautaire
    { path: "/coupons", priority: 0.6, freq: "daily" },
    { path: "/boutiques", priority: 0.6, freq: "weekly" },
    { path: "/boutique", priority: 0.5, freq: "monthly" },
    // Pages de soutien / info
    { path: "/tarifs", priority: 0.5, freq: "monthly" },
    { path: "/soutenir", priority: 0.5, freq: "monthly" },
    { path: "/partenaires", priority: 0.5, freq: "monthly" },
    { path: "/music", priority: 0.4, freq: "weekly" },
    // Auth
    { path: "/login", priority: 0.4, freq: "monthly" },
    { path: "/signup", priority: 0.6, freq: "monthly" },
    // Pages légales (DSGVO / conformité)
    { path: "/agb", priority: 0.2, freq: "monthly" },
    { path: "/impressum", priority: 0.2, freq: "monthly" },
    { path: "/datenschutz", priority: 0.2, freq: "monthly" },
  ];

  return pages.map((p) => ({
    url: `${base}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq ?? "weekly",
    priority: p.priority,
  }));
}
