import type { MetadataRoute } from "next";

/**
 * 📱 Manifeste PWA — installable sur mobile (Chrome Android, iOS Safari).
 * Les icônes existent déjà dans /public/icons (192, 512, maskable).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PRONO · Super-App de la Diaspora",
    short_name: "PRONO",
    description:
      "Pronostics football, scores live, Emploi, Visa, Logement, Annonces et Voyage pour la diaspora africaine en Europe.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0b",
    theme_color: "#10b981",
    lang: "fr",
    // i18n : manifest multi-langue (Chrome Android respecte ça)
    categories: ["sports", "lifestyle", "social", "news", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
