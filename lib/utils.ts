import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import type { LeagueCode } from "./types";
import { LEAGUES } from "./constants";

/** Fusion intelligente des classes Tailwind */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Exécute une requête Supabase (ou toute promesse) sans jamais crasher la page */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn("[pronofoot] requête échouée, utilisation du fallback :", (err as Error)?.message);
    return fallback;
  }
}

/** Normalise un nom d'équipe : minuscules, sans accents ni ponctuation */
export function normalizeTeam(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "2026-09-12T18:00:00Z" → "sam. 12 sept. · 20:00" */
export function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return `Aujourd'hui · ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Demain · ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Hier · ${format(d, "HH:mm")}`;
  return format(d, "EEE d MMM · HH:mm", { locale: fr });
}

/** "2026-09-12T18:00:00Z" → "sam. 12 septembre 2026" */
export function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Aujourd'hui";
  if (isTomorrow(d)) return "Demain";
  return format(d, "EEEE d MMMM", { locale: fr });
}

/** Temps relatif : "il y a 5 min" */
export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
}

/** Libellé lisible d'un championnat */
export function leagueName(code: LeagueCode | string): string {
  return LEAGUES[code as LeagueCode]?.name ?? String(code);
}

/** Couleur d'un championnat */
export function leagueColor(code: LeagueCode | string): string {
  return LEAGUES[code as LeagueCode]?.color ?? "#10b981";
}

/** Statut d'un match → label FR */
export function matchStatusLabel(status: string, elapsed?: number | null): string {
  switch (status) {
    case "1H":
    case "2H":
      return `${elapsed ?? ""}'`;
    case "HT":
      return "MT";
    case "FT":
      return "Terminé";
    case "TEST":
      return "TEST";
    case "NS":
      return "À venir";
    default:
      return status;
  }
}

/** Calcul des points d'un pronostic (règles d'or — identique côté SQL) */
export function computePoints(
  pred: { home_score: number; away_score: number },
  result: { home_score: number; away_score: number }
): 0 | 3 | 5 {
  if (pred.home_score === result.home_score && pred.away_score === result.away_score) return 5;
  if (Math.sign(pred.home_score - pred.away_score) === Math.sign(result.home_score - result.away_score)) return 3;
  return 0;
}

/** Convertit une couleur hex en triplet HSL "H S% L%" (pour les variables CSS) */
export function hexToHsl(hex: string): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h = Math.round(h * 60);
  }
  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Formate des secondes en mm:ss (lecteur musique) */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
