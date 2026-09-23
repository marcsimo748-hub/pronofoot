"use client";

/** 🌄 Outil 6 : Arrière-plans par championnat (fond derrière les cartes de matchs) */

import { saveSetting } from "../adminShared";
import { WallpaperField } from "./WallpapersTool";
import { LEAGUES, LEAGUE_CODES } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";

export function LeagueBackgroundsTool({ settings }: { settings: SiteSettings }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        L'arrière-plan s'affiche derrière la liste des matchs du championnat sélectionné (avec un voile sombre pour rester lisible).
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {LEAGUE_CODES.map((code) => (
          <WallpaperField
            key={code}
            label={`🌄 ${LEAGUES[code].name}`}
            value={settings.leagues[code].background_url}
            onSave={(url) =>
              saveSetting("leagues", { [code]: { ...settings.leagues[code], background_url: url } })
            }
          />
        ))}
      </div>
    </div>
  );
}
