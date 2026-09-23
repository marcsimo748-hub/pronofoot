import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getShopBySlug, getShopItems } from "@/lib/services/pronoshops.service";
import { ShopView } from "@/components/pronoshops/ShopView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);
  if (!shop) return { title: "Boutique introuvable | PRONO" };
  return {
    title: `${shop.name} | boutique PRONO`,
    description:
      shop.tagline ||
      `${shop.name}${shop.city ? ` à ${shop.city}` : ""} : articles et services de la communauté PRONO. Contact direct par WhatsApp ou chat.`,
  };
}

/**
 * Page /boutiques/[slug] : la boutique PERSONNALISÉE d'un membre.
 * PUBLIQUE : données côté serveur, rendu traduit (FR/EN/DE) via ShopView.
 * Aucune transaction sur le site : contact direct.
 */
export default async function ShopPage({ params }: PageProps) {
  const shop = await getShopBySlug(params.slug);
  if (!shop || shop.status !== "active") notFound();

  const [user, items] = await Promise.all([getSessionUser(), getShopItems(shop.user_id)]);

  // Fiche boutique pour Google (recherche locale)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: shop.name,
    description: shop.tagline || shop.description?.slice(0, 200) || "Boutique de la communauté PRONO",
    ...(shop.city ? { address: { "@type": "PostalAddress", addressLocality: shop.city, postalCode: shop.postal || undefined, streetAddress: shop.quartier || undefined } } : {}),
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app"}/boutiques/${shop.slug}`,
  };

  return (
    <div className="container py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShopView
        shop={shop}
        items={items}
        isOwner={Boolean(user && user.id === shop.user_id)}
        loggedIn={Boolean(user)}
      />
    </div>
  );
}
