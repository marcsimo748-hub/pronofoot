"use client";

/**
 * ⚽ Outil 3 : Résultats & Pronostics.
 *  • ⏳ À clôturer : matchs passés sans résultat (panne API…) → saisir le score
 *    à la main OU le récupérer via l'API en 1 clic
 *  • ✅ Terminés : résultats enregistrés + pronostics de chacun (points inclus)
 *  • 📅 À venir : prochains matchs
 * Chaque match est dépliable → tous les pronos des joueurs (pseudos, scores, points).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Save, Gift, ChevronDown, RefreshCw, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { adminFetch } from "../adminShared";
import { formatMatchDate, cn } from "@/lib/utils";
import { LEAGUES, BONUS_CATEGORIES, FEATURED_TEAMS } from "@/lib/constants";
import type { Match } from "@/lib/types";

type Pred = { username: string; avatar_url: string | null; home_score: number; away_score: number; points_earned: number; calculated: boolean };

export function ManualEntryTool() {
  return (
    <Tabs defaultValue="results">
      <TabsList>
        <TabsTrigger value="results">⚽ Résultats & pronostics</TabsTrigger>
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
  const [backfilling, setBackfilling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"todo" | "done" | "upcoming">("todo");
  const [preds, setPreds] = useState<Record<string, Pred[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from("matches").select("*").order("match_date", { ascending: false }).limit(700);
      setMatches((data ?? []) as Match[]);
    } catch {
      toast.error("Impossible de charger les matchs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  // Les 3 vues
  const now = Date.now();
  const lists = useMemo(() => {
    const todo = matches
      .filter((m) => m.home_score === null && new Date(m.match_date).getTime() < now - 90 * 60_000)
      .sort((a, b) => b.match_date.localeCompare(a.match_date)); // plus récents d'abord
    const done = matches
      .filter((m) => m.home_score !== null)
      .sort((a, b) => b.match_date.localeCompare(a.match_date))
      .slice(0, 40);
    const upcoming = matches
      .filter((m) => m.home_score === null && new Date(m.match_date).getTime() >= now - 90 * 60_000)
      .sort((a, b) => a.match_date.localeCompare(b.match_date))
      .slice(0, 30);
    return { todo, done, upcoming };
  }, [matches, now]);

  const visible = useMemo(() => {
    const base = view === "todo" ? lists.todo : view === "done" ? lists.done : lists.upcoming;
    const q = query.trim().toLowerCase();
    if (!q) return base.slice(0, 25);
    return base
      .filter(
        (m) =>
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q) ||
          (LEAGUES[m.league]?.name ?? "").toLowerCase().includes(q)
      )
      .slice(0, 25);
  }, [lists, view, query]);

  // Pronos des matchs affichés (une seule requête, clé service côté serveur)
  useEffect(() => {
    if (visible.length === 0) return;
    const missing = visible.filter((m) => preds[m.id] === undefined).map((m) => m.id);
    if (missing.length === 0) return;
    (async () => {
      try {
        const data = await adminFetch<{ predictions: Record<string, Pred[]> }>("/api/admin/match-predictions", {
          match_ids: missing,
        });
        setPreds((p) => ({ ...p, ...data.predictions }));
      } catch {
        /* silencieux — réessaiera au prochain rendu */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.map((m) => m.id).join(","), view]);

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
        description: `${result.settled} pronostic(s) calculé(s) · points et classements mis à jour.`,
      });
      setMatches((list) =>
        list.map((x) => (x.id === m.id ? { ...x, home_score: h, away_score: a, status: "finished" } : x))
      );
      // recharger les pronos du match (points recalculés)
      try {
        const data = await adminFetch<{ predictions: Record<string, Pred[]> }>("/api/admin/match-predictions", {
          match_ids: [m.id],
        });
        setPreds((p) => ({ ...p, ...data.predictions }));
      } catch { /* silencieux */ }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function backfill() {
    setBackfilling(true);
    try {
      const data = await adminFetch<{ imported: number; settled: number }>("/api/admin/backfill-results", {});
      toast.success("Rattrapage terminé ✅", {
        description: `${data.settled} pronostic(s) clôturé(s) · ${data.imported} nouveau(x) match(s) importé(s).`,
      });
      await loadMatches();
      setPreds({}); // recharger les points
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du rattrapage.");
    } finally {
      setBackfilling(false);
    }
  }

  const todoCount = lists.todo.length;

  return (
    <div className="space-y-4">
      {/* Bandeau rattrapage */}
      {todoCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-sm">
            <strong>{todoCount} match(s) passé(s) sans résultat</strong> (panne API, période sans synchro…).
            Récupère les scores réels en 1 clic, ou saisis-les à la main ci-dessous.
          </p>
          <Button size="sm" onClick={backfill} disabled={backfilling} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${backfilling ? "animate-spin" : ""}`} />
            {backfilling ? "Récupération…" : "🔄 Récupérer via l'API"}
          </Button>
        </div>
      )}

      {/* Vues */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["todo", `⏳ À clôturer${todoCount ? ` (${todoCount})` : ""}`],
            ["done", "✅ Terminés"],
            ["upcoming", "📅 À venir"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              view === v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
            )}
          >
            {label}
          </button>
        ))}
        <div className="relative ml-auto min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une équipe…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
        {loading && <p className="p-6 text-center text-sm text-muted-foreground">Chargement…</p>}
        {!loading && visible.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {view === "todo" ? "Rien à clôturer · tous les matchs passés ont leur résultat ✅" : "Aucun match."}
          </p>
        )}
        {visible.map((m) => {
          const league = LEAGUES[m.league];
          const s = scores[m.id] ?? { h: m.home_score?.toString() ?? "", a: m.away_score?.toString() ?? "" };
          const mpreds = preds[m.id];
          const isOpen = expanded === m.id;
          const needsResult = m.home_score === null && view === "todo";
          return (
            <div key={m.id} className="rounded-lg border bg-background/60">
              <div className="flex flex-wrap items-center gap-2 p-3">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                  style={{ backgroundColor: `${league?.color}22`, color: league?.color }}
                >
                  {league?.short}
                </span>
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setExpanded(isOpen ? null : m.id)}
                  aria-label="Voir les pronostics"
                >
                  <p className="truncate text-sm font-medium">
                    {m.home_team} <span className="text-muted-foreground">vs</span> {m.away_team}
                    {m.home_score !== null && (
                      <span className="ml-2 font-black text-emerald-400">{m.home_score}–{m.away_score}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatMatchDate(m.match_date)}
                    {m.status === "missed" && <span className="ml-2 font-bold text-red-400">● raté · à clôturer</span>}
                    {m.status === "scheduled" && needsResult && <span className="ml-2 font-bold text-amber-400">● sans résultat</span>}
                  </p>
                </button>
                <button
                  onClick={() => setExpanded(isOpen ? null : m.id)}
                  className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold"
                  title="Voir les pronostics"
                >
                  <Users className="h-3 w-3" />
                  {mpreds ? mpreds.length : "…"}
                  <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {m.home_score === null && (
                  <>
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
                  </>
                )}
                {m.home_score !== null && (
                  <Button size="sm" variant="outline" onClick={() => setExpanded(isOpen ? null : m.id)}>
                    {isOpen ? "Masquer" : "Voir"} les pronos
                  </Button>
                )}
              </div>

              {/* Pronos dépliables */}
              {isOpen && (
                <div className="border-t bg-secondary/30 p-3">
                  {mpreds === undefined && <p className="text-xs text-muted-foreground">Chargement des pronostics…</p>}
                  {mpreds?.length === 0 && (
                    <p className="text-xs text-muted-foreground">Aucun pronostic sur ce match.</p>
                  )}
                  {mpreds && mpreds.length > 0 && (
                    <ul className="space-y-1.5">
                      {mpreds
                        .slice()
                        .sort((a, b) => b.points_earned - a.points_earned)
                        .map((p, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-6 text-right text-xs text-muted-foreground">{i + 1}.</span>
                            <span className="min-w-0 flex-1 truncate font-medium">{p.username}</span>
                            <span className="rounded bg-background px-2 py-0.5 font-mono text-xs font-bold">
                              {p.home_score}–{p.away_score}
                            </span>
                            {p.calculated ? (
                              <Badge variant={p.points_earned > 0 ? "default" : "secondary"} className="min-w-14 justify-center">
                                {p.points_earned} pt{p.points_earned > 1 ? "s" : ""}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="min-w-14 justify-center">-</Badge>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
              <option value="">- choisir -</option>
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
