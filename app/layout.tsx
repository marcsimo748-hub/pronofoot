import type { Metadata, Viewport } from "next";
import { Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/* Typo éditoriale : Instrument Serif (titres journal) + IBM Plex Mono (chiffres/scores) */
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
import { Toaster } from "@/components/ui/toaster";
import { NewsTicker } from "@/components/news/NewsTicker";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { AiAssistantWidget } from "@/components/ai/AiAssistantWidget";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { WeatherBadge } from "@/components/ui/WeatherBadge";
import { Analytics } from "@vercel/analytics/react";
import { SyncManager } from "@/components/layout/SyncManager";
import { PWARegister } from "@/components/pwa/PWARegister";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { getSettings } from "@/lib/services/settings.service";
import { getLatestNews } from "@/lib/services/news.service";
import { getSongs } from "@/lib/services/music.service";
import { getSessionUser } from "@/lib/supabase/server";
import { readServerLang } from "@/lib/i18n-server";
import { hexToHsl } from "@/lib/utils";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import type { NewsItem, Song } from "@/lib/types";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME}, ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Pronostics, Emploi, Visa, Logement et Annonces : la Super-App de la Diaspora. Scores live, news et assistant IA inclus. 100% gratuit.",
  // Vérification Google Search Console (propriété du site)
  verification: {
    google: "9mzOaxE2LHEylbKEGVv7mal6L5h9UiV2wwz-aw_CJW0",
  },
  applicationName: SITE_NAME,
  // ⚠️ mobile-web-app-capable : la nouvelle norme (apple-mobile-web-app-capable est deprecie)
  other: {
    "mobile-web-app-capable": "yes",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Open Graph (Facebook, LinkedIn, WhatsApp, Discord…)
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: { default: `${SITE_NAME}, ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
    description:
      "Pronostics, Emploi, Visa, Logement et Annonces : la Super-App de la Diaspora. Scores live, news et assistant IA inclus. 100% gratuit.",
    url: SITE_URL,
    locale: "fr_FR",
    alternateLocale: ["en_GB", "de_DE"],
    images: [
      {
        url: `${SITE_URL}/og-annonces.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  // Twitter / X cards
  twitter: {
    card: "summary_large_image",
    title: { default: `${SITE_NAME}, ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
    description:
      "Pronostics, Emploi, Visa, Logement et Annonces : la Super-App de la Diaspora. Scores live, news et assistant IA inclus. 100% gratuit.",
    images: [`${SITE_URL}/og-annonces.png`],
  },
  // Indexation des pages FR/EN/DE (hreflang via cookie + sélecteur, pas de chemins différents)
  alternates: {
    canonical: SITE_URL,
    languages: {
      "fr-FR": SITE_URL,
      "en-GB": SITE_URL,
      "de-DE": SITE_URL,
    },
  },
  // Identification pour robots / crawlers
  robots: {
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

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

/**
 * Layout racine — features GLOBALES (présentes sur toutes les pages) :
 * NewsTicker, lecteur musique, assistant IA, sync automatique.
 * Le thème (couleur admin) est injecté en variables CSS.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, news, songs, user] = await Promise.all([
    getSettings(),
    getLatestNews(12),
    getSongs(),
    getSessionUser(),
  ]);

  // Suit la langue du visiteur pour <html lang> (SEO accessibilité + screen readers)
  const lang = readServerLang(); // "fr" | "en" | "de"
  const htmlLang = lang === "en" ? "en" : lang === "de" ? "de" : "fr";

  // JSON-LD : structured data pour Google (Organization + WebSite + SearchAction)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icons/icon-512.png`,
        description:
          "Super-App de la Diaspora : pronostics football, scores live, emploi, visa, logement, annonces, voyage, transferts et assistant IA.",
        sameAs: [
          // À compléter quand les réseaux sociaux sont créés :
          // "https://twitter.com/prono_app",
          // "https://facebook.com/prono.app",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+49-1575-4169524",
          contactType: "customer support",
          availableLanguage: ["French", "English", "German"],
          areaServed: ["DE", "FR", "CM", "GA", "CG", "CD", "SN", "CI"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: ["fr-FR", "en-GB", "de-DE"],
        publisher: { "@id": `${SITE_URL}#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/actus?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang={htmlLang} className="dark" suppressHydrationWarning>
      <head>
        {/* Couleur du thème (Admin > 🎨 Couleur du Thème) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--primary:${hexToHsl(settings.theme.primary)};--ring:${hexToHsl(settings.theme.primary)}}`,
          }}
        />
        {/* Structured data JSON-LD (Google Rich Results) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${instrumentSerif.variable} ${plexMono.variable} min-h-dvh font-sans`}>
        <ThemeProvider>
          <NewsTicker initialNews={news as NewsItem[]} />
          {children}
        {/* Lecteur global + assistant IA : actifs sur tout le site */}
        <MusicPlayer initialSongs={songs as Song[]} />
        <AiAssistantWidget />
        <Analytics />
        <SyncManager />
        <PWARegister />
        <InstallPrompt />
        <Toaster position="top-center" />
        {/* user passé pour hydratation éventuelle (audit) */}
        <span hidden data-user={user?.username ?? ""} />
        <WeatherBadge />
          </ThemeProvider>
      </body>
    </html>
  );
}
