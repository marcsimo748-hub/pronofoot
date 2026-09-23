"use client";

/**
 * CvBuilder — créateur de CV automatique (MODULE 2).
 * 3 templates professionnels au choix (Moderne, Classique, Allemand/Ausbildung),
 * aperçu A4 en direct et export PDF via react-to-pdf (html2canvas + jsPDF).
 * Exécuté uniquement côté navigateur (dynamic import, ssr: false).
 */

import { useMemo, useRef, useState } from "react";
import { usePDF, Resolution, Margin } from "react-to-pdf";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModernCv, ClassicCv, GermanCv, profileToCvData } from "./CvTemplates";
import type { PronoProfile } from "@/lib/types";

type TemplateKey = "modern" | "classic" | "german";

const TEMPLATES: { key: TemplateKey; name: string; desc: string; emoji: string }[] = [
  { key: "modern", name: "Moderne", desc: "Sidebar colorée, dynamique · startups et métiers tech", emoji: "🚀" },
  { key: "classic", name: "Classique", desc: "Sobre et élégant · banques, administration, tous secteurs", emoji: "🎩" },
  { key: "german", name: "Allemand Ausbildung", desc: "Lebenslauf structuré · candidatures en Allemagne", emoji: "🇩🇪" },
];

export function CvBuilder({
  profile,
  username,
  email,
}: {
  profile: PronoProfile;
  username: string;
  email: string;
}) {
  const [template, setTemplate] = useState<TemplateKey>("modern");
  const [exported, setExported] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => profileToCvData(profile, username, email), [profile, username, email]);

  const fileSlug = (data.fullName || "PRONO")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { targetRef, toPDF } = usePDF({
    filename: `CV-${fileSlug || "pronofoot"}.pdf`,
    method: "save",
    resolution: Resolution.MEDIUM,
    page: { margin: Margin.NONE, format: "a4", orientation: "portrait" },
    canvas: { mimeType: "image/png" },
  });

  function exportPdf() {
    try {
      toPDF();
      setExported(true);
      setTimeout(() => setExported(false), 4000);
    } catch {
      /* le navigateur a bloqué le téléchargement */
    }
  }

  return (
    <div className="space-y-6">
      {/* Choix du template */}
      <div className="rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm md:p-6">
        <h2 className="text-xl font-bold">📄 Mon CV · généré automatiquement</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ton CV se remplit tout seul avec ton profil Emploi. Choisis un modèle puis exporte en PDF -
          c&apos;est gratuit et illimité.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTemplate(t.key)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                template === t.key
                  ? "border-primary/50 bg-primary/10"
                  : "border-white/5 bg-background/40 hover:border-primary/30"
              }`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className="mt-1.5 block font-semibold">{t.name}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t.desc}</span>
              {template === t.key && (
                <Badge className="mt-2" variant="secondary">✓ Sélectionné</Badge>
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={exportPdf} className="gap-1.5">
            ⬇️ Télécharger mon CV en PDF
          </Button>
          {exported && (
            <span className="text-sm text-green-400">✓ PDF téléchargé · vérifie tes téléchargements !</span>
          )}
        </div>
      </div>

      {/* Aperçu A4 (défilement horizontal sur mobile) */}
      <div className="rounded-xl border border-white/5 bg-card/70 p-2 backdrop-blur-sm md:p-4">
        <p className="mb-2 px-1 text-xs text-muted-foreground">
          Aperçu réel (A4) · le PDF téléchargé est exactement identique.
        </p>
        <div className="overflow-x-auto">
          <div ref={targetRef} style={{ width: 794 }} className="mx-auto shadow-2xl">
            {template === "modern" && <ModernCv data={data} />}
            {template === "classic" && <ClassicCv data={data} />}
            {template === "german" && <GermanCv data={data} />}
          </div>
        </div>
      </div>

      {/* Astuce */}
      <p className="text-center text-xs text-muted-foreground">
        💡 Pour un CV parfait : garde 3-4 expériences maximum et des descriptions courtes.
        Les recruteurs allemands apprécient les CV d&apos;une page.
      </p>
      <span className="hidden" ref={previewRef} />
    </div>
  );
}
