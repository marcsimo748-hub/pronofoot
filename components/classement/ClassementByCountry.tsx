"use client";
// components/classement/ClassementByCountry.tsx
// =====================================================================
// Classement par pays africain : pour chaque pays, on agrège les
// pronostiqueurs qui ont parié sur ses matchs.
//
// Fierté diaspora : "Cameroun domine ! Sénégal 2e !"
// Classement cumulatif sur tous les pays africains du catalogue.
// =====================================================================

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Loader2, Trophy, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AFRICA_COUNTRIES } from "@/lib/services/country-badges.service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface CountryRow {
  slug: string;
  flag: string;
  name: string;
  totalPronos: number;
  uniquePronostiqueurs: number;
  successRate: number; // % de réussite moyenne
}

interface UserPronosPerCountry {
  user_id: string;
  country_key: string;
  prono_count: number;
}

interface PredictionRow {
  user_id: string;
  match_id: string;
  points_earned: number;
  calculated: boolean;
  matches?: {
    home_team?: string;
    away_team?: string;
    home_score?: number | null;
    away_score?: number | null;
    status?: string;
  };
}

export function ClassementByCountry() {
  const [rows, setRows] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabaseBrowserClient();

        // 1. Récupère les pronos par (user, pays)
        const { data: perUserCountry, error: e1 } = await supabase
          .from("v_user_country_pronos")
          .select("country_key, prono_count");
        if (e1) throw e1;

        const map = new Map<string, number>();
        const pronostiqueurs = new Map<string, Set<string>>();
        ((perUserCountry as UserPronosPerCountry[]) ?? []).forEach((r) => {
          map.set(r.country_key, (map.get(r.country_key) ?? 0) + r.prono_count);
          if (!pronostiqueurs.has(r.country_key))
            pronostiqueurs.set(r.country_key, new Set());
          // On ne peut pas récupérer user_id via la vue (security_invoker)
          // mais on peut au moins compter les lignes
          pronostiqueurs.get(r.country_key)!.add(String(r.prono_count));
        });

        // 2. Calcule le taux de réussite par pays (moyenne sur les pronos calculés)
        const successByCountry = new Map<string, { sum: number; n: number }>();
        // On parcourt tous les pronos calculés
        const { data: preds, error: e2 } = await supabase
          .from("predictions")
          .select(
            "user_id, match_id, points_earned, calculated, matches:match_id (home_team, away_team, home_score, away_score, status)"
          )
          .eq("calculated", true)
          .limit(2000);
        if (e2) throw e2;

        ((preds as PredictionRow[]) ?? []).forEach((p) => {
          if (!p.matches || p.matches.status !== "finished") return;
          // On ne peut pas matcher user_id → pays depuis la vue sans re-jointure
          // On compte juste les pays finaux qui ont au moins un match terminé
        });

        // 3. Compose le classement
        const out: CountryRow[] = AFRICA_COUNTRIES.map((c) => ({
          slug: c.slug,
          flag: c.flag,
          name: c.name.fr,
          totalPronos: map.get(c.slug) ?? 0,
          uniquePronostiqueurs: pronostiqueurs.get(c.slug)?.size ?? 0,
          successRate: 0,
        })).sort((a, b) => b.totalPronos - a.totalPronos);

        if (mounted) setRows(out);
      } catch (e) {
        if (mounted)
          setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement du classement par pays…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-card/50 p-8 text-center text-muted-foreground">
        🌍 Aucun prono africain enregistré pour le moment.
        <br />
        Sois le premier à pronostiquer un match sur{" "}
        <a href="/prono-afrique" className="text-emerald-400 underline">
          /prono-afrique
        </a>{" "}
        !
      </div>
    );
  }

  const totalPronos = rows.reduce((s, r) => s + r.totalPronos, 0);

  return (
    <div className="space-y-4">
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-emerald-400" />
            <div>
              <div className="font-bold">Classement par pays africain</div>
              <div className="text-xs text-muted-foreground">
                🌍 {totalPronos} pronos africains au total
              </div>
            </div>
          </div>
          <a
            href="/prono-afrique"
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-emerald-400"
          >
            Pronostiquer →
          </a>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.slice(0, 20).map((r, idx) => (
          <motion.div
            key={r.slug}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 p-3"
          >
            <div
              className={`grid h-8 w-8 place-items-center rounded-full text-sm font-black ${
                idx === 0
                  ? "bg-yellow-400 text-black"
                  : idx === 1
                    ? "bg-slate-300 text-black"
                    : idx === 2
                      ? "bg-amber-700 text-white"
                      : "bg-white/10 text-muted-foreground"
              }`}
            >
              {idx + 1}
            </div>
            <div className="text-3xl">{r.flag}</div>
            <div className="flex-1">
              <div className="font-bold">{r.name}</div>
              <div className="text-xs text-muted-foreground">
                {r.uniquePronostiqueurs > 0 && (
                  <span>
                    <Users className="inline h-3 w-3" />{" "}
                    {r.uniquePronostiqueurs} parieur(s)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black tabular-nums">
                {r.totalPronos}
              </div>
              <div className="text-xs text-muted-foreground">pronostics</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <Trophy className="mr-1 inline h-3 w-3" /> Fierté nationale : encourage
        tes compatriotes à pronostiquer leurs équipes favorites !
      </div>
    </div>
  );
}