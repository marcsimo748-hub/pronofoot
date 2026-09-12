/**
 * Fonds d'écran rotatifs — PRONOFOOT.
 *
 * Un dossier par page dans `public/backgrounds/<page>/` avec plusieurs photos.
 * Le site change automatiquement de fond toutes les 2 heures (ROTATION_MS),
 * en piochant dans le dossier correspondant à la page courante.
 *
 * 🎨 Pour changer une photo : remplace simplement le fichier
 *    `public/backgrounds/<page>/bg-N.jpg` par ta propre image (même nom),
 *    ou définis un fond personnalisé depuis l'admin (le réglage admin prime
 *    toujours sur la rotation automatique).
 */

/** Intervalle de rotation : 2 heures */
export const ROTATION_MS = 2 * 60 * 60 * 1000;

/** Manifeste des fonds par page (dossiers dans public/backgrounds/) */
export const PAGE_BACKGROUNDS: Record<string, string[]> = {
  home: ["/backgrounds/home/bg-1.jpg", "/backgrounds/home/bg-2.jpg", "/backgrounds/home/bg-3.jpg"],
  login: ["/backgrounds/login/bg-1.jpg", "/backgrounds/login/bg-2.jpg", "/backgrounds/login/bg-3.jpg"],
  scores: ["/backgrounds/scores/bg-1.jpg", "/backgrounds/scores/bg-2.jpg", "/backgrounds/scores/bg-3.jpg"],
  news: ["/backgrounds/news/bg-1.jpg", "/backgrounds/news/bg-2.jpg", "/backgrounds/news/bg-3.jpg"],
  music: ["/backgrounds/music/bg-1.jpg", "/backgrounds/music/bg-2.jpg", "/backgrounds/music/bg-3.jpg"],
  pronos: ["/backgrounds/pronos/bg-1.jpg", "/backgrounds/pronos/bg-2.jpg", "/backgrounds/pronos/bg-3.jpg"],
  classement: [
    "/backgrounds/classement/bg-1.jpg",
    "/backgrounds/classement/bg-2.jpg",
    "/backgrounds/classement/bg-3.jpg",
  ],
  dashboard: [
    "/backgrounds/dashboard/bg-1.jpg",
    "/backgrounds/dashboard/bg-2.jpg",
    "/backgrounds/dashboard/bg-3.jpg",
  ],
};

/**
 * Index du fond courant pour une liste de N photos.
 * Basé sur le créneau temporel (2 h) : tous les visiteurs voient le même fond,
 * et il change tout seul sans recharger la page.
 */
export function backgroundSlot(count: number, now: number = Date.now()): number {
  if (count <= 1) return 0;
  return Math.floor(now / ROTATION_MS) % count;
}

/** Fond courant d'une page (rotation automatique), null si inconnu */
export function rotatingBackground(page: string, now: number = Date.now()): string | null {
  const list = PAGE_BACKGROUNDS[page];
  if (!list?.length) return null;
  return list[backgroundSlot(list.length, now)];
}

/** Association route → clé du dossier de fonds */
export function pageKeyForPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  const first = "/" + (pathname.split("/").filter(Boolean)[0] ?? "");
  if (first === "/admin") return "dashboard";
  const key = pathname.split("/").filter(Boolean)[0] ?? "home";
  // Pages sans dossier dédié (ex : modules /prono-job) → fond par défaut du site
  return PAGE_BACKGROUNDS[key] ? key : "home";
}
