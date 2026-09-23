"use client";

/**
 * HousingClient — recherche de logement Allemagne (MODULE 4) — FR/EN/DE.
 * Filtres (ville, loyer max, type) → liens de recherche officiels vers
 * WG-Gesucht / ImmoScout24 / Immowelt / Kleinanzeigen (100% légal, zéro copie)
 * + tableau de référence des loyers par ville.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useT, type Lang } from "@/lib/i18n";
import {
  HOUSING_CITIES,
  HOUSING_TYPES,
  buildPlatformLinks,
  type HousingType,
} from "./housing-data";

export function HousingClient({ prefillCity }: { prefillCity?: string }) {
  const { t, lang } = useT();
  const L = (lang || "fr") as Lang;
  const [cityName, setCityName] = useState(
    HOUSING_CITIES.some((c) => c.name === prefillCity) ? prefillCity! : "Berlin"
  );
  const [rent, setRent] = useState("");
  const [type, setType] = useState<HousingType>("wg");

  const city = useMemo(
    () => HOUSING_CITIES.find((c) => c.name === cityName) ?? HOUSING_CITIES[0],
    [cityName]
  );
  const rentMax = Number(rent) > 0 ? Number(rent) : undefined;
  const links = useMemo(() => buildPlatformLinks(city, type, rentMax), [city, type, rentMax]);

  const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  const platformIntroWording =
    type === "wg" ? t("hou.platformsIntroWG") : type === "studio" ? t("hou.platformsIntroStudio") : t("hou.platformsIntroApt");

  return (
    <div className="space-y-6">
      {/* ===== Filtres ===== */}
      <div className="rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm md:p-6">
        <h2 className="text-lg font-bold">{t("hou.searchTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("hou.searchIntro")}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{t("hou.cityLabel")}</Label>
            <select className={inputCls} value={cityName} onChange={(e) => setCityName(e.target.value)}>
              {HOUSING_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.labels[L]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="h-rent">{t("hou.rentLabel")}</Label>
            <Input
              id="h-rent"
              type="number"
              min={0}
              placeholder={t("hou.rentPh")}
              value={rent}
              onChange={(e) => setRent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("hou.typeLabel")}</Label>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as HousingType)}>
              {HOUSING_TYPES.map((tt) => (
                <option key={tt.value} value={tt.value}>
                  {tt.label[L]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Référence loyers de la ville choisie */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-white/5 bg-background/40 p-3 text-sm">
          <span className="text-muted-foreground">{t("hou.ref", { city: city.labels[L] })}</span>
          <Badge variant="secondary">
            {t("hou.refWGRoom", { price: city.wgRoom[L] })}
          </Badge>
          <Badge variant="outline">{t("hou.refColdRent", { price: city.coldRent[L] })}</Badge>
          <span className="text-xs text-muted-foreground">{t("hou.refHint")}</span>
        </div>
      </div>

      {/* ===== Plateformes ===== */}
      <div>
        <h2 className="text-lg font-bold">{t("hou.platformsTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("hou.platformsIntro", {
            wording: platformIntroWording,
            city: city.labels[L],
            rent: rentMax ? t("hou.upToRent", { rent: String(rentMax) }).replace(/^ /, "") : "",
          })}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {links.map((l, i) => (
            <motion.a
              key={l.name}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-xl">{l.emoji}</span> {l.name}
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{l.note[L]}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/60">{l.legal}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-semibold text-primary transition-colors group-hover:bg-primary/25">
                {t("hou.openLink")}
              </span>
            </motion.a>
          ))}
        </div>
      </div>

      {/* ===== Tableau de référence des loyers ===== */}
      <div className="rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm md:p-6">
        <h2 className="text-lg font-bold">{t("hou.tableTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("hou.tableIntro")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4">{t("hou.colCity")}</th>
                <th className="py-2 pr-4">{t("hou.colWG")}</th>
                <th className="py-2">{t("hou.colCold")}</th>
              </tr>
            </thead>
            <tbody>
              {HOUSING_CITIES.map((c) => (
                <tr
                  key={c.name}
                  className={cn(
                    "cursor-pointer border-b border-white/5 transition-colors hover:bg-secondary/40",
                    c.name === city.name && "bg-primary/10"
                  )}
                  onClick={() => setCityName(c.name)}
                >
                  <td className="py-2.5 pr-4 font-medium">{c.labels[L]}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{c.wgRoom[L]}</td>
                  <td className="py-2.5 text-muted-foreground">{c.coldRent[L]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
