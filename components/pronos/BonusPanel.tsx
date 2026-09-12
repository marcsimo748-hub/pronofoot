"use client";

/**
 * BonusPanel — pronostics de saison (champions, coupes, LDC, buteur).
 * Points distribués quand l'admin clôture la catégorie.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BONUS_CATEGORIES, FEATURED_TEAMS } from "@/lib/constants";
import type { BonusPrediction } from "@/lib/types";

export function BonusPanel() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [settledMap, setSettledMap] = useState<Record<string, { answer: string; points: number }>>({});
  const [loading, setLoading] = useState(true);

  // Charge les bonus déjà pronostiqués
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("bonus_predictions").select("*").eq("user_id", user.id);
        const next: Record<string, string> = {};
        const saved: Record<string, boolean> = {};
        const settled: Record<string, { answer: string; points: number }> = {};
        (data ?? []).forEach((b: BonusPrediction) => {
          next[b.category] = b.answer;
          saved[b.category] = true;
          if (b.settled) settled[b.category] = { answer: b.answer, points: b.points_earned };
        });
        setAnswers(next);
        setSavedMap(saved);
        setSettledMap(settled);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(category: string, answer: string) {
    if (!answer?.trim()) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Connecte-toi d'abord.");
        return;
      }
      const { error } = await supabase.from("bonus_predictions").upsert(
        { user_id: user.id, category, answer: answer.trim() },
        { onConflict: "user_id,category" }
      );
      if (error) throw error;
      setSavedMap((m) => ({ ...m, [category]: true }));
      toast.success("Bonus enregistré ! 🏆");
    } catch {
      toast.error("Impossible d'enregistrer ce bonus.");
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Chargement des bonus…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        <p className="flex items-center gap-2 font-bold"><Gift className="h-4 w-4" /> Bonus de saison</p>
        <p className="mt-1 text-xs opacity-90">
          Prédis les grands vainqueurs de la saison et gagne jusqu'à <b>75 points</b> ! Les points sont
          crédités automatiquement quand l'admin clôture la catégorie.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {BONUS_CATEGORIES.map((cat) => {
          const options = cat.type === "team"
            ? FEATURED_TEAMS.filter((t) => !cat.league || t.league === cat.league).map((t) => t.name)
            : [];
          const settled = settledMap[cat.key];

          return (
            <div key={cat.key} className="rounded-xl border bg-card/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{cat.label}</p>
                <Badge variant="warning">+{cat.points} pts</Badge>
              </div>

              {settled ? (
                <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2.5 text-sm">
                  <span>Ta réponse : <b>{settled.answer}</b></span>
                  <Badge variant={settled.points > 0 ? "success" : "secondary"}>
                    {settled.points > 0 ? `🎉 +${settled.points} pts` : "❌ 0 pt"}
                  </Badge>
                </div>
              ) : cat.type === "team" ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={answers[cat.key] ?? ""}
                    onValueChange={(v) => {
                      setAnswers((a) => ({ ...a, [cat.key]: v }));
                      setSavedMap((m) => ({ ...m, [cat.key]: false }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Choisis une équipe…" /></SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant={savedMap[cat.key] ? "secondary" : "glow"}
                    onClick={() => save(cat.key, answers[cat.key])}
                    aria-label="Enregistrer"
                  >
                    {savedMap[cat.key] ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nom du joueur…"
                    value={answers[cat.key] ?? ""}
                    onChange={(e) => {
                      setAnswers((a) => ({ ...a, [cat.key]: e.target.value }));
                      setSavedMap((m) => ({ ...m, [cat.key]: false }));
                    }}
                  />
                  <Button
                    size="icon"
                    variant={savedMap[cat.key] ? "secondary" : "glow"}
                    onClick={() => save(cat.key, answers[cat.key])}
                    aria-label="Enregistrer"
                  >
                    {savedMap[cat.key] ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
