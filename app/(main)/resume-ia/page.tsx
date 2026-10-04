// app/(main)/resume-ia/page.tsx
// Page Résumé IA du jour — publique, accessible sans login.

import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, CalendarDays, Trophy } from "lucide-react";
import { ResumeIaStatic } from "./ResumeIaStatic";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Résumé IA du jour · Les 5 matchs clés · PRONO",
  description:
    "Chaque jour, l'IA de PRONO résume les 5 matchs à suivre : africains, CAN, diaspora. Pronostique avant le coup d'envoi.",
};

export default function ResumeIaPage() {
  return (
    <div className="container space-y-8 py-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
          Résumé IA · Édition du jour
        </div>
        <h1 className="font-display text-4xl font-black sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent">
            Les 5 matchs à ne pas rater aujourd'hui
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Notre IA analyse le programme et te résume l'essentiel en 30 secondes.
        </p>
      </header>

      <ResumeIaStatic />

      <div className="flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-center text-xs text-muted-foreground">
        <p>
          <Trophy className="mr-1 inline h-3.5 w-3.5 text-amber-400" />
          Pronostique tes matchs avant le coup d'envoi.
        </p>
        <Link
          href="/prono-afrique"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black uppercase text-black transition hover:bg-emerald-400"
        >
          <CalendarDays className="h-3 w-3" /> Voir tous les matchs africains
        </Link>
      </div>
    </div>
  );
}
