"use client";

/** 📊 Outil 10 : Statistiques cloud de la plateforme */

import { useEffect, useState } from "react";
import { Users, Trophy, Newspaper, Music4, MessageSquare, Target, Zap } from "lucide-react";
import { adminFetch } from "../adminShared";

interface Stats {
  players: number;
  newPlayers: number;
  matches: { total: number; finished: number; upcoming: number };
  predictions: number;
  pendingPredictions: number;
  pointsDistributed: number;
  news: number;
  songs: number;
  chatMessages: number;
  groups: number;
  lastSync: number | null;
}

export function StatsTool() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setStats(await adminFetch<Stats>("/api/admin/stats"));
      } catch {
        /* silencieux */
      }
    })();
  }, []);

  if (!stats) return <p className="text-sm text-muted-foreground">Chargement des statistiques…</p>;

  const cards = [
    { icon: Users, label: "Joueurs inscrits", value: stats.players, sub: `+${stats.newPlayers} cette semaine` },
    { icon: Target, label: "Pronostics", value: stats.predictions, sub: `${stats.pendingPredictions} en attente de résultat` },
    { icon: Trophy, label: "Points distribués", value: stats.pointsDistributed, sub: `${stats.matches.finished} matchs terminés` },
    { icon: Zap, label: "Matchs 2026-27", value: stats.matches.total, sub: `${stats.matches.upcoming} à venir` },
    { icon: Newspaper, label: "News en cache", value: stats.news, sub: "rafraîchies toutes les 10 min" },
    { icon: Music4, label: "Musiques", value: stats.songs, sub: "bucket Storage `songs`" },
    { icon: MessageSquare, label: "Messages IA", value: stats.chatMessages, sub: "historique chat" },
    { icon: Users, label: "Groupes privés", value: stats.groups, sub: "communautés d'amis" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border bg-background/50 p-4">
          <c.icon className="mb-2 h-5 w-5 text-primary" />
          <p className="text-2xl font-black tabular-nums">{c.value.toLocaleString("fr-FR")}</p>
          <p className="text-xs font-medium">{c.label}</p>
          <p className="text-[11px] text-muted-foreground">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
