"use client";

/** 🔴 Outil 2 : Mode Testeur LIVE — simule des scores en direct (sans toucher aux vrais matchs) */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { FlaskConical, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { adminFetch } from "../adminShared";

export function LiveTesterTool({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (state: { active: boolean }) => void;
}) {
  const simRef = useRef(false);

  // Tant que le mode est actif, on rafraîchit les scores simulés toutes les 15 s
  useEffect(() => {
    if (!active) return;
    const tick = async () => {
      if (simRef.current || document.visibilityState !== "visible") return;
      simRef.current = true;
      try {
        await adminFetch("/api/admin/test-live", { action: "simulate" });
      } catch {
        /* silencieux */
      } finally {
        simRef.current = false;
      }
    };
    void tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, [active]);

  async function toggle(value: boolean) {
    try {
      await adminFetch("/api/admin/test-live", { action: value ? "start" : "stop" });
      onChange({ active: value });
      toast.success(value ? "🔴 Mode testeur activé — des scores fictifs apparaissent dans le ticker." : "Mode testeur désactivé.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function clear() {
    try {
      await adminFetch("/api/admin/test-live", { action: "clear" });
      toast.success("Scores de test supprimés 🧹");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Génère de faux matchs « en direct » dans le cache <code>live_scores</code> pour vérifier le ticker,
        la page Scores et le temps réel — <b>sans impact sur les pronostics ni les points</b>.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 font-semibold">
          <Switch checked={active} onCheckedChange={toggle} />
          {active ? "Testeur actif (maj toutes les 15 s)" : "Testeur inactif"}
        </label>
        <Button variant="destructive" size="sm" onClick={clear} className="gap-1.5">
          <Trash2 className="h-3.5 w-3.5" /> Effacer les scores de test
        </Button>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FlaskConical className="h-3.5 w-3.5" /> Astuce : garde cette page ouverte pendant le test.
      </p>
    </div>
  );
}
