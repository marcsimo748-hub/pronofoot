"use client";

/**
 * Panneau Admin — les 13 outils, activés par le PASS VIP (5 clics sur le logo).
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Settings2, ShieldCheck } from "lucide-react";
import { adminFetch } from "./adminShared";
import { ApiSyncTool } from "./tools/ApiSyncTool";
import { LiveTesterTool } from "./tools/LiveTesterTool";
import { ManualEntryTool } from "./tools/ManualEntryTool";
import { WallpapersTool } from "./tools/WallpapersTool";
import { BannersTool } from "./tools/BannersTool";
import { LeagueBackgroundsTool } from "./tools/LeagueBackgroundsTool";
import { PlaylistTool } from "./tools/PlaylistTool";
import { ThemeTool } from "./tools/ThemeTool";
import { ThemeSeasonTool } from "./tools/ThemeSeasonTool";
import { AnnouncementTool } from "./tools/AnnouncementTool";
import { StatsTool } from "./tools/StatsTool";
import { UsersTool } from "./tools/UsersTool";
import { AnnoncesModerationTool } from "./tools/AnnoncesModerationTool";
import { TripsModerationTool } from "./tools/TripsModerationTool";
import { AiKeysTool } from "./tools/AiKeysTool";
import { SecurityEmailTool } from "./tools/SecurityEmailTool";
import type { SiteSettings } from "@/lib/types";

export function AdminPanel({ settings }: { settings: SiteSettings }) {
  const [liveState, setLiveState] = useState(settings.live_tester);

  // Synchronise l'état du testeur live toutes les 15 s (le toggle peut être actionné ailleurs)
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const state = await adminFetch<{ active: boolean }>("/api/admin/settings/live-tester");
        if (state) setLiveState(state);
      } catch {
        /* silencieux */
      }
    }, 15_000);
    return () => clearInterval(t);
  }, []);

  const TOOLS = [
    { id: "sync", emoji: "⚡", title: "Fournisseurs & Synchro", desc: "3 API de secours automatique + clés", component: <ApiSyncTool settings={settings} /> },
    { id: "security", emoji: "🔐", title: "Sécurité & E-mails", desc: "Anti-robot Turnstile + e-mails Resend", component: <SecurityEmailTool /> },
    { id: "tester", emoji: "🔴", title: "Mode Testeur LIVE", desc: "Simuler des scores en direct pour tester le site", component: <LiveTesterTool active={liveState.active} onChange={setLiveState} /> },
    { id: "manual", emoji: "⚽", title: "Résultats & Pronostics", desc: "Clôturer les matchs, voir tous les pronos, saisir/vérifier les scores", component: <ManualEntryTool /> },
    { id: "wallpapers", emoji: "🖼️", title: "Fonds d'Écran Globaux", desc: "Arrière-plans Connexion / Accueil", component: <WallpapersTool settings={settings} /> },
    { id: "banners", emoji: "🏟️", title: "Bannières par Championnat", desc: "Bandeau en haut de la page Pronos", component: <BannersTool settings={settings} /> },
    { id: "backgrounds", emoji: "🌄", title: "Arrière-plans par Championnat", desc: "Fond derrière les matchs de chaque ligue", component: <LeagueBackgroundsTool settings={settings} /> },
    { id: "playlist", emoji: "🎵", title: "Playlist MP3", desc: "Ajouter / supprimer des musiques", component: <PlaylistTool /> },
    { id: "season", emoji: "🗓️", title: "Visage du site (saisons + événements)", desc: "Mode auto saison/événement · forcer un thème · 6 templates visuels", component: <ThemeSeasonTool settings={settings} /> },
    { id: "theme", emoji: "🎨", title: "Couleur du Thème", desc: "Changer la couleur principale du site", component: <ThemeTool settings={settings} /> },
    { id: "announce", emoji: "📢", title: "Annonce Publique", desc: "Afficher un message à tous les joueurs", component: <AnnouncementTool settings={settings} /> },
    { id: "stats", emoji: "📊", title: "Statistiques Cloud", desc: "Vue d'ensemble de la plateforme", component: <StatsTool /> },
    { id: "users", emoji: "👥", title: "Gestion des Joueurs", desc: "Voir les comptes et gérer les admins", component: <UsersTool /> },
    { id: "annonces", emoji: "📢", title: "Modération Annonces", desc: "Masquer, afficher ou supprimer les annonces", component: <AnnoncesModerationTool /> },
    { id: "covoiturage", emoji: "🚗", title: "Modération Covoiturage", desc: "Gérer les trajets voyage de la communauté", component: <TripsModerationTool /> },
    { id: "ai", emoji: "🤖", title: "Assistant IA", desc: "Activer l'IA complète (clé Groq ou Gemini)", component: <AiKeysTool /> },
  ];
  const [openTool, setOpenTool] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/20 text-amber-400">
            <Settings2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-black">⚙️ Panneau Administrateur</h1>
            <p className="flex items-center gap-1.5 text-xs text-amber-300/80">
              <ShieldCheck className="h-3.5 w-3.5" /> 13 outils · tout est sauvegardé dans Supabase
            </p>
          </div>
        </div>
        {liveState.active && (
          <span className="flex animate-pulse items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500" /> TESTEUR LIVE ACTIF
          </span>
        )}
      </div>

      {/* Grille des outils */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool, i) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setOpenTool(tool.id === openTool ? null : tool.id)}
            className={`card-hover rounded-xl border p-4 text-left ${
              openTool === tool.id ? "border-primary/50 bg-primary/5" : "bg-card/70"
            }`}
          >
            <span className="text-2xl">{tool.emoji}</span>
            <h3 className="mt-2 font-bold">{tool.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{tool.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Outil ouvert */}
      {openTool && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card/70 p-5"
        >
          {TOOLS.find((t) => t.id === openTool)?.component}
        </motion.section>
      )}
    </div>
  );
}

/** Petit toast d'info commun */
export function notifyError(e: unknown) {
  toast.error(e instanceof Error ? e.message : "Une erreur est survenue.");
}
