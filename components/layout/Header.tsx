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
  Menu, X, User2, Zap, Briefcase, UserRound, ShieldCheck, Home, Megaphone, ChevronDown, Plane, MessageCircle } from "lucide-react";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store/uiStore";
import { LANGS, useT } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SessionUser } from "@/lib/types";

const NAV_LINKS = [
  { href: "/pronos", tKey: "nav.pronos", icon: Trophy },
  { href: "/scores", tKey: "nav.scores", icon: Radio },
  { href: "/news", tKey: "nav.news", icon: Newspaper },
  { href: "/music", tKey: "nav.music", icon: Music4 },
  { href: "/classement", tKey: "nav.classement", icon: BarChart3 },
] as const;

const MODULE_LINKS = [
  { href: "/prono-job", tKey: "nav.job", icon: Briefcase },
  { href: "/prono-profil", tKey: "nav.profile", icon: UserRound },
  { href: "/prono-visa", tKey: "nav.visa", icon: ShieldCheck },
  { href: "/prono-housing", tKey: "nav.housing", icon: Home },
  { href: "/prono-annonces", tKey: "nav.annonces", icon: Megaphone },
  { href: "/prono-voyage", tKey: "nav.voyage", icon: Plane },
] as const;

export function Header({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Badge messages non-lus (chat privé)
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/prono-chat/conversations");
        if (!res.ok) return;
        const json = await res.json();
        if (alive) {
          const total = (json.conversations ?? []).reduce(
            (acc: number, c: { unread?: number }) => acc + (c.unread ?? 0),
            0,
          );
          setUnread(total);
        }
      } catch {
        /* réseau : on garde le badge actuel */
      }
    };
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user, pathname]);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const adminUnlocked = useUiStore((s) => s.adminUnlocked);
  const setAdminUnlocked = useUiStore((s) => s.setAdminUnlocked);
  const { lang, setLang, t } = useT();

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
          aria-label="PRONO, accueil"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 shadow-glow-sm text-xl">⚽</span>
          <span className="text-lg font-black tracking-tight">
            <span className="text-gradient">PRONO</span>
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
              {t(link.tKey)}
            </Link>
          ))}

          {/* Menu déroulant Modules */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setModulesOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-foreground",
                MODULE_LINKS.some((m) => pathname.startsWith(m.href)) ? "text-foreground bg-secondary" : "text-muted-foreground"
              )}
              aria-expanded={modulesOpen}
            >
              🧩 {t("nav.modules")}{" "}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", modulesOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {modulesOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setModulesOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-white/10 bg-card/95 p-1 shadow-xl backdrop-blur-xl"
                  >
                    {MODULE_LINKS.map((m) => (
                      <Link
                        key={m.href}
                        href={m.href}
                        onClick={() => setModulesOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          pathname.startsWith(m.href)
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        )}
                      >
                        <m.icon className="h-4 w-4" /> {t(m.tKey)}
                      </Link>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          {showAdmin && (
            <Link
              href="/admin"
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-foreground",
                pathname.startsWith("/admin") ? "text-amber-400 bg-amber-500/10" : "text-amber-400/80"
              )}
            >
              {t("nav.admin")}
            </Link>
          )}
        </nav>

        {/* Zone utilisateur */}
        <div className="flex items-center gap-2">
          {/* Sélecteur de langue FR / EN / DE */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/5 bg-secondary/50 p-0.5" role="group" aria-label="Langue / Language / Sprache">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
                  lang === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          {user ? (
            <>
              <NotificationsBell />
              <Link href="/messages" className="relative hidden sm:block" aria-label="Mes messages privés">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/dashboard" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden lg:inline">{t("nav.space")}</span>
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
                <Button variant="ghost" size="sm">{t("nav.login")}</Button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <Button size="sm" variant="glow" className="gap-1.5">
                  <Zap className="h-4 w-4" /> {t("nav.playFree")}
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
                  <link.icon className="h-4 w-4" /> {t(link.tKey)}
                </Link>
              ))}
              <div className="my-1 border-t border-white/5" />
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                🧩 {t("nav.modules")}
              </p>
              {MODULE_LINKS.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                    pathname.startsWith(m.href) ? "bg-secondary text-foreground" : "text-muted-foreground"
                  )}
                >
                  <m.icon className="h-4 w-4" /> {t(m.tKey)}
                </Link>
              ))}
              {user && (
                <Link
                  href="/messages"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  <MessageCircle className="h-4 w-4" /> Messages privés
                  {unread > 0 && (
                    <span className="ml-1 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              )}
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
