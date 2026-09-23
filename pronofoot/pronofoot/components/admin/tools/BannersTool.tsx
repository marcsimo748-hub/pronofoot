"use client";

/** 🏟️ Outil 5 : Bannières par championnat (affichées en haut de la page Pronos) */

import { saveSetting } from "../adminShared";
import { WallpaperField } from "./WallpapersTool";
import { LEAGUES, LEAGUE_CODES } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";

export function BannersTool({ settings }: { settings: SiteSettings }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        La bannière du championnat s'affiche en haut de la page Pronos quand l'onglet correspondant est sélectionné.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {LEAGUE_CODES.map((code) => (
          <WallpaperField
            key={code}
            label={`🏟️ ${LEAGUES[code].name}`}
            value={settings.leagues[code].banner_url}
            onSave={(url) =>
              saveSetting("leagues", { [code]: { ...settings.leagues[code], banner_url: url } })
            }
          />
        ))}
      </div>
    </div>
  );
}
