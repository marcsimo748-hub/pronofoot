import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { sendEmail, emailTemplate } from "@/lib/services/integrations.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/test-email — envoie un e-mail de test à l'adresse de
 * l'admin connecté (via Resend). Permet de valider la clé et la délivrabilité.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user?.is_admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });
  if (!user.email) return NextResponse.json({ ok: false, error: "Ton compte admin n'a pas d'email" }, { status: 400 });

  const result = await sendEmail({
    to: user.email,
    subject: "⚽ PRONO — e-mail de test",
    html: emailTemplate(
      "Ça marche ! 🎉",
      `<p style="margin:0 0 10px">Ceci est un e-mail de test envoyé depuis ton site PRONO via Resend.</p>
       <p style="margin:0;color:#94a3b8;font-size:13px">Si tu lis ceci, l'envoi d'e-mails est opérationnel. Les vraies notifications (bienvenue, résultats, alertes) pourront être activées.</p>`
    ),
  });

  return NextResponse.json({ ok: result.ok, detail: result.detail, to: user.email });
}
