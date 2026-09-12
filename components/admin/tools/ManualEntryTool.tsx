"use client";

/** ⚽ Outil 3 : Saisie manuelle — résultats de matchs (recherche) + clôture des bonus */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Save, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { adminFetch } from "../adminShared";
import { formatMatchDate, cn } from "@/lib/utils";
import { LEAGUES, BONUS_CATEGORIES, FEATURED_TEAMS } from "@/lib/constants";
import type { Match } from "@/lib/types";

export function ManualEntryTool() {
  return (
    <Tabs defaultValue="results">
      <TabsList>
        <TabsTrigger value="results">⚽ Résultats de matchs</TabsTrigger>
        <TabsTrigger value="bonus">🏆 Bonus de saison</TabsTrigger>
      </TabsList>
      <TabsContent value="results" className="mt-4"><ResultsTab /></TabsContent>
      <TabsContent value="bonus" className="mt-4"><BonusTab /></TabsContent>
    </Tabs>
  );
}

function ResultsTab() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Record<string, { h: string; a: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  // Charge tous les matchs de la saison (une fois)
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("matches")
          .select("*")
          .order("match_date", { ascending: false })
          .limit(700);
        setMatches((data ?? []) as Match[]);
      } catch {
        /* silencieux */
      }
    })();
  }, []);

  // Recherche floue équipe / ligue
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return matches.slice(0, 12);
    return matches
      .filter(
        (m) =>
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q) ||
          (LEAGUES[m.league]?.name ?? "").toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [matches, query]);

  async function saveResult(m: Match) {
    const s = scores[m.id] ?? {};
    const h = Number(s.h), a = Number(s.a);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      toast.error("Saisis les deux scores (0 et plus).");
      return;
    }
    setBusyId(m.id);
    try {
      const result = await adminFetch<{ settled: number }>("/api/admin/match-result", {
        match_id: m.id,
        home: h,
        away: a,
      });
      toast.success(`Résultat enregistré ✅`, {
        description: `${result.settled} pronostic(s) calculé(s) automatiquement.`,
      });
      setMatches((list) =>
        list.map((x) => (x.id === m.id ? { ...x, home_score: h, away_score: a, status: "finished" } : x))
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une équipe ou un championnat… (ex : PSG, laliga)"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {filtered.map((m) => {
          const league = LEAGUES[m.league];
          const s = scores[m.id] ?? { h: m.home_score?.toString() ?? "", a: m.away_score?.toString() ?? "" };
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/60 p-3">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                style={{ backgroundColor: `${league?.color}22`, color: league?.color }}
              >
                {league?.short}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.home_team} vs {m.away_team}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatMatchDate(m.match_date)}
                  {m.home_score !== null && <span className="ml-2 font-bold text-emerald-400">● résultat: {m.home_score}-{m.away_score}</span>}
                </p>
              </div>
              <input
                type="number" min={0} placeholder="D" value={s.h}
                onChange={(e) => setScores((sc) => ({ ...sc, [m.id]: { ...s, h: e.target.value } }))}
                className="no-spinner h-9 w-12 rounded-md border border-input bg-background text-center font-bold"
                aria-label="Score domicile"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <input
                type="number" min={0} placeholder="E" value={s.a}
                onChange={(e) => setScores((sc) => ({ ...sc, [m.id]: { ...s, a: e.target.value } }))}
                className="no-spinner h-9 w-12 rounded-md border border-input bg-background text-center font-bold"
                aria-label="Score extérieur"
              />
              <Button size="sm" onClick={() => saveResult(m)} disabled={busyId === m.id} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> {busyId === m.id ? "…" : "Valider"}
              </Button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Aucun match trouvé.</p>
        )}
      </div>
    </div>
  );
}

function BonusTab() {
  const [category, setCategory] = useState(BONUS_CATEGORIES[0].key);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const cat = BONUS_CATEGORIES.find((c) => c.key === category)!;
  const options = cat.type === "team" ? FEATURED_TEAMS.filter((t) => !cat.league || t.league === cat.league).map((t) => t.name) : [];

  async function settle() {
    if (!answer.trim()) return toast.error("Choisis la bonne réponse.");
    setBusy(true);
    try {
      const res = await adminFetch<{ settled: number }>("/api/admin/bonus-settle", { category, answer: answer.trim() });
      toast.success("Bonus clôturé 🏆", { description: `${res.settled} joueur(s) concerné(s).` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
        <Gift className="mt-0.5 h-4 w-4 shrink-0" />
        Clôture une catégorie de bonus : les joueurs qui avaient la bonne réponse reçoivent
        automatiquement leurs points (le barème est appliqué en base).
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">Catégorie</span>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setAnswer(""); }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {BONUS_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label} (+{c.points} pts)</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">Bonne réponse</span>
          {cat.type === "team" ? (
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— choisir —</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <Input placeholder="Nom du buteur…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
          )}
        </label>
      </div>
      <Button onClick={settle} disabled={busy} className="gap-2">
        <Save className="h-4 w-4" /> {busy ? "Clôture…" : "Clôturer et distribuer les points"}
      </Button>
    </div>
  );
}
