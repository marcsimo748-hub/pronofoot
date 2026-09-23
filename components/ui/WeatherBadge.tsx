"use client";

/**
 * ☁️ WeatherBadge — petit badge météo de Berlin (météo actuelle).
 * S'adapte au thème saisonnier + applique un overlay CSS très léger
 * (pluie / neige / soleil) si tu veux. AUCUN appel bloquant : si la
 * météo est indisponible (offline, API HS), on affiche juste rien.
 *
 * Placé en bas à gauche, fixe, il sert aussi de mini dashboard météo
 * dans le bandeau d'accueil. Clic = ouvrir la météo Open-Meteo Berlin.
 */

import { useEffect, useState } from "react";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Zap, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { getWeatherBerlin, weatherKind, type WeatherNow } from "@/lib/weather/openMeteo";

export function WeatherBadge() {
  const { lang } = useT();
  const [w, setW] = useState<WeatherNow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const w = await getWeatherBerlin(lang);
      if (!cancelled) setW(w);
    })();
    return () => {
      cancelled = true;
    };
    // Refresh après 30 min
    const id = setInterval(async () => {
      const w = await getWeatherBerlin(lang);
      if (!cancelled) setW(w);
    }, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [lang]);

  if (!w) {
    return (
      <div className="fixed bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-glow-sm backdrop-blur">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Berlin</span>
      </div>
    );
  }

  const Icon =
    weatherKind(w.code, w.tempC) === "snowy"
      ? CloudSnow
      : weatherKind(w.code, w.tempC) === "rainy" || weatherKind(w.code, w.tempC) === "stormy"
        ? CloudRain
        : weatherKind(w.code, w.tempC) === "clear"
          ? Sun
          : Cloud;

  return (
    <a
      href="https://open-meteo.com/en/berlin"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 z-20 flex items-center gap-2 rounded-full border bg-card/90 px-3 py-1.5 text-xs shadow-glow-sm backdrop-blur transition-colors hover:bg-card"
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="font-medium">{w.tempC}°C</span>
      <span className="text-muted-foreground">{w.label}</span>
      <Wind className="h-3 w-3 text-muted-foreground opacity-70" />
      <span className="text-muted-foreground">{w.windKph} km/h</span>
      {w.code >= 95 && <Zap className="h-3 w-3 text-amber-400" />}
      <span className="text-muted-foreground">Berlin</span>
    </a>
  );
}
