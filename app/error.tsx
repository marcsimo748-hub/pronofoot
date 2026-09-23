"use client";

/**
 * error.tsx — boundary d'erreur global (NON root).
 * Capture les erreurs runtime des pages et montre un message clair + retour.
 * Aucune chaîne en dur n'est utile ici (les i18n libs ne sont pas garanties chargées).
 */

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log discret côté console pour debug ; pas de PII ni stacktrace visible
    // eslint-disable-next-line no-console
    console.error("[PRONO] page error", error?.digest ?? error?.message ?? error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center p-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-red-500/30 bg-red-500/10">
          <AlertTriangle className="h-7 w-7 text-red-400" aria-hidden />
        </div>
        <p className="text-5xl font-black text-gradient">500</p>
        <h1 className="mt-3 text-lg font-semibold">Petit hors-jeu côté serveur</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur inattendue s'est produite. L'équipe technique a été notifiée.
          Tu peux réessayer ou revenir à l'accueil.
        </p>
        {error?.digest && (
          <p className="mt-3 text-[11px] text-muted-foreground/70">
            Réf. : <code className="font-mono">{error.digest}</code>
          </p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="glow" onClick={reset}>Réessayer</Button>
          <Button variant="outline" asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
