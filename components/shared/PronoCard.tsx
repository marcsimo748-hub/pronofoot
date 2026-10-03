"use client";
// components/shared/PronoCard.tsx
// =====================================================================
// Composant qui génère une PNG (carte de pronostic) partageable.
// 100% natif (SVG → Canvas → download), zéro dépendance.
// =====================================================================

import { useState } from "react";
import { Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PronoCardProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  username: string;
  matchDate: string;
  league?: string;
  totalPoints?: number;
  /** Couleur de fond (ex: couleur du pays) */
  accentColor?: string;
}

/**
 * Génère une image PNG 1200x630 (format carte Instagram/Stories/OG)
 * du pronostic de l'utilisateur.
 *
 * - Input : équipes + scores + pseudo
 * - Output : PNG téléchargeable
 * - Pas d'API externe, pas de service payant
 */
export function PronoCard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  username,
  matchDate,
  league,
  totalPoints,
  accentColor = "#16a34a",
}: PronoCardProps) {
  const [loading, setLoading] = useState(false);

  function generateSVG(): string {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fbbf24;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="score" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative top accent bar -->
  <rect width="1200" height="8" fill="url(#accent)"/>

  <!-- Logo / Brand -->
  <text x="60" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="900" fill="#ffffff">
    ⚽ PRONO
  </text>
  <text x="60" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="400" fill="#9ca3af">
    Mon pronostic officiel
  </text>

  <!-- League chip -->
  ${
    league
      ? `<rect x="980" y="55" width="170" height="44" rx="22" fill="${accentColor}20" stroke="${accentColor}" stroke-width="1"/>
         <text x="1065" y="83" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="${accentColor}">${escapeXml(league.toUpperCase())}</text>`
      : ""
  }

  <!-- Match Date -->
  <text x="60" y="180" font-family="system-ui, sans-serif" font-size="20" font-weight="500" fill="#d1d5db">
    📅 ${escapeXml(matchDate)}
  </text>

  <!-- Score Box -->
  <g filter="url(#shadow)">
    <rect x="60" y="220" width="1080" height="220" rx="24" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  </g>

  <!-- Home team -->
  <text x="120" y="290" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#ffffff">
    ${escapeXml(truncate(homeTeam, 22))}
  </text>
  <text x="120" y="395" font-family="system-ui, sans-serif" font-size="14" font-weight="400" fill="#9ca3af">
    domicile
  </text>

  <!-- Away team -->
  <text x="1080" y="290" text-anchor="end" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#ffffff">
    ${escapeXml(truncate(awayTeam, 22))}
  </text>
  <text x="1080" y="395" text-anchor="end" font-family="system-ui, sans-serif" font-size="14" font-weight="400" fill="#9ca3af">
    extérieur
  </text>

  <!-- VS separator -->
  <text x="600" y="305" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="400" fill="#6b7280">
    VS
  </text>

  <!-- Score -->
  <g>
    <rect x="450" y="240" width="120" height="180" rx="16" fill="url(#score)"/>
    <text x="510" y="350" text-anchor="middle" font-family="system-ui, sans-serif" font-size="100" font-weight="900" fill="#000">
      ${homeScore}
    </text>
  </g>
  <text x="600" y="350" text-anchor="middle" font-family="system-ui, sans-serif" font-size="60" font-weight="900" fill="#fbbf24">
    -
  </text>
  <g>
    <rect x="630" y="240" width="120" height="180" rx="16" fill="url(#score)"/>
    <text x="690" y="350" text-anchor="middle" font-family="system-ui, sans-serif" font-size="100" font-weight="900" fill="#000">
      ${awayScore}
    </text>
  </g>

  <!-- Bottom bar : who + points -->
  <rect x="60" y="470" width="1080" height="100" rx="16" fill="${accentColor}15" stroke="${accentColor}" stroke-width="1"/>

  <!-- Avatar -->
  <circle cx="135" cy="520" r="32" fill="${accentColor}"/>
  <text x="135" y="535" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#000">
    ${escapeXml(username.charAt(0).toUpperCase() || "?")}
  </text>

  <!-- Username -->
  <text x="190" y="510" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#ffffff">
    ${escapeXml(truncate(username, 25))}
  </text>
  <text x="190" y="540" font-family="system-ui, sans-serif" font-size="14" font-weight="400" fill="#9ca3af">
    pronostiqueur(euse) PRONO
  </text>

  ${
    typeof totalPoints === "number"
      ? `
  <!-- Total points chip -->
  <rect x="980" y="495" width="135" height="50" rx="25" fill="#fbbf24"/>
  <text x="1047" y="528" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#000">
    ⚡ ${totalPoints} pts
  </text>
  `
      : ""
  }

  <!-- Footer URL -->
  <text x="600" y="610" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#6b7280">
    pronofoot-phi.vercel.app
  </text>
</svg>`.trim();
  }

  async function downloadPNG() {
    setLoading(true);
    try {
      const svgString = generateSVG();
      const blob = await svgToPngBlob(svgString, 1200, 630);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prono-${slugify(homeTeam)}-vs-${slugify(awayTeam)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Carte téléchargée ! 📲 Partage-la sur Insta / WhatsApp");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setLoading(false);
    }
  }

  async function shareNative() {
    setLoading(true);
    try {
      const svgString = generateSVG();
      const blob = await svgToPngBlob(svgString, 1200, 630);
      const file = new File([blob], `prono.png`, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "Mon pronostic PRONO",
          text: `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam} · Mon prono officiel`,
          files: [file],
        });
      } else {
        await downloadPNG();
      }
    } catch (e) {
      // User cancelled or not supported
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="text-center text-xs font-bold uppercase tracking-wider text-emerald-400">
        📲 Partage mon pronostic
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          onClick={downloadPNG}
          disabled={loading}
          size="sm"
          className="bg-emerald-500 text-black hover:bg-emerald-400"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
          Télécharger PNG
        </Button>
        <Button
          onClick={shareNative}
          disabled={loading}
          size="sm"
          variant="outline"
        >
          <Share2 className="mr-1.5 h-4 w-4" />
          Partager
        </Button>
      </div>
    </div>
  );
}

// ====== Helpers ======

/** Convertit une chaîne SVG en blob PNG 1200x630 via Canvas natif */
async function svgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas non disponible"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (pngBlob) => {
          URL.revokeObjectURL(url);
          if (pngBlob) resolve(pngBlob);
          else reject(new Error("Conversion PNG échouée"));
        },
        "image/png",
        0.95
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Chargement SVG échoué"));
    };
    img.src = url;
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}