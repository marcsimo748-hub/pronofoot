"use client";

/**
 * Header principal — navigation, menu utilisateur, menu mobile.
 * 🥚 Easter egg : 5 clics sur le logo (compte admin connecté)
 *    → "🔓 PASS VIP ADMIN ACTIVÉ !" et l'onglet ⚙️ Admin apparaît.
 */

import { useRef, useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Radio, Newspaper, Music4, BarChart3, LayoutDashboard, Settings, LogOut,
  Menu, X, User2, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store/uiStore";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SessionUser } from "@/lib/types";

const NAV_LINKS = [
  { href: "/pronos", label: "Pronos", icon: Trophy },
  { href: "/scores", label: "Scores", icon: Radio },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/music", label: "Musique", icon: Music4 },
  { href: "/classement", label: "Classement", icon: BarChart3 },
];

export function Header({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const adminUnlocked = useUiStore((s) => s.adminUnlocked);
  const setAdminUnlocked = useUiStore((s) => s.setAdminUnlocked);

  // --- Easter egg : 5 clics sur le logo ---
  const clicks = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoClick = useCallback(() => {
    clicks.current += 1;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => (clicks.current = 0), 1600);

    if (clicks.current >= 5) {
      clicks.current = 0;
      if (user?.is_admin) {
        setAdminUnlocked(true);
        toast.success("🔓 PASS VIP ADMIN ACTIVÉ !", {
          description: "L'onglet ⚙️ Admin est maintenant visible en haut et en bas.",
        });
        router.push("/admin");
      } else {
        toast.error("⛔ Ce compte n'a pas les droits administrateur.", {
          description: "Connecte-toi avec un compte admin (voir ADMIN_EMAILS).",
        });
      }
    }
  }, [user, setAdminUnlocked, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const showAdmin = Boolean(user?.is_admin && adminUnlocked);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await getSupabaseBrowserClient().auth.signOut();
      toast.success("À bientôt ! 👋");
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo (5 clics = admin) */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 select-none"
          aria-label="PRONOFOOT — accueil"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 shadow-glow-sm text-xl">⚽</span>
          <span className="text-lg font-black tracking-tight">
            <span className="text-gradient">PRONOFOOT</span>
          </span>
        </button>

        {/* Navigation desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-foreground",
                pathname.startsWith(link.href) ? "text-foreground bg-secondary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {showAdmin && (
            <Link
              href="/admin"
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-foreground",
                pathname.startsWith("/admin") ? "text-amber-400 bg-amber-500/10" : "text-amber-400/80"
              )}
            >
              ⚙️ Admin
            </Link>
          )}
        </nav>

        {/* Zone utilisateur */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden lg:inline">Mon espace</span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                    {user.total_points} pts
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard" aria-label="Mon profil">
                <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Se déconnecter"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Connexion</Button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <Button size="sm" variant="glow" className="gap-1.5">
                  <Zap className="h-4 w-4" /> Jouer gratuitement
                </Button>
              </Link>
            </>
          )}

          {/* Burger mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-white/5 bg-background/95 backdrop-blur-xl"
          >
            <div className="container grid gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                    pathname.startsWith(link.href) ? "bg-secondary text-foreground" : "text-muted-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" /> {link.label}
                </Link>
              ))}
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground"
              >
                <User2 className="h-4 w-4" /> Mon espace {user ? `(${user.total_points} pts)` : ""}
              </Link>
              {showAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-amber-400"
                >
                  <Settings className="h-4 w-4" /> ⚙️ Admin
                </Link>
              )}
              {!user && (
                <Link href="/signup" className="mt-1">
                  <Button className="w-full" variant="glow">Jouer gratuitement</Button>
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
