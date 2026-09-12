import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NewsTicker } from "@/components/news/NewsTicker";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { AiAssistantWidget } from "@/components/ai/AiAssistantWidget";
import { SyncManager } from "@/components/layout/SyncManager";
import { getSettings } from "@/lib/services/settings.service";
import { getLatestNews } from "@/lib/services/news.service";
import { getSongs } from "@/lib/services/music.service";
import { getSessionUser } from "@/lib/supabase/server";
import { hexToHsl } from "@/lib/utils";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import type { NewsItem, Song } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME}, ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Pronostics, Emploi, Visa, Logement et Annonces : la Super-App de la Diaspora. Scores live, news et assistant IA inclus. 100% gratuit.",
  applicationName: SITE_NAME,
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

  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        {/* Couleur du thème (Admin > 🎨 Couleur du Thème) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--primary:${hexToHsl(settings.theme.primary)};--ring:${hexToHsl(settings.theme.primary)}}`,
          }}
        />
      </head>
      <body className="min-h-dvh font-sans">
        <NewsTicker initialNews={news as NewsItem[]} />
        {children}
        {/* Lecteur global + assistant IA : actifs sur tout le site */}
        <MusicPlayer initialSongs={songs as Song[]} />
        <AiAssistantWidget />
        <SyncManager />
        <Toaster position="top-center" />
        {/* user passé pour hydratation éventuelle (audit) */}
        <span hidden data-user={user?.username ?? ""} />
      </body>
    </html>
  );
}
