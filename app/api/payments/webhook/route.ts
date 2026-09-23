import { NextResponse } from "next/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PREMIUM_PLAN,
  getStripeWebhookSecret,
  verifyStripeSignature,
} from "@/lib/services/payments.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/webhook — confirmation Stripe (signature vérifiée).
 *
 * Événement géré : checkout.session.completed → le paiement passe « paid » et
 * le compte du joueur devient Premium pendant 30 jours (cumulable). Idempotent :
 * Stripe rejoue parfois ses webhooks — un paiement déjà « paid » n'est jamais
 * recompté deux fois.
 */
export async function POST(req: Request) {
  const secret = await getStripeWebhookSecret();
  if (!secret) {
    // Phase 3 pas encore branchée : Stripe ne doit même pas nous appeler.
    return NextResponse.json({ received: false }, { status: 503 });
  }

  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data?.object ?? {};
    const sessionId = typeof s.id === "string" ? s.id : null;
    const metadataUserId = (s.metadata as { user_id?: string } | undefined)?.user_id ?? null;
    if (!sessionId) return NextResponse.json({ received: true });

    const admin = tryGetSupabaseAdminClient();
    if (!admin) return NextResponse.json({ received: false }, { status: 500 });

    const { data: payment } = await admin
      .from("payments")
      .select("id, status, user_id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (payment && payment.status !== "paid") {
      await admin
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_customer_id: typeof s.customer === "string" ? s.customer : null,
          stripe_payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : null,
        })
        .eq("id", payment.id);

      // Premium +30 jours (cumulable si déjà premium)
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
    } else if (!payment && metadataUserId) {
      // Session créée avant le déploiement de la table payments : on crédite quand même
      const until = new Date(Date.now() + PREMIUM_PLAN.days * 86_400_000);
      await admin
        .from("payments")
        .insert({
          user_id: metadataUserId,
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_session_id: sessionId,
          stripe_customer_id: typeof s.customer === "string" ? s.customer : null,
        });
      await admin
        .from("profiles")
        .update({ premium_until: until.toISOString() })
        .eq("id", metadataUserId);
    }
  }

  return NextResponse.json({ received: true });
}
