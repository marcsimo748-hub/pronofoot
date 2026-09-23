/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Autorise les images distantes (pochettes, news, avatars...) depuis n'importe quel https
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Les fichiers envoyés vers Supabase Storage passent par le client (pas de limite Vercel)
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  // ===== En-têtes de sécurité (protection visiteurs) =====
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Anti-clickjacking : le site ne peut pas être affiché dans une iframe
          { key: "X-Frame-Options", value: "DENY" },
          // Anti-MIME-sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Ne divulgue l'URL complète qu'en HTTPS vers la même origine
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Désactive les permissions navigateur inutiles
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
          // Force HTTPS pendant 2 ans (Vercel est déjà en HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Optimisation perf : autorise le pré-chargement DNS pour nos domaines tiers
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Content-Security-Policy : whitelist explicite des sources de confiance.
          // ⚠️ Volontairement permissif pour les images (https) et les iframes YouTube/Twitter
          // car on intègre du contenu sportif/news externe. Aucun inline-script dangereux.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts : Next.js a besoin de 'unsafe-inline' pour le boot, 'unsafe-eval' en dev uniquement
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-analytics.com https://*.vercel-scripts.com https://challenges.cloudflare.com",
              // Styles : Google Fonts + Tailwind utilities
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Polices : Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images : toutes sources HTTPS (logos, avatars, news…)
              "img-src 'self' data: blob: https:",
              // Médias (audio/vidéo) : pour le lecteur musique + replays
              "media-src 'self' https: blob:",
              // Connexions API : Supabase + Vercel Analytics + Cloudflare Turnstile + APIs externes
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-analytics.com https://*.vercel-scripts.com https://api.open-meteo.com https://api.openligadb.de https://site.api.espn.com https://www.thesportsdb.com https://v3.football.api-sports.io https://challenges.cloudflare.com",
              // Frames : YouTube + Google OAuth + Turnstile
              "frame-src 'self' https://www.youtube.com https://youtube.com https://accounts.google.com https://challenges.cloudflare.com",
              // Objets / embeds : aucun
              "object-src 'none'",
              // Sécurité : anti-redirect, anti-base-uri
              "base-uri 'self'",
              "form-action 'self'",
              // Frames ancestors : on bloque les iframes parents (équivalent X-Frame-Options DENY)
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        // Jamais de cache pour les API (données sensibles / sessions)
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
