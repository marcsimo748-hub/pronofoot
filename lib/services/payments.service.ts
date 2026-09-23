/**
 * Phase 3 — Stripe : service de paiement (PRÉPARÉ SANS ÊTRE BRANCHÉ).
 *
 * ⚖️ Sécurité :
 *  • La clé SECRÈTE Stripe vit dans prono_secrets (Admin) ou en variable
 *    d'environnement Vercel — JAMAIS dans le code, JAMAIS côté frontend.
 *  • Tant qu'aucune clé n'est configurée, /api/payments/checkout répond 503
 *    et le bouton Premium reste « bientôt disponible » : zéro impact visiteur.
 *  • Le webhook vérifie la signature Stripe (HMAC SHA-256) avant toute écriture.
 *
 * Implémentation en `fetch` natif : aucune dépendance ajoutée, le passage à la
 * lib officielle `stripe` restera possible sans toucher aux routes.
 */

import crypto from "node:crypto";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

/** Le seul plan payant pour l'instant : un pass Premium de 30 jours (4,99 €). */
export const PREMIUM_PLAN = {
  id: "premium_monthly",
  label: "PRONO Premium · 30 jours",
  amountCents: 499,
  currency: "eur",
  days: 30,
} as const;

/** Pass Premium en francs CFA (CinetPay facture en XAF au Cameroun).
 *  3 250 XAF ≈ 4,99 € — ajustable en une ligne. */
export const PREMIUM_PLAN_XAF = 3250;

// ---------------------------------------------------------------
// CLÉS (prono_secrets PRIME sur la variable Vercel — pattern fournisseur)
// ---------------------------------------------------------------

type PayKeys = {
  secret: string | null;
  webhook: string | null;
  cpApiKey: string | null;
  cpSiteId: string | null;
  ppClientId: string | null;
  ppSecret: string | null;
};

let keyCache: (PayKeys & { at: number }) | null = null;
const KEY_TTL = 60_000;

async function readSecret(secretKey: string): Promise<string | null> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("prono_secrets").select("value").eq("key", secretKey).maybeSingle();
  return data?.value ? String(data.value) : null;
}

async function loadKeys(): Promise<PayKeys> {
  if (keyCache && Date.now() - keyCache.at < KEY_TTL) return keyCache;
  const [dbSecret, dbWebhook, dbCpKey, dbCpSite, dbPpId, dbPpSecret] = await Promise.all([
    readSecret("stripe_secret_key"),
    readSecret("stripe_webhook_secret"),
    readSecret("cinetpay_api_key"),
    readSecret("cinetpay_site_id"),
    readSecret("paypal_client_id"),
    readSecret("paypal_secret"),
  ]);
  const value: PayKeys = {
    secret: dbSecret ?? process.env.STRIPE_SECRET_KEY ?? null,
    webhook: dbWebhook ?? process.env.STRIPE_WEBHOOK_SECRET ?? null,
    cpApiKey: dbCpKey ?? process.env.CINETPAY_API_KEY ?? null,
    cpSiteId: dbCpSite ?? process.env.CINETPAY_SITE_ID ?? null,
    ppClientId: dbPpId ?? process.env.PAYPAL_CLIENT_ID ?? null,
    ppSecret: dbPpSecret ?? process.env.PAYPAL_SECRET ?? null,
  };
  keyCache = { ...value, at: Date.now() };
  return value;
}

export async function getStripeSecretKey(): Promise<string | null> {
  return (await loadKeys()).secret;
}

export async function getStripeWebhookSecret(): Promise<string | null> {
  return (await loadKeys()).webhook;
}

/** Phase 3 active ? (une clé secrète Stripe suffit pour activer le checkout) */
export async function isStripeConfigured(): Promise<boolean> {
  return Boolean(await getStripeSecretKey());
}

export async function getCinetPayConfig(): Promise<{ apiKey: string; siteId: string } | null> {
  const k = await loadKeys();
  return k.cpApiKey && k.cpSiteId ? { apiKey: k.cpApiKey, siteId: k.cpSiteId } : null;
}

/** CinetPay prêt ? (clé API + identifiant de site) */
export async function isCinetPayConfigured(): Promise<boolean> {
  return Boolean(await getCinetPayConfig());
}

/** PayPal prêt ? (client_id + secret d'un compte PayPal Business) */
export async function getPayPalConfig(): Promise<{ clientId: string; secret: string } | null> {
  const k = await loadKeys();
  return k.ppClientId && k.ppSecret ? { clientId: k.ppClientId, secret: k.ppSecret } : null;
}

export async function isPayPalConfigured(): Promise<boolean> {
  return Boolean(await getPayPalConfig());
}

/** Le bouton Premium s'affiche dès qu'UN moyen de paiement est prêt. */
export async function isAnyPaymentConfigured(): Promise<boolean> {
  return (
    (await isPayPalConfigured()) || (await isCinetPayConfigured()) || (await isStripeConfigured())
  );
}

/** Moyens de paiement proposés au joueur : PayPal (Europe) et/ou
 *  Mobile Money (Afrique). AUCUNE carte bancaire — choix du propriétaire. */
export async function getAvailableMethods(): Promise<{ paypal: boolean; mobileMoney: boolean }> {
  return {
    paypal: await isPayPalConfigured(),
    mobileMoney: await isCinetPayConfigured(),
  };
}

/** Invalidation après sauvegarde Admin (la clé doit être prise en compte vite) */
export function invalidateStripeKeyCache(): void {
  keyCache = null;
}

// ---------------------------------------------------------------
// TEST DE CLÉ (utilisé par l'Admin avant sauvegarde)
// ---------------------------------------------------------------

export async function testStripeKey(key: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------
// CHECKOUT — création de session (100 % côté serveur)
// ---------------------------------------------------------------

export async function createCheckoutSession(opts: {
  key: string;
  userId: string;
  email?: string | null;
  origin: string;
}): Promise<{ id: string; url: string } | { error: string }> {
  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("success_url", `${opts.origin}/tarifs?paiement=merci`);
  p.set("cancel_url", `${opts.origin}/tarifs?paiement=annule`);
  p.set("client_reference_id", opts.userId);
  if (opts.email) p.set("customer_email", opts.email);
  p.set("metadata[user_id]", opts.userId);
  p.set("metadata[plan]", PREMIUM_PLAN.id);
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", PREMIUM_PLAN.currency);
  p.set("line_items[0][price_data][unit_amount]", String(PREMIUM_PLAN.amountCents));
  p.set("line_items[0][price_data][product_data][name]", PREMIUM_PLAN.label);
  p.set(
    "line_items[0][price_data][product_data][description]",
    "Statistiques et confort avancés sur PRONO (jeu à points, sans argent réel) · 30 jours"
  );

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: p.toString(),
      cache: "no-store",
    });
    const json = (await res.json()) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };
    if (!res.ok || !json.id || !json.url) {
      return { error: json.error?.message ?? "Stripe a refusé la session de paiement" };
    }
    return { id: json.id, url: json.url };
  } catch (e) {
    return { error: `Stripe injoignable (${(e as Error).message})` };
  }
}

// ---------------------------------------------------------------
// WEBHOOK — vérification de signature (schéma officiel Stripe)
// ---------------------------------------------------------------

/** Vérifie l'en-tête `stripe-signature` : t=…,v1=HMAC_SHA256(secret, "t.payload") */
export function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = header.split(",").map((chunk) => chunk.split("=", 2) as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const v1 = parts.find(([k]) => k === "v1")?.[1];
  if (!t || !v1) return false;
  // Fenêtre de 5 min contre les rejeus
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}


// ---------------------------------------------------------------
// CINETPAY — passerelle panafricaine (cartes Visa/MC + Mobile Money)
// Page de paiement hébergée chez CinetPay : aucune donnée carte ne
// transite par nos serveurs.
// ---------------------------------------------------------------

const CINETPAY_BASE = "https://api-checkout.cinetpay.com/v2";

/** Test des clés CinetPay (utilisé par l'Admin) : l'API /check répond
 *  différemment selon que la clé/le site sont valides ou non. */
export async function testCinetPayKeys(apiKey: string, siteId: string): Promise<boolean> {
  try {
    const res = await fetch(`${CINETPAY_BASE}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: "PRONO_TEST_CLE" }),
      cache: "no-store",
    });
    const json = (await res.json()) as { code?: string };
    // 401 = clé invalide ; sinon les clés sont acceptées (transaction inconnue = normal)
    return res.status !== 401 && json.code !== "401";
  } catch {
    return false;
  }
}

/** Crée un paiement CinetPay → URL de paiement hébergée (redirection). */
export async function createCinetPayPayment(opts: {
  apiKey: string;
  siteId: string;
  transactionId: string;
  email?: string | null;
  origin: string;
}): Promise<{ paymentUrl: string } | { error: string }> {
  const body = {
    apikey: opts.apiKey,
    site_id: opts.siteId,
    transaction_id: opts.transactionId,
    amount: PREMIUM_PLAN_XAF,
    currency: "XAF",
    description: "PRONO Premium · 30 jours (jeu à points)",
    channels: "MOBILE_MONEY", // uniquement Mobile Money · aucune carte bancaire (choix du propriétaire)
    return_url: `${opts.origin}/tarifs?paiement=merci`,
    notify_url: `${opts.origin}/api/payments/webhook/cinetpay`,
    customer_email: opts.email ?? undefined,
    metadata: opts.transactionId,
  };
  try {
    const res = await fetch(`${CINETPAY_BASE}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json()) as {
      code?: string;
      message?: string;
      data?: { payment_url?: string };
    };
    if (!json.data?.payment_url) {
      return { error: `CinetPay : ${json.message ?? "session refusée"} (code ${json.code ?? res.status})` };
    }
    return { paymentUrl: json.data.payment_url };
  } catch (e) {
    return { error: `CinetPay injoignable (${(e as Error).message})` };
  }
}

/** Vérifie une transaction CinetPay auprès de l'API (NE JAMAIS faire
 *  confiance au corps du notify seul). status "ACCEPTED" = payé. */
export async function checkCinetPayTransaction(opts: {
  apiKey: string;
  siteId: string;
  transactionId: string;
}): Promise<{ status: string; amount: number | null } | { error: string }> {
  try {
    const res = await fetch(`${CINETPAY_BASE}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: opts.apiKey,
        site_id: opts.siteId,
        transaction_id: opts.transactionId,
      }),
      cache: "no-store",
    });
    const json = (await res.json()) as {
      data?: { status?: string; amount?: number };
      message?: string;
    };
    if (!json.data?.status) return { error: json.message ?? "réponse invalide" };
    return { status: json.data.status, amount: json.data.amount ?? null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}


// ---------------------------------------------------------------
// PAYPAL — paiement des joueurs européens (page hébergée PayPal,
// aucune donnée bancaire sur nos serveurs). Compte Business requis.
// ---------------------------------------------------------------

const PAYPAL_BASE = "https://api-m.paypal.com";
export const PREMIUM_PLAN_EUR = "4.99";

async function payPalAccessToken(clientId: string, secret: string): Promise<string | { error: string }> {
  try {
    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    const json = (await res.json()) as { access_token?: string; error_description?: string };
    if (!res.ok || !json.access_token) {
      return { error: json.error_description ?? "Identifiants PayPal refusés" };
    }
    return json.access_token;
  } catch (e) {
    return { error: `PayPal injoignable (${(e as Error).message})` };
  }
}

/** Test des clés PayPal (utilisé par l'Admin avant sauvegarde). */
export async function testPayPalKeys(clientId: string, secret: string): Promise<boolean> {
  const token = await payPalAccessToken(clientId, secret);
  return typeof token === "string";
}

/** Crée une commande PayPal → URL d'approbation (redirection). */
export async function createPayPalOrder(opts: {
  clientId: string;
  secret: string;
  userId: string;
  origin: string;
}): Promise<{ orderId: string; approveUrl: string } | { error: string }> {
  const token = await payPalAccessToken(opts.clientId, opts.secret);
  if (typeof token !== "string") return { error: token.error };
  try {
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: opts.userId,
            description: "PRONO Premium · 30 jours (jeu à points)",
            amount: { currency_code: "EUR", value: PREMIUM_PLAN_EUR },
          },
        ],
        application_context: {
          brand_name: "PRONO",
          locale: "fr-FR",
          shipping_preference: "NO_SHIPPING",
          return_url: `${opts.origin}/api/payments/paypal/capture`,
          cancel_url: `${opts.origin}/tarifs?paiement=annule`,
        },
      }),
      cache: "no-store",
    });
    const json = (await res.json()) as {
      id?: string;
      links?: { rel?: string; href?: string }[];
      message?: string;
    };
    const approve = json.links?.find((l) => l.rel === "approve")?.href;
    if (!json.id || !approve) {
      return { error: json.message ?? "PayPal a refusé la commande" };
    }
    return { orderId: json.id, approveUrl: approve };
  } catch (e) {
    return { error: `PayPal injoignable (${(e as Error).message})` };
  }
}

/** Capture le paiement après retour du joueur (statut COMPLETED = payé). */
export async function capturePayPalOrder(opts: {
  clientId: string;
  secret: string;
  orderId: string;
}): Promise<{ status: string; userId: string | null } | { error: string }> {
  const token = await payPalAccessToken(opts.clientId, opts.secret);
  if (typeof token !== "string") return { error: token.error };
  try {
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${opts.orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    const json = (await res.json()) as {
      status?: string;
      message?: string;
      purchaser_units?: { custom_id?: string }[];
      purchase_units?: { custom_id?: string }[];
    };
    if (!json.status) return { error: json.message ?? "capture impossible" };
    const userId = json.purchase_units?.[0]?.custom_id ?? null;
    return { status: json.status, userId };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
