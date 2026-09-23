"use client";

/**
 * SyncManager — le cœur du mode "100% automatique" sans cron payant.
 * Component invisible monté au layout racine qui déclenche :
 *   • la synchro des scores toutes les 90 s (le serveur re-throttle de toute façon)
 *   • la synchro des news toutes les 10 minutes
 *   • le nettoyage des matchs passés toutes les 6 h
 * Compatible plan Vercel gratuit. Les crons vercel.json / cron-job.org
 * font la même chose côté serveur quand ils sont configurés.
 */

import { useEffect } from "react";

const SCORES_INTERVAL = 90_000; // 90 secondes
const NEWS_INTERVAL = 600_000; // 10 minutes
const CLEANUP_INTERVAL = 6 * 3600_000; // 6 heures

export function SyncManager() {
  useEffect(() => {
    const ping = (url: string) => {
      fetch(url, { method: "POST" }).catch(() => {}); // silencieux, jamais bloquant
    };

    // Première synchronisation rapide au chargement
    const t1 = setTimeout(() => ping("/api/scores/sync"), 3000);
    const t2 = setTimeout(() => ping("/api/news/sync"), 8000);

    const scoresTimer = setInterval(() => {
      if (document.visibilityState === "visible") ping("/api/scores/sync");
    }, SCORES_INTERVAL);

    const newsTimer = setInterval(() => {
      if (document.visibilityState === "visible") ping("/api/news/sync");
    }, NEWS_INTERVAL);

    const cleanupTimer = setInterval(() => ping("/api/matches/cleanup"), CLEANUP_INTERVAL);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(scoresTimer);
      clearInterval(newsTimer);
      clearInterval(cleanupTimer);
    };
  }, []);

  return null;
}
