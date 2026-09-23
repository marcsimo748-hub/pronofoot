import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PREMIUM_PLAN,
  PREMIUM_PLAN_XAF,
  getCinetPayConfig,
  getPayPalConfig,
  createCinetPayPayment,
  createPayPalOrder,
} from "@/lib/services/payments.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/checkout — démarre un paiement Premium.
 * Corps : { method: "paypal" (Europe) | "mobile_money" (Afrique) }
 *
 * ⚖️ Choix du propriétaire : AUCUNE carte bancaire n'est proposée.
 *   • PayPal → page de paiement hébergée par PayPal (joueurs européens)
 *   • Mobile Money → page CinetPay en mode Mobile Money UNIQUEMENT
 *     (MTN, Orange… joueurs africains)
 * Tant qu'aucune clé n'est enregistrée (Admin), chaque méthode répond 503
 * et le bouton de /tarifs reste « bientôt disponible ».
 */
export async function POST(req: Request) {
  // 1) Joueur connecté uniquement
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Connecte-toi pour passer Premium." },
      { status: 401 }
    );
  }

  // 2) Moyen de paiement demandé
  let method: "paypal" | "mobile_money" = "paypal";
  try {
    const body = (await req.json()) as { method?: "paypal" | "mobile_money" };
    if (body.method === "mobile_money") method = "mobile_money";
  } catch {
    /* corps vide → PayPal par défaut */
  }
  const origin = new URL(req.url).origin;

  // 3) PayPal — joueurs européens (page hébergée PayPal, aucune donnée
  //    bancaire ne transite par nos serveurs)
  if (method === "paypal") {
    const pp = await getPayPalConfig();
    if (!pp) {
      return NextResponse.json(
        { ok: false, error: "Paiements pas encore ouverts — bientôt ✨" },
        { status: 503 }
      );
    }
    const order = await createPayPalOrder({
      clientId: pp.clientId,
      secret: pp.secret,
      userId: user.id,
      origin,
    });
    if ("error" in order) {
      return NextResponse.json({ ok: false, error: order.error }, { status: 502 });
    }
    const admin = tryGetSupabaseAdminClient();
    if (admin) {
      await admin.from("payments").insert({
        user_id: user.id,
        provider: "paypal",
        plan: PREMIUM_PLAN.id,
        amount_cents: 499,
        currency: "EUR",
        status: "pending",
        stripe_session_id: order.orderId,
      });
    }
    return NextResponse.json({ ok: true, url: order.approveUrl });
  }

  // 4) Mobile Money — joueurs africains (CinetPay, SANS carte bancaire)
  const cp = await getCinetPayConfig();
  if (!cp) {
    return NextResponse.json(
      { ok: false, error: "Paiements pas encore ouverts — bientôt ✨" },
      { status: 503 }
    );
  }
  const transactionId = `prono_${user.id.slice(0, 8)}_${Date.now()}`;
  const payment = await createCinetPayPayment({
    apiKey: cp.apiKey,
    siteId: cp.siteId,
    transactionId,
    email: user.email ?? null,
    origin,
  });
  if ("error" in payment) {
    return NextResponse.json({ ok: false, error: payment.error }, { status: 502 });
  }
  const admin = tryGetSupabaseAdminClient();
  if (admin) {
    await admin.from("payments").insert({
      user_id: user.id,
      provider: "cinetpay",
      plan: PREMIUM_PLAN.id,
      amount_cents: PREMIUM_PLAN_XAF,
      currency: "XAF",
      status: "pending",
      stripe_session_id: transactionId,
    });
  }
  return NextResponse.json({ ok: true, url: payment.paymentUrl });
}
