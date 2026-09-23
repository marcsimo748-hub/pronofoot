"use client";

/** Bouton d'actualisation manuelle des news (appelle la route de sync serveur) */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshNewsButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function refresh() {
    setBusy(true);
    try {
      const res = await fetch("/api/news/sync", { method: "POST" });
      const json = await res.json();
      if (json.skipped === "throttled") {
        toast.info("Déjà à jour · le cache de 10 minutes protège les quotas 😉");
      } else {
        toast.success(`${json.fetched ?? 0} articles récupérés (${json.source ?? "?"}) ✅`);
        router.refresh();
      }
    } catch {
      toast.error("Synchronisation impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={refresh} disabled={busy} className="gap-2">
      <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Actualisation…" : "Actualiser"}
    </Button>
  );
}
