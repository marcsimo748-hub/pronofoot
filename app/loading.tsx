/**
 * loading.tsx — squelette global Next.js App Router.
 * Affiché automatiquement pendant la navigation entre Server Components
 * ou la résolution de Suspense boundaries. Discret, pas de layout shift.
 */

import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement"
      className="grid min-h-[50vh] place-items-center p-6"
    >
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-card/60 px-5 py-3 text-sm text-muted-foreground backdrop-blur">
        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
        <span>Chargement…</span>
      </div>
    </div>
  );
}
