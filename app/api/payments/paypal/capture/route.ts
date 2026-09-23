import { NextResponse } from "next/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PREMIUM_PLAN,
  getPayPalConfig,
  capturePayPalOrder,
} from "@/lib/services/payments.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/paypal/capture?token=ORDER_ID — retour du joueur après
 * approbation PayPal. On capture le paiement CÔTÉ SERVEUR (jamais dans le
 * navigateur), puis on crédite les 30 jours Premium. Idempotent.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("token");
  const origin = url.origin;

  if (!orderId) {
    return NextResponse.redirect(`${origin}/tarifs?paiement=annule`);
  }

  const pp = await getPayPalConfig();
  if (!pp) {
    return NextResponse.redirect(`${origin}/tarifs?paiement=annule`);
  }

  // Capture officielle auprès de PayPal (le statut réel fait foi)
  const capture = await capturePayPalOrder({
    clientId: pp.clientId,
    secret: pp.secret,
    orderId,
  });
  if ("error" in capture || capture.status !== "COMPLETED") {
    return NextResponse.redirect(`${origin}/tarifs?paiement=annule`);
  }

  const admin = tryGetSupabaseAdminClient();
  if (!admin) {
    return NextResponse.redirect(`${origin}/tarifs?paiement=annule`);
  }

  const { data: payment } = await admin
    .from("payments")
    .select("id, status, user_id")
    .eq("stripe_session_id", orderId)
    .maybeSingle();

  if (payment && payment.status !== "paid") {
    await admin
      .from("payments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payment.id);

    // Premium +30 jours (cumulable)
    const { data: profile } = await admin
      .from("profiles")
      .select("premium_until")
      .eq("id", payment.user_id)
      .maybeSingle();
    const current = profile?.premium_until ? new Date(profile.premium_until) : null;
    const base = current && current > new Date() ? current : new Date();
    const until = new Date(base.getTime() + PREMIUM_PLAN.days * 86_400_000);
    await admin
      .from("profiles")
      .update({ premium_until: until.toISOString() })
      .eq("id", payment.user_id);
  }

  return NextResponse.redirect(`${origin}/tarifs?paiement=merci`);
}
