import type { Metadata } from "next";
import { VisaPageClient } from "./VisaPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PRONO Visa · Calcule tes chances de visa Allemagne (FR/EN/DE)",
  description:
    "Calculateur trilingue (FR / EN / DE) des chances de visa Allemagne (Ausbildung, Studium, Chancenkarte, travail, tourisme) : score d'estimation, checklist des documents et guides complets. Gratuit, par PRONO.",
};

/**
 * Page /prono-visa — MODULE 3 « PronoVisa ».
 * Logique passée à <VisaPageClient /> (client) pour respecter le hook
 * useT et avoir du trilingue, mais la page reste exportable côté serveur
 * pour Next metadata (SEO) sans casser le sitemap.
 */
export default function PronoVisaPage() {
  return <VisaPageClient />;
}
