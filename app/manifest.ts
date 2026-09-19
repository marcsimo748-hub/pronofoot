import type { MetadataRoute } from "next";

/**
 * 📱 Manifeste PWA — installable sur mobile (Chrome Android, iOS Safari).
 * Les icônes existent déjà dans /public/icons (192, 512, maskable).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PRONO — Pronostics Football",
    short_name: "PRONO",
    description:
      "Pronostics football entre potes : 6 championnats, scores en direct, classement. Plus les modules vie en Allemagne.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#10b981",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
