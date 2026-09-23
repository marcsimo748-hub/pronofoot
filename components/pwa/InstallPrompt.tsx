"use client";

/**
 * 📱 INVITE D'INSTALLATION PWA (1 fois, masquable).
 * Android/Chrome : bouton « Installer » natif (beforeinstallprompt).
 * iPhone/Safari : petite instruction « Partager → Sur l'écran d'accueil ».
 * Ne s'affiche ni en mode app installée ni si le visiteur a fermé l'invite.
 */

import { useEffect, useState } from "react";
import { Smartphone, Share, X } from "lucide-react";

const DISMISS_KEY = "pwa_install_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    if (isIosSafari()) {
      setIos(true);
      setVisible(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* privé */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed inset-x-0 bottom-0 z-40 p-3 pb-4"
    >
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border bg-card/95 p-3 pl-4 shadow-glow-md backdrop-blur">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 font-black text-xl text-gradient">
          P.
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Installe l&apos;app PRONO</p>
          {ios ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Share className="h-3 w-3" /> iPhone : bouton Partager, puis « Sur l&apos;écran d&apos;accueil »
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Accès direct depuis ton écran d&apos;accueil, comme une vraie app.
            </p>
          )}
        </div>
        {!ios && (
          <button
            onClick={install}
            className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            <Smartphone className="h-3.5 w-3.5" /> Installer
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
