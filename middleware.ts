import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — rafraîchit la session Supabase et protège les routes privées.
 *
 * ⛑️ BLINDAGE ANTI-PLANTAGE (erreur Vercel « MIDDLEWARE_INVOCATION_FAILED ») :
 * - Import DYNAMIQUE de @supabase/ssr (aucun crash possible au chargement du
 *   module sur l'Edge Runtime de Vercel).
 * - Toute la logique est enveloppée dans un try/catch : en cas de problème
 *   (config manquante, erreur réseau, environnement Edge…), la requête passe
 *   au lieu de renvoyer une erreur 500 sur tout le site.
 * - L'erreur est journalisée (visible dans Vercel → Logs) pour diagnostic.
 */

const PROTECTED = ["/dashboard", "/pronos", "/admin", "/prono-profil"];
const AUTH_PAGES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Mode dégradé : pas de config Supabase valide → ne jamais bloquer le site
  if (!url || !anonKey || !/^https?:\/\//.test(url)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  try {
    // Import dynamique : évite tout plantage au chargement sur l'Edge Runtime
    const { createServerClient } = await import("@supabase/ssr");

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    // Toujours appeler getUser() : rafraîchit le token si nécessaire
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Routes privées → redirection vers /login avec retour
    if (!user && PROTECTED.some((p) => pathname.startsWith(p))) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Déjà connecté → pas besoin des pages auth
    if (user && AUTH_PAGES.includes(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    // /admin : vérifie le rôle admin (lecture du profil)
    if (user && pathname.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (!profile?.is_admin) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/";
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (error) {
    // Journalisé dans Vercel → Logs, mais JAMAIS bloquant pour le site
    console.error("[middleware] erreur non bloquante :", error);
  }

  return response;
}

export const config = {
  matcher: [
    // Tout sauf fichiers statiques et images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ico)$).*)",
  ],
};
