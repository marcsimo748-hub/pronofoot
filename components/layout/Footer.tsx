import Link from "next/link";
import { Trophy, Radio, Newspaper, Music4, BarChart3, MessageCircle, Mail } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

/** Footer — liens + crédits */
export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/60">
      <div className="container grid gap-8 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-lg">⚽</span>
            <span className="font-black text-gradient">{SITE_NAME}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Pronostics football, scores live, actualités, musique et assistant IA.
            100% gratuit, propulsé par Supabase &amp; Vercel.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Navigation</h3>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li><Link href="/pronos" className="flex items-center gap-2 hover:text-foreground"><Trophy className="h-3.5 w-3.5" /> Pronostics</Link></li>
            <li><Link href="/scores" className="flex items-center gap-2 hover:text-foreground"><Radio className="h-3.5 w-3.5" /> Scores live</Link></li>
            <li><Link href="/news" className="flex items-center gap-2 hover:text-foreground"><Newspaper className="h-3.5 w-3.5" /> Actualités</Link></li>
            <li><Link href="/music" className="flex items-center gap-2 hover:text-foreground"><Music4 className="h-3.5 w-3.5" /> Musique</Link></li>
            <li><Link href="/classement" className="flex items-center gap-2 hover:text-foreground"><BarChart3 className="h-3.5 w-3.5" /> Classements</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Barème</h3>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>🎯 Score exact → <span className="font-bold text-primary">5 pts</span></li>
            <li>✅ Bon résultat → <span className="font-bold text-primary">3 pts</span></li>
            <li>🏆 Champion → 50 pts · ⭐ LDC → 75 pts</li>
            <li>👟 Meilleur buteur → 25 pts</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 py-4">
        <div className="container space-y-2 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Pronofoot — Développé par <span className="font-semibold text-foreground">Leprince Matt</span> pour <span className="font-semibold text-foreground">MalihaprodBerlin</span>
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <a href="https://wa.me/4915210515347" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
              <MessageCircle className="h-3 w-3" /> +49 152 1051 5347
            </a>
            <a href="mailto:marcsimo748@gmail.com" className="flex items-center gap-1 hover:text-primary">
              <Mail className="h-3 w-3" /> marcsimo748@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
