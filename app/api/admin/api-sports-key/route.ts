import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { getApiSportsKey, invalidateApiSportsKeyCache } from "@/lib/services/football.service";

export const dynamic = "force-dynamic";

/**
 * GET|POST /api/admin/api-sports-key — clé API-FOOTBALL (admin only).
 * GET  : statut masqué (source de la clé active, jamais le secret complet).
 * POST : { key } sauvegarde la clé (admin > Vercel) ; { key: "" } la supprime.
 *        { test: true } teste la clé active avec un vrai appel API-Sports.
 * La clé est stockée dans la table PRIVÉE prono_secrets (jamais lisible publiquement).
 */

const SECRET_KEY = "api_sports_key";

function mask(key: string): string {
  return key.length <= 8 ? "••••" : `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

async function readSecret(): Promise<string | null> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("prono_secrets").select("value").eq("key", SECRET_KEY).maybeSingle();
  return data?.value ? String(data.value) : null;
}

/** Test réel : appelle /fixtures?live=all et renvoie statut + erreurs + quota */
async function testKey(key: string) {
  try {
    const res = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
      headers: { "x-apisports-key": key },
      cache: "no-store",
    });
    const json = (await res.json()) as { response?: unknown[]; errors?: Record<string, string> };
    return {
      httpStatus: res.status,
      ok: res.ok && (!json.errors || Object.keys(json.errors).length === 0),
      liveFixturesFound: json.response?.length ?? 0,
      errors: json.errors && Object.keys(json.errors).length ? json.errors : null,
      quotaRemaining: res.headers.get("x-requests-remaining") ?? res.headers.get("x-ratelimit-requests-remaining"),
    };
  } catch (e) {
    return { httpStatus: 0, ok: false, liveFixturesFound: 0, errors: { network: (e as Error).message }, quotaRemaining: null };
  }
}

export async function GET() {
  const admin = await requireAdminUser(new Request("http://local"));
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const dbKey = await readSecret();
  const envKey = process.env.API_SPORTS_KEY ?? null;
  const active = dbKey ?? envKey;
  return NextResponse.json({
    ok: true,
    data: {
      dbKey: dbKey ? mask(dbKey) : null,
      envKey: envKey ? mask(envKey) : null,
      source: dbKey ? "admin" : envKey ? "vercel" : "none",
      hasKey: Boolean(active),
    },
  });
}

export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  try {
    const body = (await req.json()) as { key?: string; test?: boolean };

    // Mode test : diagnostic de la clé active (admin ou Vercel)
    if (body.test) {
      const key = await getApiSportsKey();
      if (!key) return NextResponse.json({ ok: true, data: { hasKey: false, test: null } });
      const test = await testKey(key);
      return NextResponse.json({ ok: true, data: { hasKey: true, test } });
    }

    const db = tryGetSupabaseAdminClient();
    if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

    const newKey = (body.key ?? "").trim();

    if (!newKey) {
      // Suppression de la clé admin → retour à la variable Vercel
      await db.from("prono_secrets").delete().eq("key", SECRET_KEY);
    } else {
      // Test AVANT sauvegarde : une clé invalide est refusée
      const test = await testKey(newKey);
      if (!test.ok) {
        return NextResponse.json(
          { ok: false, error: "Clé refusée par API-Sports", test },
          { status: 400 }
        );
      }
      await db.from("prono_secrets").upsert(
        { key: SECRET_KEY, value: newKey, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    }

    invalidateApiSportsKeyCache();
    const dbKey = await readSecret();
    const active = dbKey ?? process.env.API_SPORTS_KEY ?? null;
    return NextResponse.json({
      ok: true,
      data: {
        saved: Boolean(newKey),
        source: dbKey ? "admin" : process.env.API_SPORTS_KEY ? "vercel" : "none",
        test: active ? await testKey(active) : null,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
