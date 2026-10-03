"use client";
// components/classement/ClassementByCountry.tsx
// =====================================================================
// Classement par pays africain : pour chaque pays, on compte le nombre
// de pronostiqueurs qui ont parié sur ses matchs + le total de pronos.
// Fierté diaspora : Cameroun domine ? Sénégal 2e ?
// =====================================================================

import { useEffect, useState } from "react";
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
}

interface UserPronosPerCountry {
  user_id: string;
  country_key: string;
  prono_count: number;
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

        // Récupère les pronos par (user, pays)
        const { data: perUserCountry, error: e1 } = await supabase
          .from("v_user_country_pronos")
          .select("user_id, country_key, prono_count");
        if (e1) throw e1;

        const totalByCountry: Record<string, number> = {};
        const pronostiqueursByCountry: Record<string, Set<string>> = {};
        ((perUserCountry as UserPronosPerCountry[]) ?? []).forEach((r) => {
          if (!r.user_id) return;
          totalByCountry[r.country_key] =
            (totalByCountry[r.country_key] ?? 0) + r.prono_count;
          if (!pronostiqueursByCountry[r.country_key])
            pronostiqueursByCountry[r.country_key] = new Set();
          pronostiqueursByCountry[r.country_key].add(r.user_id);
        });

        const out: CountryRow[] = AFRICA_COUNTRIES.map((c) => ({
          slug: c.slug,
          flag: c.flag,
          name: c.name.fr,
          totalPronos: totalByCountry[c.slug] ?? 0,
          uniquePronostiqueurs: pronostiqueursByCountry[c.slug]?.size ?? 0,
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
          <div
            key={r.slug}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 p-3 transition hover:bg-card/80"
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
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <Trophy className="mr-1 inline h-3 w-3" /> Fierté nationale : encourage
        tes compatriotes à pronostiquer leurs équipes favorites !
      </div>
    </div>
  );
}