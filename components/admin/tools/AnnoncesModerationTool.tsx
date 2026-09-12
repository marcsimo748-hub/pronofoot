"use client";

/**
 * Outil admin 12 — MODÉRATION DES ANNONCES (MODULE 5).
 * Liste toutes les annonces (y compris masquées via RLS admin),
 * masquer / afficher / supprimer, signalements visibles.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { categoryInfo, timeAgoFr } from "@/components/pronoannonces/annonces-data";
import type { PronoAnnonce } from "@/lib/types";

export function AnnoncesModerationTool() {
  const [annonces, setAnnonces] = useState<PronoAnnonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // RLS admin : toutes les annonces, y compris masquées et supprimées
      const res = await fetch("/api/prono-annonces?category=&city=&q=" + encodeURIComponent(q));
      if (res.ok) {
        const json = await res.json();
        setAnnonces(json.annonces ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const setStatus = async (id: string, status: "active" | "hidden" | "removed") => {
    setBusyId(id);
    try {
      const res = await fetch("/api/prono-annonces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setAnnonces((l) =>
          status === "removed" ? l.filter((a) => a.id !== id) : l.map((a) => (a.id === id ? { ...a, status } : a))
        );
        if (status === "hidden") {
          toast.warning("Annonce masquée");
        } else {
          toast.success("Annonce réaffichée");
        }
      } else {
        toast.error("Action impossible");
      }
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer définitivement « ${title} » ?`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/prono-annonces?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnonces((l) => l.filter((a) => a.id !== id));
        toast.success("Annonce supprimée");
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
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Rechercher par titre ou description…"
          className="sm:max-w-sm"
          maxLength={60}
        />
        <div className="text-xs text-muted-foreground">
          {annonces.length} annonce{annonces.length > 1 ? "s" : ""} ·{" "}
          {annonces.filter((a) => a.status === "hidden").length} masquée(s) ·{" "}
          {annonces.filter((a) => a.reports_count > 0).length} signalée(s)
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : annonces.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
          Aucune annonce (ou table pas encore créée — SQL 008).
        </p>
      ) : (
        <div className="space-y-2">
          {annonces.map((a) => {
            const cat = categoryInfo(a.category);
            return (
              <div
                key={a.id}
                className="flex flex-col gap-2 rounded-lg border border-white/10 bg-card/60 p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {cat.emoji} {a.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    📍 {a.city || "—"} · {a.author?.username ?? "?"} · {timeAgoFr(a.created_at)}
                    {a.reports_count > 0 && (
                      <span className="ml-1 text-red-400">· 🚩 {a.reports_count} signalement(s)</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === "active" ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400">Active</Badge>
                  ) : a.status === "hidden" ? (
                    <Badge className="bg-amber-500/15 text-amber-400">Masquée</Badge>
                  ) : (
                    <Badge variant="secondary">{a.status}</Badge>
                  )}
                  {a.status === "hidden" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === a.id}
                      onClick={() => void setStatus(a.id, "active")}
                    >
                      👁️ Afficher
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === a.id}
                      onClick={() => void setStatus(a.id, "hidden")}
                    >
                      🚫 Masquer
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === a.id}
                    onClick={() => void remove(a.id, a.title)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
