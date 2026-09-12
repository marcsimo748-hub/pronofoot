import type { MetadataRoute } from "next";

/**
 * robots.txt — le contenu public est indexable, les espaces privés,
 * l'admin et les API ne le sont jamais.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api/", "/reset-password", "/pronos"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app"}/sitemap.xml`,
  };
}
