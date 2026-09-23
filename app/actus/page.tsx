import { redirect } from "next/navigation";

/**
 * /actus — alias historique des news africaines (FR/EN/DE).
 * On garde une URL courte pour les partages existants, et on redirige
 * vers /news qui est l'URL canonique utilisée dans la nav et le sitemap.
 *
 * 308 = permanent redirect (les moteurs de recherche transfèrent le PageRank).
 */
export default function ActusAlias(): never {
  redirect("/news");
}
