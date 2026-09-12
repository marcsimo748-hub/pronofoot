import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Hors ligne" };

/**
 * PAGE HORS-LIGNE PWA (Mission 10) — servie par le service worker
 * quand le réseau est indisponible.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-6xl">📡</span>
      <h1 className="text-2xl font-black">Tu es hors ligne</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Pas de panique : tes données sont sauvegardées dans le cloud.
        Vérifie ta connexion internet puis réessaie.
      </p>
      <Link href="/">
        <Button variant="glow">🏠 Retour à l&apos;accueil</Button>
      </Link>
    </div>
  );
}
