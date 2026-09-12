"use client";

/**
 * Espace joueur (client) : stats, mes pronostics, historique, groupes.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Target, Crosshair, TrendingUp, Users, CalendarDays, Lock, History, ChevronRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupsPanel } from "@/components/classement/GroupsPanel";
import { PronoJobApplications } from "@/components/dashboard/PronoJobApplications";
import { PronoProfileCard } from "@/components/dashboard/PronoProfileCard";
import { cn, formatMatchDate } from "@/lib/utils";
import { LEAGUES } from "@/lib/constants";
import type { Match, Prediction } from "@/lib/types";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface DashboardData {
  totalPoints: number;
  predictions: (Prediction & { matches: Match })[];
  stats: { total: number; calculated: number; exacts: number; outcomes: number; accuracy: number };
  rank: number;
  totalPlayers: number;
}

export function DashboardClient({
  username,
  data,
  userId,
  emailVerified = true,
  email = null,
}: {
  username: string;
  data: DashboardData;
  userId: string;
  emailVerified?: boolean;
  email?: string | null;
}) {
  const upcoming = useMemo(() => data.predictions.filter((p) => p.matches?.status === "scheduled"), [data.predictions]);
  const history = useMemo(() => data.predictions.filter((p) => p.calculated), [data.predictions]);

  const [resending, setResending] = useState(false);

  const resendEmail = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        toast.error("Envoi impossible", { description: "Réessaie dans quelques minutes." });
      } else {
        toast.success("Email envoyé ✉️", {
          description: "Ouvre ta boîte mail et clique sur le lien de confirmation.",
        });
      }
    } catch {
      toast.error("Erreur réseau, réessaie.");
    } finally {
      setResending(false);
    }
  };

  const cards = [
    { icon: Trophy, label: "Points totaux", value: data.totalPoints, accent: "text-primary" },
    { icon: TrendingUp, label: "Classement", value: `#${data.rank}/${data.totalPlayers || "—"}`, accent: "text-amber-400" },
    { icon: Target, label: "Pronostics", value: data.stats.total, accent: "text-sky-400" },
    { icon: Crosshair, label: "Réussite", value: `${data.stats.accuracy}%`, accent: "text-emerald-400" },
  ];

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">
            Salut <span className="text-gradient">{username}</span> 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Voici ton espace joueur — tout est sauvegardé dans le cloud.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/messages">
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" /> Messages privés
            </Button>
          </Link>
          <Link href="/pronos">
            <Button variant="glow" className="gap-2">
              <Trophy className="h-4 w-4" /> Pronostiquer maintenant
            </Button>
          </Link>
        </div>
      </div>

      {/* Vérification email (badge ✓ sur tout le site) */}
      {!emailVerified && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <span className="text-2xl">✉️</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-300">Vérifie ton adresse email</p>
            <p className="text-xs text-muted-foreground">
              Un compte vérifié affiche le badge ✓ vert sur les annonces, les trajets et le
              chat : les membres te font confiance davantage.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void resendEmail()}
            disabled={resending}
            className="shrink-0"
          >
            {resending ? "Envoi…" : "Renvoyer l'email"}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card-hover rounded-xl border bg-card/70 p-4"
          >
            <c.icon className={cn("mb-2 h-5 w-5", c.accent)} />
            <p className="text-2xl font-black tabular-nums">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Détail */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> À venir ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" /> Historique ({history.length})
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Mes groupes
          </TabsTrigger>
        </TabsList>

        {/* Pronostics à venir */}
        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <EmptyState
              text="Aucun pronostic à venir — file en faire quelques-uns !"
              cta="Voir les matchs"
            />
          ) : (
            upcoming.map((p) => <PredictionRow key={p.id} prediction={p} />)
          )}
        </TabsContent>

        {/* Historique + points */}
        <TabsContent value="history" className="mt-4 space-y-3">
          {history.length === 0 ? (
            <EmptyState text="Ton historique apparaîtra ici dès le premier match terminé." />
          ) : (
            history.map((p) => <PredictionRow key={p.id} prediction={p} />)
          )}
        </TabsContent>

        {/* Groupes */}
        <TabsContent value="groups" className="mt-4">
          <GroupsPanel currentUserId={userId} />
        </TabsContent>
      </Tabs>

      {/* 🆕 Module 2 — mes profils (Emploi/Logement/Visa/Rencontre + CV) */}
      <PronoProfileCard />

      {/* 🆕 Module PronoJob — mes candidatures emploi (visible si ≥ 1 candidature) */}
      <PronoJobApplications />
    </div>
  );
}

function PredictionRow({ prediction: p }: { prediction: Prediction & { matches: Match } }) {
  const m = p.matches;
  const league = LEAGUES[m.league];
  const finished = m.status === "finished" && m.home_score !== null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card/70 p-4">
      <span
        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
        style={{ backgroundColor: `${league?.color}22`, color: league?.color }}
      >
        {league?.short}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          <span className="flex min-w-0 items-center gap-1.5">
            <TeamLogo name={m.home_team} size={16} />
            <span className="truncate">{m.home_team}</span>
            <span className="text-muted-foreground">vs</span>
            <TeamLogo name={m.away_team} size={16} />
            <span className="truncate">{m.away_team}</span>
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground">{formatMatchDate(m.match_date)}</p>
      </div>

      {/* Prono */}
      <span className="rounded-lg bg-secondary px-2.5 py-1.5 text-sm font-bold tabular-nums">
        {p.home_score} – {p.away_score}
      </span>

      {/* Résultat réel + points */}
      {finished ? (
        <>
          <span className="text-sm tabular-nums text-muted-foreground">
            ({m.home_score} – {m.away_score})
          </span>
          <Badge variant={p.points_earned === 5 ? "success" : p.points_earned === 3 ? "warning" : "secondary"}>
            {p.points_earned === 5 ? "🎯 +5" : p.points_earned === 3 ? "✅ +3" : "❌ 0"} pts
          </Badge>
        </>
      ) : (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" /> en attente
        </span>
      )}
    </div>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {cta && (
        <Link href="/pronos" className="mt-4 inline-block">
          <Button variant="secondary" className="gap-1.5">
            {cta} <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}
