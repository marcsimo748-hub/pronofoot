import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { chat, getAiKeyStatus, invalidateSecretsCache, diagnoseAi } from "@/lib/services/ai.service";

export const dynamic = "force-dynamic";

/**
 * GET|POST /api/admin/ai-keys — clés API de l'assistant IA (admin only).
 * GET  : statut masqué (clés présentes ou non, jamais le secret complet).
 * POST : { groq_api_key?, gemini_api_key? } — valeur vide = supprimer la clé.
 * Test : POST { test: true } envoie une question bidon et renvoie le provider.
 */

const SECRETS = ["groq_api_key", "gemini_api_key"] as const;

export async function GET() {
  const admin = await requireAdminUser(new Request("http://local"));
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const status = await getAiKeyStatus();
  return NextResponse.json({ ok: true, data: status });
}

export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  try {
    const body = (await req.json()) as { groq_api_key?: string; gemini_api_key?: string; test?: boolean };

    // Mode test : diagnostic complet (clés, appel réel Groq, réponse)
    if (body.test) {
      const diag = await diagnoseAi();
      let reply = "";
      let provider = "local";
      if (!diag.groq_error) {
        const r = await chat([{ role: "user", content: "Réponds simplement : tout fonctionne." }], admin.id);
        reply = r.reply.slice(0, 200);
        provider = r.provider;
      }
      return NextResponse.json({ ok: true, data: { ...diag, reply, provider } });
    }

    const db = tryGetSupabaseAdminClient();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Service role non configuré sur le serveur" }, { status: 500 });
    }

    for (const key of SECRETS) {
      if (typeof body[key] !== "string") continue;
      const value = body[key].trim();
      if (value) {
        const { error } = await db
          .from("prono_secrets")
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (error) return NextResponse.json({ ok: false, error: `Échec (${key})` }, { status: 500 });
      } else {
        await db.from("prono_secrets").delete().eq("key", key);
      }
    }

    invalidateSecretsCache();
    const status = await getAiKeyStatus();
    return NextResponse.json({ ok: true, data: status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
