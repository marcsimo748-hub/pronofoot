/**
 * 🔐 Intégrations sécurité & e-mails — Turnstile (anti-robot) + Resend (e-mails).
 *
 * Clés : Admin (prono_secrets) PRIME sur les variables d'environnement Vercel.
 * Aucune clé n'est jamais exposée au navigateur :
 *   • turnstile_secret_key / resend_api_key → serveur uniquement
 *   • turnstile_site_key → publique par conception (fournie au widget via
 *     /api/security/captcha-config), le secret reste côté serveur.
 *
 * Turnstile : la vérification du jeton est faite par Supabase Auth
 * (Authentication → Captcha → Cloudflare Turnstile). Les formulaires
 * envoient options.captchaToken ; sans jeton valide Supabase refuse
 * l'inscription / la réinitialisation.
 */

import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

type KeyName = "turnstile_site_key" | "turnstile_secret_key" | "resend_api_key";

const cache = new Map<KeyName, { at: number; value: string | null }>();
const TTL_MS = 60_000;

/** Valeur effective d'une clé : Admin (prono_secrets) > variable Vercel */
export async function getIntegrationKey(name: KeyName): Promise<string | null> {
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const envNames: Record<KeyName, string | undefined> = {
    turnstile_site_key: process.env.TURNSTILE_SITE_KEY,
    turnstile_secret_key: process.env.TURNSTILE_SECRET_KEY,
    resend_api_key: process.env.RESEND_API_KEY,
  };
  let value = envNames[name] ?? null;
  try {
    const admin = tryGetSupabaseAdminClient();
    if (admin) {
      const { data } = await admin.from("prono_secrets").select("value").eq("key", name).maybeSingle();
      if (data?.value) value = String(data.value); // la clé Admin prime
    }
  } catch {
    /* env seulement */
  }
  cache.set(name, { at: Date.now(), value });
  return value;
}

/** Config publique du captcha (consommée par les formulaires côté navigateur) */
export async function getCaptchaConfig(): Promise<{ enabled: boolean; siteKey: string | null }> {
  const siteKey = await getIntegrationKey("turnstile_site_key");
  return { enabled: Boolean(siteKey), siteKey };
}

/**
 * Test de la clé secrète Turnstile : on appelle siteverify avec un jeton
 * volontairement invalide. Si la clé est mauvaise, Cloudflare répond
 * « invalid-input-secret » ; si la clé est bonne, seul le jeton est fautif
 * (« invalid-input-response ») → la clé est validée sans consommer de jeton réel.
 */
export async function testTurnstileSecret(secret: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: "XXXX.DUMMY.TOKEN.XXXX" }),
      cache: "no-store",
    });
    const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    const codes = json["error-codes"] ?? [];
    if (codes.includes("invalid-input-secret")) return { ok: false, detail: "Clé secrète refusée par Cloudflare" };
    if (codes.includes("invalid-input-response")) return { ok: true, detail: "Clé secrète valide (jeton de test rejeté comme prévu)" };
    return { ok: json.success === true, detail: codes.join(", ") || "Réponse inattendue de Cloudflare" };
  } catch (e) {
    return { ok: false, detail: `Cloudflare injoignable : ${(e as Error).message}` };
  }
}

// ============================================================
// 📧 RESEND — e-mails transactionnels (REST, zéro dépendance)
// ============================================================

const RESEND_ENDPOINT = "https://api.resend.com/emails";
/** Sans domaine vérifié, Resend n'autorise que ce champ d'expédition (mode test) */
const TEST_SENDER = "PRONO <onboarding@resend.dev>";

/** Gabarit HTML sobre et sombre, aux couleurs du site */
export function emailTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:24px;background:#0a0a0b;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#131318;border:1px solid #26262e;border-radius:16px;overflow:hidden">
      <tr><td style="padding:20px 28px;background:linear-gradient(135deg,#10b98133,transparent);border-bottom:1px solid #26262e">
        <p style="margin:0;font-size:20px;font-weight:800">⚽ PRONO</p>
        <p style="margin:4px 0 0;font-size:12px;color:#94a3b8">Pronostics football entre potes</p>
      </td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 14px;font-size:19px;color:#fff">${title}</h1>
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #26262e;font-size:11px;color:#64748b">
        Jeu à points entre amis · aucune promesse de gains. Si tu n'attendais pas cet e-mail, ignore-le simplement.
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

/**
 * Envoie un e-mail via Resend. Best-effort : ne JAMAIS lever d'erreur au
 * appelant (un échec d'e-mail ne doit pas casser un flux applicatif).
 * Retourne { ok, detail } pour les logs et le bouton de test Admin.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; detail: string }> {
  const key = await getIntegrationKey("resend_api_key");
  if (!key) return { ok: false, detail: "Aucune clé Resend configurée (Admin → 🔐 Sécurité & E-mails)" };
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: TEST_SENDER, to: [opts.to], subject: opts.subject, html: opts.html }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (res.ok && json.id) return { ok: true, detail: `Envoyé (${json.id})` };
    // 403 classique sans domaine vérifié : on ne peut écrire qu'à soi-même
    if (res.status === 403)
      return {
        ok: false,
        detail: "Resend refuse : sans domaine vérifié, on ne peut envoyer qu'à l'adresse du compte Resend (mode test)",
      };
    return { ok: false, detail: json.message ?? json.name ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: `Resend injoignable : ${(e as Error).message}` };
  }
}

/** Vérifie une clé Resend sans envoyer d'e-mail (GET /domains) */
export async function testResendKey(key: string): Promise<{ ok: boolean; detail: string; domains: string[] }> {
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, detail: `Clé refusée (HTTP ${res.status})`, domains: [] };
    const json = (await res.json()) as { data?: Array<{ name?: string }> };
    const domains = (json.data ?? []).map((d) => d.name ?? "").filter(Boolean);
    return {
      ok: true,
      detail: domains.length
        ? `Clé valide · domaine(s) vérifié(s) : ${domains.join(", ")}`
        : "Clé valide · aucun domaine vérifié (mode test : envoi uniquement à ton adresse Resend)",
      domains,
    };
  } catch (e) {
    return { ok: false, detail: `Resend injoignable : ${(e as Error).message}`, domains: [] };
  }
}
