"use client";

/**
 * Barre de navigation basse (mobile-first) — visible sur petits écrans.
 * Inclut l'onglet ⚙️ Admin quand le mode admin est déverrouillé.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Radio, Newspaper, Music4, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store/uiStore";
import type { SessionUser } from "@/lib/types";

export function MobileNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const adminUnlocked = useUiStore((s) => s.adminUnlocked);
  const showAdmin = Boolean(user?.is_admin && adminUnlocked);

  const items = [
    { href: "/", label: "Accueil", icon: BarChart3 },
    { href: "/pronos", label: "Pronos", icon: Trophy },
    { href: "/scores", label: "Scores", icon: Radio },
    { href: "/news", label: "News", icon: Newspaper },
    { href: "/music", label: "Musique", icon: Music4 },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-background/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-14 grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        {showAdmin ? (
          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
              pathname.startsWith("/admin") ? "text-amber-400" : "text-amber-400/70"
            )}
          >
            <Settings className="h-4 w-4" />
            Admin
          </Link>
        ) : (
          <Link
            href="/classement"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
              pathname.startsWith("/classement") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Top
          </Link>
        )}
      </div>
    </nav>
  );
}
