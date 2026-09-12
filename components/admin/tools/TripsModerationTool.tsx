"use client";

/**
 * Outil admin 13 — MODÉRATION COVOITURAGE (MODULE 6).
 * Liste tous les trajets (y compris masqués via RLS admin),
 * masquer / afficher / supprimer, signalements visibles.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { humanDateFr } from "@/components/pronovoyage/voyage-data";
import type { PronoVoyageTrip } from "@/lib/types";

export function TripsModerationTool() {
  const [trips, setTrips] = useState<PronoVoyageTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // RLS admin : tous les trajets, y compris masqués
      const res = await fetch(`/api/prono-voyage?origin=${encodeURIComponent(origin)}&dest=`);
      if (res.ok) {
        const json = await res.json();
        setTrips(json.trips ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [origin]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const setStatus = async (id: string, status: "active" | "hidden" | "removed") => {
    setBusyId(id);
    try {
      const res = await fetch("/api/prono-voyage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setTrips((l) =>
          status === "removed" ? l.filter((t) => t.id !== id) : l.map((t) => (t.id === id ? { ...t, status } : t))
        );
        if (status === "hidden") toast.warning("Trajet masqué");
        else toast.success("Trajet réaffiché");
      } else {
        toast.error("Action impossible");
      }
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string, label: string) => {
    if (!window.confirm(`Supprimer définitivement « ${label} » ?`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/prono-voyage?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTrips((l) => l.filter((t) => t.id !== id));
        toast.success("Trajet supprimé");
      } else {
        toast.error("Suppression impossible");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="🔍 Filtrer par ville de départ…"
          className="sm:max-w-sm"
          maxLength={40}
        />
        <div className="text-xs text-muted-foreground">
          {trips.length} trajet{trips.length > 1 ? "s" : ""} ·{" "}
          {trips.filter((t) => t.status === "hidden").length} masqué(s) ·{" "}
          {trips.filter((t) => t.reports_count > 0).length} signalé(s)
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : trips.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
          Aucun trajet (ou table pas encore créée, SQL 009).
        </p>
      ) : (
        <div className="space-y-2">
          {trips.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-2 rounded-lg border border-white/10 bg-card/60 p-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  🚗 {t.origin_city} → {t.dest_city}
                </p>
                <p className="text-xs text-muted-foreground">
                  📅 {humanDateFr(t.trip_date)} · {t.seats} place(s) · {t.price_eur} € ·{" "}
                  {t.author?.username ?? "?"}
                  {t.reports_count > 0 && (
                    <span className="ml-1 text-red-400">· 🚩 {t.reports_count} signalement(s)</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {t.status === "active" ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400">Actif</Badge>
                ) : t.status === "hidden" ? (
                  <Badge className="bg-amber-500/15 text-amber-400">Masqué</Badge>
                ) : (
                  <Badge variant="secondary">{t.status}</Badge>
                )}
                {t.status === "hidden" ? (
                  <Button size="sm" variant="outline" disabled={busyId === t.id} onClick={() => void setStatus(t.id, "active")}>
                    👁️ Afficher
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled={busyId === t.id} onClick={() => void setStatus(t.id, "hidden")}>
                    🚫 Masquer
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busyId === t.id}
                  onClick={() => void remove(t.id, `${t.origin_city} → ${t.dest_city}`)}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
