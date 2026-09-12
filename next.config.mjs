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
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Force HTTPS pendant 2 ans (Vercel est déjà en HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
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
