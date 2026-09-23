import { NextResponse } from "next/server";
import { getCaptchaConfig } from "@/lib/services/integrations.service";

export const dynamic = "force-dynamic";

/**
 * Config PUBLIQUE du captcha Turnstile (aucun secret ici) :
 * la clé de site est publique par conception — elle est embarquée dans la page
 * par le widget Cloudflare. La clé secrète, elle, ne quitte jamais le serveur.
 */
export async function GET() {
  const config = await getCaptchaConfig();
  return NextResponse.json(config);
}
