/**
 * Redirection après connexion : mémorise l'offre exacte cliquée avant
 * l'ouverture de la modale de connexion, puis y revient automatiquement
 * une fois connecté (clé localStorage "redirectAfterLogin").
 */

export const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

/** Mémorise la destination (doit commencer par "/") */
export function setRedirectAfterLogin(path: string): void {
  try {
    if (path.startsWith("/")) localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, path);
  } catch {
    /* localStorage indisponible, on ignore */
  }
}

/** Lit la destination mémorisée sans la consommer */
export function getRedirectAfterLogin(): string | null {
  try {
    return localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
  } catch {
    return null;
  }
}

/** Lit puis efface la destination mémorisée */
export function consumeRedirectAfterLogin(): string | null {
  try {
    const v = localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
    if (v) localStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
    return v;
  } catch {
    return null;
  }
}
