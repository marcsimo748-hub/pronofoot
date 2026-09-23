import { NextResponse } from "next/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PREMIUM_PLAN,
  PREMIUM_PLAN_XAF,
  getCinetPayConfig,
  checkCinetPayTransaction,
} from "@/lib/services/payments.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/webhook/cinetpay — notification CinetPay.
 *
 * ⚠️ Le corps de la notification n'est JAMAIS cru sur parole : à réception,
 * on interroge l'API CinetPay (/payment/check) pour obtenir le vrai statut.
 * Paiement ACCEPTED + montant conforme → statut « paid » + 30 jours Premium
 * (cumulable). Idempotent : les notifications rejouées ne recomptent pas.
 */
export async function POST(req: Request) {
  const cp = await getCinetPayConfig();
  if (!cp) {
    return NextResponse.json({ received: false }, { status: 503 });
  }

  let transactionId: string | null = null;
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const json = (await req.json()) as { cpm_trans_id?: string; transaction_id?: string };
      transactionId = json.cpm_trans_id ?? json.transaction_id ?? null;
    } else {
      const form = await req.formData();
      transactionId =
        (form.get("cpm_trans_id") as string | null) ?? (form.get("transaction_id") as string | null);
    }
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
  if (!transactionId) return NextResponse.json({ received: false }, { status: 400 });

  // Vérification officielle auprès de CinetPay
  const check = await checkCinetPayTransaction({
    apiKey: cp.apiKey,
    siteId: cp.siteId,
    transactionId,
  });
  if ("error" in check) {
    return NextResponse.json({ received: false }, { status: 502 });
  }
  if (check.status !== "ACCEPTED") {
    // En attente / refusé : rien à créditer
    return NextResponse.json({ received: true });
  }

  const admin = tryGetSupabaseAdminClient();
  if (!admin) return NextResponse.json({ received: false }, { status: 500 });

  const { data: payment } = await admin
    .from("payments")
    .select("id, status, user_id, amount_cents")
    .eq("stripe_session_id", transactionId)
    .maybeSingle();

  if (payment && payment.status !== "paid") {
    // Montant conforme ? (anti-tampering : la ligne a été créée par nos soins)
    if (check.amount !== null && check.amount < PREMIUM_PLAN_XAF) {
      return NextResponse.json({ received: true });
    }
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

  return NextResponse.json({ received: true });
}
