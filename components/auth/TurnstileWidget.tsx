"use client";

/**
 * 🤖 Widget Cloudflare Turnstile — protection anti-robot des formulaires.
 * Clé de site récupérée via /api/security/captcha-config (publique par conception).
 * Si aucune clé n'est configurée, le widget ne s'affiche pas et les formulaires
 * fonctionnent comme avant. La VÉRIFICATION du jeton est faite par Supabase Auth.
 *
 * Robustesse :
 *   • polling de secours si le callback de chargement du script est manqué ;
 *   • au bout de 12 s sans jeton : message clair + bouton Réessayer
 *     (certains navigateurs sans accélération graphique ou avec un bloqueur de
 *     publicité empêchent la vérification de aboutir).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

type TurnstileConfig = { enabled: boolean; siteKey: string | null };
let configCache: TurnstileConfig | null = null;

/** Charge la config du captcha (mise en cache pour toute la session) */
export function useCaptchaConfig() {
  const [config, setConfig] = useState<TurnstileConfig | null>(configCache);
  useEffect(() => {
    if (configCache) return;
    let alive = true;
    fetch("/api/security/captcha-config")
      .then((r) => r.json())
      .then((c: TurnstileConfig) => {
        configCache = c;
        if (alive) setConfig(c);
      })
      .catch(() => {
        // Config injoignable : on ne bloque pas le formulaire (captcha considéré inactif)
        const fallback: TurnstileConfig = { enabled: false, siteKey: null };
        configCache = fallback;
        if (alive) setConfig(fallback);
      });
    return () => {
      alive = false;
    };
  }, []);
  return config;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const config = useCaptchaConfig();
  const holderRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const gotTokenRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0); // force un nouveau rendu au Réessayer

  // Charge le script Turnstile une seule fois
  useEffect(() => {
    if (!config?.enabled || !config.siteKey) return;
    if (document.getElementById("cf-turnstile-script")) {
      if (window.turnstile) setScriptReady(true);
      return; // le polling de secours ci-dessous prendra le relais
    }
    window.onTurnstileLoaded = () => setScriptReady(true);
    const s = document.createElement("script");
    s.id = "cf-turnstile-script";
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, [config?.enabled, config?.siteKey]);

  // Polling de secours : si le callback global a été manqué (navigation client,
  // script déjà en cours de chargement), on détecte l'API dès qu'elle existe.
  useEffect(() => {
    if (!config?.enabled || !config?.siteKey || scriptReady) return;
    const iv = setInterval(() => {
      if (window.turnstile) setScriptReady(true);
    }, 300);
    const stop = setTimeout(() => clearInterval(iv), 20_000);
    return () => {
      clearInterval(iv);
      clearTimeout(stop);
    };
  }, [config?.enabled, config?.siteKey, scriptReady]);

  const render = useCallback(() => {
    if (!holderRef.current || !config?.siteKey || widgetIdRef.current !== null) return;
    if (!window.turnstile) return;
    gotTokenRef.current = false;
    setTimedOut(false);
    widgetIdRef.current = window.turnstile.render(holderRef.current, {
      sitekey: config.siteKey,
      theme: "dark",
      language: "fr",
      callback: (t: string) => {
        gotTokenRef.current = Boolean(t);
        onToken(t);
      },
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }, [config?.siteKey, onToken]);

  useEffect(() => {
    if (scriptReady) render();
  }, [scriptReady, render, attempt]);

  // Minuteur : au bout de 12 s sans jeton, on explique et on propose un Réessayer
  useEffect(() => {
    if (!config?.enabled || gotTokenRef.current) return;
    const t = setTimeout(() => {
      if (!gotTokenRef.current) setTimedOut(true);
    }, 12_000);
    return () => clearTimeout(t);
  }, [config?.enabled, attempt]);

  // Reset externe (après un login refusé, le jeton consommé doit être renouvelé)
  useEffect(() => {
    const resetWidget = () => {
      if (widgetIdRef.current !== null) window.turnstile?.reset(widgetIdRef.current);
    };
    window.addEventListener("turnstile:reset", resetWidget);
    return () => {
      window.removeEventListener("turnstile:reset", resetWidget);
      if (widgetIdRef.current !== null) window.turnstile?.remove(widgetIdRef.current);
    };
  }, []);

  if (!config?.enabled || !config.siteKey) return null;

  return (
    <div className="space-y-2" aria-label="Vérification anti-robot">
      <div ref={holderRef} className="flex justify-center" />
      {timedOut && !gotTokenRef.current && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          <p className="font-bold text-amber-300">Le vérificateur anti-robot n&apos;aboutit pas 😕</p>
          <p className="mt-1 text-muted-foreground">
            Ton navigateur bloque la vérification (accélération graphique désactivée, bloqueur de
            publicité, ou extension de confidentialité). Essaie : activer l&apos;accélération
            matérielle dans les réglages du navigateur puis le redémarrer, désactiver les
            bloqueurs pour ce site, ou utiliser un autre navigateur / ton téléphone.
          </p>
          <button
            type="button"
            onClick={() => {
              if (widgetIdRef.current !== null) {
                window.turnstile?.remove(widgetIdRef.current);
                widgetIdRef.current = null;
              }
              onToken("");
              setAttempt((a) => a + 1);
            }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-semibold text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
