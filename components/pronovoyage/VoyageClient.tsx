"use client";

/**
 * PRONO-VOYAGE — client principal (MODULE 6) — FR/EN/DE.
 * Onglet Billets : lanceur de recherche officiel (avion ici ↔ là-bas,
 * train & bus en Europe) avec les filtres du joueur, 100% légal.
 * Onglet Covoiturage : trajets de la communauté (TripsSection).
 * Onglet Formalités : guides voyage.
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TripsSection } from "./TripsSection";
import { VoyageGuides } from "./VoyageGuides";
import {
  ORIGINS,
  DEST_AFRICA,
  DEST_EUROPE,
  buildFlightLinks,
  buildGroundLinks,
  BLABLACAR_LINK,
  VOYAGE_LEGAL_NOTE_BY_LANG,
  humanDate,
  type FlightLink,
} from "./voyage-data";
import type { PronoVoyageTrip } from "@/lib/types";
import { useT, type Lang } from "@/lib/i18n";

interface Props {
  loggedIn: boolean;
  userId?: string;
  initialTrips: PronoVoyageTrip[];
  prefillCity?: string;
  deeplinkTrip?: string;
  deeplinkChat?: boolean;
  autoPublish?: boolean;
}

function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export function VoyageClient({ loggedIn, userId, initialTrips, prefillCity, deeplinkTrip, deeplinkChat, autoPublish }: Props) {
  const { t, lang } = useT();
  const L = (lang || "fr") as Lang;
  const [tab, setTab] = useState<"billets" | "trajets" | "guides">("billets");

  const prefillOrigin = ORIGINS.find((o) => o.nameFr === prefillCity) ?? ORIGINS[0];
  const [mode, setMode] = useState<"avion" | "terre">("avion");
  const [origin, setOrigin] = useState(prefillOrigin.key);
  const [destAfrica, setDestAfrica] = useState(DEST_AFRICA[0].key);
  const [destEurope, setDestEurope] = useState(DEST_EUROPE[0].key);
  const [date, setDate] = useState(defaultDate());

  const originCity = ORIGINS.find((o) => o.key === origin) ?? ORIGINS[0];
  const destCity =
    mode === "avion"
      ? DEST_AFRICA.find((d) => d.key === destAfrica) ?? DEST_AFRICA[0]
      : DEST_EUROPE.find((d) => d.key === destEurope) ?? DEST_EUROPE[0];

  const links: FlightLink[] = useMemo(() => {
    const base = mode === "avion" ? buildFlightLinks(originCity, destCity, date) : buildGroundLinks(originCity, destCity, date);
    return mode === "avion" ? base : [...base, BLABLACAR_LINK];
  }, [mode, originCity, destCity, date]);

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "billets" | "trajets" | "guides")}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="billets">{t("voy.tabTickets")}</TabsTrigger>
          <TabsTrigger value="trajets">{t("voy.tabCarpool")}</TabsTrigger>
          <TabsTrigger value="guides">{t("voy.tabGuides")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "billets" && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("avion")}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors sm:flex-none ${
                mode === "avion"
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-white/10 bg-secondary/40 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {t("voy.modePlane")}
            </button>
            <button
              type="button"
              onClick={() => setMode("terre")}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors sm:flex-none ${
                mode === "terre"
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-white/10 bg-secondary/40 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {t("voy.modeGround")}
            </button>
          </div>

          <div className="grid gap-4 rounded-xl border border-white/10 bg-card/60 p-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("voy.dep")}</Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGINS.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      {o.labels[L]} ({o.country[L]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("voy.dest")}</Label>
              {mode === "avion" ? (
                <Select value={destAfrica} onValueChange={setDestAfrica}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEST_AFRICA.map((d) => (
                      <SelectItem key={d.key} value={d.key}>
                        {d.labels[L]} ({d.country[L]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={destEurope} onValueChange={setDestEurope}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEST_EUROPE.map((d) => (
                      <SelectItem key={d.key} value={d.key}>
                        {d.labels[L]} ({d.country[L]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("voy.date")}</Label>
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {t("voy.summary", {
              origin: originCity.labels[L],
              dest: destCity.labels[L],
              date: date ? t("voy.summaryDate", { date: humanDate(date, L) }) : "",
            })}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((l) => (
              <div
                key={l.name}
                className="flex flex-col rounded-xl border border-white/10 bg-card/70 p-5 transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-2xl">
                    {l.emoji}
                  </span>
                  <div>
                    <p className="font-bold">{l.name}</p>
                    <p className="text-[11px] text-muted-foreground">{l.official}</p>
                  </div>
                </div>
                <p className="mb-4 flex-1 text-sm text-muted-foreground">{l.desc[L]}</p>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gap-2" variant="glow">
                    {t("voy.openSearch")}
                  </Button>
                </a>
              </div>
            ))}
          </div>

          <p className="rounded-xl border border-white/5 bg-background/50 p-4 text-xs leading-relaxed text-muted-foreground">
            {VOYAGE_LEGAL_NOTE_BY_LANG[L] ?? VOYAGE_LEGAL_NOTE_BY_LANG.fr}
          </p>
        </div>
      )}

      {tab === "trajets" && (
        <TripsSection
          loggedIn={loggedIn}
          userId={userId}
          initialTrips={initialTrips}
          deeplinkTrip={deeplinkTrip}
          deeplinkChat={deeplinkChat}
          autoPublish={autoPublish}
        />
      )}

      {tab === "guides" && <VoyageGuides />}
    </div>
  );
}
