/**
 * i18n côté serveur — lit la langue courante du visiteur depuis le cookie
 * posé par le sélecteur de langue (utilisé dans useUiStore). Fallback = FR.
 *
 * Usage (en Server Component) :
 *   const t = await useServerT();
 *   <p>{t("hou.h1")}</p>
 *
 * La fonction retourne un objet `t(key, vars?)` avec substitution `{x}`.
 */

import { DICTS, DEFAULT_LANG, type Lang } from "./i18n";
import { headers } from "next/headers";

const COOKIE_KEY = "prono_lang";

/** Lit la langue depuis le cookie (header côté serveur next). */
export function readServerLang(): Lang {
  const c = headers().get("cookie") ?? "";
  const m = c.match(new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([^;]+)`));
  const value = m ? decodeURIComponent(m[1]) : null;
  if (value === "fr" || value === "en" || value === "de") return value;
  return DEFAULT_LANG;
}

/** Substitue les `{x}` dans une chaîne de traduction. */
function substitute(input: string, vars?: Record<string, string>): string {
  if (!vars) return input;
  return input.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`
  );
}

/** Map langue → Intl BCP47 locale pour les dates serveur. */
const LOCALE_MAP: Record<Lang, string> = { fr: "fr-FR", en: "en-GB", de: "de-DE" };

export async function useServerT(extraHeaders?: Headers): Promise<(key: string, vars?: Record<string, string>) => string> {
  // Lit le cookie via le paramètre si fourni, sinon via headers() (re-lecture ici autorisée dans Next)
  let lang: Lang = DEFAULT_LANG;
  try {
    const h = extraHeaders ?? headers();
    const c = h.get("cookie") ?? "";
    const m = c.match(new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([^;]+)`));
    const v = m ? decodeURIComponent(m[1]) : null;
    if (v === "fr" || v === "en" || v === "de") lang = v;
  } catch {
    /* ignore */
  }
  const dict = DICTS[lang];
  const FR = DICTS.fr;

  // t enrichi avec clés virtualisées (__locale__, etc.)
  return (key: string, vars?: Record<string, string>) => {
    if (key === "__locale__") return substitute(LOCALE_MAP[lang], vars);
    const raw = dict[key as keyof typeof dict] ?? FR[key as keyof typeof FR] ?? "";
    return substitute(raw, vars);
  };
}
