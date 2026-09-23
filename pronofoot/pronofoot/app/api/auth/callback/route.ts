import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/callback — échange le code (PKCE) des emails Supabase
 * (confirmation d'inscription, réinitialisation de mot de passe) contre une session.
 */
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (code) {
    try {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Les comptes ADMIN_EMAILS reçoivent leurs droits à la volée
        await fetch(`${origin}/api/auth/ensure-admin`, { method: "POST" }).catch(() => {});
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (e) {
      console.error("[api/auth/callback]", e);
    }
  }

  // Code manquant ou invalide → retour accueil
  return NextResponse.redirect(`${origin}/`);
}
