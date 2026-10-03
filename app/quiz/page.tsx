import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { QuizClient } from "./QuizClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Quel club africain es-tu ? Quiz viral diaspora",
  description:
    "7 questions, 17 résultats : découvre quel Lions, Pharaons, Fennecs ou Super Eagles tu es vraiment. Partage ton résultat sur WhatsApp en 1 clic.",
  path: "/quiz",
  ogImage: "/og-quiz.png",
  keywords: [
    "quiz africain",
    "club africain",
    "Lions Indomptables",
    "Lions de l'Atlas",
    "Super Eagles",
    "Éléphants Côte d'Ivoire",
    "Pharaons Égypte",
    "Black Stars Ghana",
    "Fennecs Algérie",
    "Aigles de Carthage",
    "quiz foot diaspora",
    "viral WhatsApp",
  ],
});

/**
 * /quiz — Quiz viral "Quel club africain es-tu ?"
 *
 - 7 questions à choix multiples
 - 17 résultats (1 par pays)
 - Calcul 100% côté client (pas de BDD, pas d'auth)
 - Partage WhatsApp / Facebook / Twitter natif
 - URL partageable avec le résultat en clair (?r=cameroun)
 - SEO : metadata OG + titre dédié
 *
 * AUCUNE dépendance externe (zéro API, zéro BDD).
 */
export default function QuizPage({
  searchParams,
}: {
  searchParams?: { r?: string };
}) {
  return <QuizClient initialResult={searchParams?.r} />;
}