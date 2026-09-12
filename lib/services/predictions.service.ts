/**
 * Service PRONOSTICS & CLASSEMENTS (lectures serveur).
 * Les écritures joueur passent par le client Supabase navigateur (RLS),
 * les settlements par les RPC SQL (settle_match / settle_bonus).
 */

import type { Match, Prediction, StandingRow, GroupInfo } from "@/lib/types";
import type { LeagueCode } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeQuery } from "@/lib/utils";

/** Matchs ouverts au pronostic + pronostics existants de l'utilisateur */
export async function getMatchesForPrediction(userId?: string): Promise<{ matches: Match[]; predictions: Prediction[] }> {
  return safeQuery(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data: matches } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "scheduled")
        .gte("match_date", new Date().toISOString())
        .order("match_date", { ascending: true })
        .limit(120);
      let predictions: Prediction[] = [];
      if (userId && matches?.length) {
        const { data: preds } = await supabase
          .from("predictions")
          .select("*")
          .eq("user_id", userId)
          .in(
            "match_id",
            matches.map((m) => m.id)
          );
        predictions = (preds ?? []) as Prediction[];
      }
      return { matches: (matches ?? []) as Match[], predictions };
    },
    { matches: [], predictions: [] }
  );
}

/** Prono public d'un joueur sur un match commencé */
export interface PublicPrediction {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  home_score: number;
  away_score: number;
  points_earned: number;
  calculated: boolean;
}

/** Match commencé (48 dernières heures) + pronos de TOUS les joueurs, dévoilés */
export interface StartedMatch {
  match: Match;
  predictions: PublicPrediction[];
}

/**
 * Matchs récemment commencés avec les pronostics dévoilés de tous les joueurs.
 * La RLS (migration 012) ne renvoie les pronos des autres que si le match a
 * commencé : aucune triche possible avant le coup d'envoi.
 */
export async function getStartedMatches(limit = 12): Promise<StartedMatch[]> {
  return safeQuery(
    async () => {
      const supabase = createSupabaseServerClient();
      const now = new Date();
      const from = new Date(now.getTime() - 48 * 3600_000).toISOString();

      const { data: matches } = await supabase
        .from("matches")
        .select("*")
        .in("status", ["scheduled", "missed", "live", "finished"])
        .lte("match_date", now.toISOString())
        .gte("match_date", from)
        .order("match_date", { ascending: false })
        .limit(limit);
      if (!matches?.length) return [];

      const { data: preds } = await supabase
        .from("predictions")
        .select("user_id, home_score, away_score, points_earned, calculated, user:profiles(username, avatar_url)")
        .in(
          "match_id",
          matches.map((m) => m.id)
        );
      const byMatch = new Map<string, PublicPrediction[]>();
      for (const p of (preds ?? []) as unknown as {
        match_id: string;
        user_id: string;
        home_score: number;
        away_score: number;
        points_earned: number;
        calculated: boolean;
        user: { username: string | null; avatar_url: string | null } | null;
      }[]) {
        const list = byMatch.get(p.match_id) ?? [];
        list.push({
          user_id: p.user_id,
          username: p.user?.username ?? null,
          avatar_url: p.user?.avatar_url ?? null,
          home_score: p.home_score,
          away_score: p.away_score,
          points_earned: p.points_earned,
          calculated: p.calculated,
        });
        byMatch.set(p.match_id, list);
      }

      return (matches as Match[]).map((m) => ({
        match: m,
        predictions: (byMatch.get(m.id) ?? []).sort((a, b) => b.points_earned - a.points_earned),
      }));
    },
    []
  );
}

/** Aperçu admin : pronos des joueurs sur des matchs À VENIR (avant coup d'envoi) */
export async function getAdminPredictionPeek(matchIds: string[]): Promise<Record<string, PublicPrediction[]>> {
  if (!matchIds.length) return {};
  return safeQuery(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data } = await supabase
        .from("predictions")
        .select("match_id, user_id, home_score, away_score, user:profiles(username, avatar_url)")
        .in("match_id", matchIds);
      const result: Record<string, PublicPrediction[]> = {};
      for (const p of (data ?? []) as unknown as {
        match_id: string;
        user_id: string;
        home_score: number;
        away_score: number;
        user: { username: string | null; avatar_url: string | null } | null;
      }[]) {
        (result[p.match_id] ??= []).push({
          user_id: p.user_id,
          username: p.user?.username ?? null,
          avatar_url: p.user?.avatar_url ?? null,
          home_score: p.home_score,
          away_score: p.away_score,
          points_earned: 0,
          calculated: false,
        });
      }
      return result;
    },
    {}
  );
}

/** Classement général (profils triés par total_points) */
export async function getGeneralStandings(limit = 50): Promise<StandingRow[]> {
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, total_points")
      .order("total_points", { ascending: false })
      .order("username")
      .limit(limit);
    return (data ?? []).map((p) => ({
      user_id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      points: p.total_points,
      preds: 0,
    }));
  }, []);
}

/** Classement par championnat (RPC SQL) */
export async function getLeagueStandings(league: LeagueCode): Promise<StandingRow[]> {
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.rpc("get_league_standings", { p_league: league });
    return (data ?? []) as StandingRow[];
  }, []);
}

/** Classement du mois en cours (RPC SQL) */
export async function getMonthlyStandings(): Promise<StandingRow[]> {
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    const month = new Date().toISOString().slice(0, 10); // 1er du mois courant
    const { data } = await supabase.rpc("get_monthly_standings", { p_month: month });
    return (data ?? []) as StandingRow[];
  }, []);
}

/** Données du tableau de bord joueur */
export async function getDashboardData(userId: string) {
  return safeQuery(
    async () => {
      const supabase = createSupabaseServerClient();

      const { data: profile } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("id", userId)
        .single();

      const { data: predictions } = await supabase
        .from("predictions")
        .select("*, matches(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(60);

      const { count: totalPlayers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      const { count: betterThanMe } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("total_points", profile?.total_points ?? 0);

      const { data: groups } = await supabase
        .from("group_members")
        .select("groups(id, name, invite_code, owner_id)")
        .eq("user_id", userId);

      const preds = (predictions ?? []) as unknown as (Prediction & { matches: Match })[];

      const calculated = preds.filter((p) => p.calculated);
      const exacts = calculated.filter((p) => p.points_earned === 5).length;
      const outcomes = calculated.filter((p) => p.points_earned === 3).length;

      return {
        totalPoints: profile?.total_points ?? 0,
        predictions: preds,
        stats: {
          total: preds.length,
          calculated: calculated.length,
          exacts,
          outcomes,
          accuracy: calculated.length ? Math.round(((exacts + outcomes) / calculated.length) * 100) : 0,
        },
        rank: (betterThanMe ?? 0) + 1,
        totalPlayers: totalPlayers ?? 0,
        groups: ((groups ?? []) as unknown as { groups: GroupInfo }[]).map((g) => g.groups).filter(Boolean),
      };
    },
    {
      totalPoints: 0,
      predictions: [] as (Prediction & { matches: Match })[],
      stats: { total: 0, calculated: 0, exacts: 0, outcomes: 0, accuracy: 0 },
      rank: 0,
      totalPlayers: 0,
      groups: [] as GroupInfo[],
    }
  );
}
