"use client";

/**
 * PRONO-VOYAGE — client principal (MODULE 6).
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
  VOYAGE_LEGAL_NOTE,
  humanDateFr,
  type FlightLink,
} from "./voyage-data";
import type { PronoVoyageTrip } from "@/lib/types";

interface Props {
  loggedIn: boolean;
  userId?: string;
  initialTrips: PronoVoyageTrip[];
  prefillCity?: string;
  deeplinkTrip?: string;
  /** ?discuter=1 : démarrer directement le chat privé sur le trajet */
  deeplinkChat?: boolean;
  autoPublish?: boolean;
}

function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export function VoyageClient({ loggedIn, userId, initialTrips, prefillCity, deeplinkTrip, deeplinkChat, autoPublish }: Props) {
  const [tab, setTab] = useState<"billets" | "trajets" | "guides">("billets");

  // ---- Filtres billets ----
  const prefillOrigin = ORIGINS.find((o) => o.name === prefillCity) ?? ORIGINS[0];
  const [mode, setMode] = useState<"avion" | "terre">("avion");
  const [origin, setOrigin] = useState(prefillOrigin.name);
  const [destAfrica, setDestAfrica] = useState(DEST_AFRICA[0].name);
  const [destEurope, setDestEurope] = useState(DEST_EUROPE[0].name);
  const [date, setDate] = useState(defaultDate());

  const originCity = ORIGINS.find((o) => o.name === origin) ?? ORIGINS[0];
  const destCity =
    mode === "avion"
      ? DEST_AFRICA.find((d) => d.name === destAfrica) ?? DEST_AFRICA[0]
      : DEST_EUROPE.find((d) => d.name === destEurope) ?? DEST_EUROPE[0];

  const links: FlightLink[] = useMemo(() => {
    if (mode === "avion") return buildFlightLinks(originCity, destCity, date);
    return [...buildGroundLinks(originCity, destCity, date), BLABLACAR_LINK];
  }, [mode, originCity, destCity, date]);

  return (
    <div className="space-y-6">
      {/* Onglets */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "billets" | "trajets" | "guides")}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="billets">🎫 Billets</TabsTrigger>
          <TabsTrigger value="trajets">🚗 Covoiturage</TabsTrigger>
          <TabsTrigger value="guides">📋 Formalités</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ================= BILLETS ================= */}
      {tab === "billets" && (
        <div className="space-y-6">
          {/* Mode */}
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
              ✈️ Avion, ici ↔ là-bas
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
              🚆 Train & Bus, Europe
            </button>
          </div>

          {/* Filtres */}
          <div className="grid gap-4 rounded-xl border border-white/10 bg-card/60 p-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Départ</Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGINS.map((o) => (
                    <SelectItem key={o.name} value={o.name}>
                      {o.name} ({o.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Destination</Label>
              {mode === "avion" ? (
                <Select value={destAfrica} onValueChange={setDestAfrica}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEST_AFRICA.map((d) => (
                      <SelectItem key={d.iata} value={d.name}>
                        {d.name} ({d.country})
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
                      <SelectItem key={d.iata} value={d.name}>
                        {d.name} ({d.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Date de départ</Label>
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Résumé */}
          <p className="text-center text-sm text-muted-foreground">
            🔎 {originCity.name} → {destCity.name}
            {date ? `, le ${humanDateFr(date)}` : ""} · PRONO ouvre les recherches
            correspondantes sur les plateformes officielles.
          </p>

          {/* Plateformes */}
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
                <p className="mb-4 flex-1 text-sm text-muted-foreground">{l.desc}</p>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gap-2" variant="glow">
                    🚀 Ouvrir la recherche
                  </Button>
                </a>
              </div>
            ))}
          </div>

          <p className="rounded-xl border border-white/5 bg-background/50 p-4 text-xs leading-relaxed text-muted-foreground">
            {VOYAGE_LEGAL_NOTE}
          </p>
        </div>
      )}

      {/* ================= COVOITURAGE ================= */}
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

      {/* ================= FORMALITÉS ================= */}
      {tab === "guides" && <VoyageGuides />}
    </div>
  );
}
