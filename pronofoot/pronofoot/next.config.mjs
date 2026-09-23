/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Autorise les images distantes (pochettes, news, avatars...) depuis n'importe quel https
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Les fichiers envoyés vers Supabase Storage passent par le client (pas de limite Vercel)
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
