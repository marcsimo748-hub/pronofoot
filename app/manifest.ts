import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/constants";

/**
 * MANIFEST PWA (Mission 10) — rend le site installable sur mobile
 * (Android : « Ajouter à l'écran d'accueil », iOS : Partager → Sur l'écran d'accueil).
 */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}, la Super-App de la Diaspora`,
    short_name: SITE_NAME,
    description:
      "Pronostics foot, emploi, visa, logement, annonces et covoiturage : la communauté dans ta poche. 100% gratuit.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0f",
    theme_color: "#16a34a",
    categories: ["sports", "social", "shopping"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
