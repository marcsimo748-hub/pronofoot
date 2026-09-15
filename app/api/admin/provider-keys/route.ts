import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getApiSportsKey,
  getFootballDataKey,
  invalidateProviderKeyCaches,
} from "@/lib/services/football.providers";

export const dynamic = "force-dynamic";

/**
 * GET|POST /api/admin/provider-keys — clés des fournisseurs de données (admin only).
 * GET  : statut masqué des 3 fournisseurs (clé présente ? source ? jamais le secret).
 * POST : { provider: "api_sports" | "football_data", key } sauvegarde (test avant,
 *        valeur vide = suppression) ; { provider, test: true } teste la clé active.
 * ESPN ne nécessite aucune clé (test toujours disponible).
 */

type ProviderId = "api_sports" | "football_data" | "espn";

const SECRETS: Record<"api_sports" | "football_data", { secretKey: string; envVar: string; label: string }> = {
  api_sports: { secretKey: "api_sports_key", envVar: "API_SPORTS_KEY", label: "API-Football (api-sports.io)" },
  football_data: { secretKey: "football_data_key", envVar: "FOOTBALL_DATA_KEY", label: "football-data.org" },
};

function mask(key: string): string {
  return key.length <= 8 ? "••••" : `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

async function readSecret(secretKey: string): Promise<string | null> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("prono_secrets").select("value").eq("key", secretKey).maybeSingle();
  return data?.value ? String(data.value) : null;
}

async function testApiFootball(key: string) {
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

async function testFootballData(key: string) {
  try {
    const res = await fetch("https://api.football-data.org/v4/matches?competitions=PL,CL,PD,SA,FL1,BL1", {
      headers: { "X-Auth-Token": key },
      cache: "no-store",
    });
    let count = 0;
    let errors: Record<string, string> | null = null;
    try {
      const json = (await res.json()) as { matches?: unknown[]; message?: string };
      count = json.matches?.length ?? 0;
      if (!res.ok) errors = { http: json.message ?? `HTTP ${res.status}` };
    } catch {
      if (!res.ok) errors = { http: `HTTP ${res.status}` };
    }
    return {
      httpStatus: res.status,
      ok: res.ok,
      liveFixturesFound: count,
      errors,
      quotaRemaining: res.headers.get("x-request-counter"),
    };
  } catch (e) {
    return { httpStatus: 0, ok: false, liveFixturesFound: 0, errors: { network: (e as Error).message }, quotaRemaining: null };
  }
}

async function testEspn() {
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard", {
      cache: "no-store",
    });
    const json = (await res.json()) as { events?: unknown[] };
    return {
      httpStatus: res.status,
      ok: res.ok,
      liveFixturesFound: json.events?.length ?? 0,
      errors: null as Record<string, string> | null,
      quotaRemaining: null as string | null,
    };
  } catch (e) {
    return { httpStatus: 0, ok: false, liveFixturesFound: 0, errors: { network: (e as Error).message }, quotaRemaining: null };
  }
}

export async function GET() {
  const admin = await requireAdminUser(new Request("http://local"));
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const providers: Record<string, unknown>[] = [];
  for (const [id, conf] of Object.entries(SECRETS) as [keyof typeof SECRETS, (typeof SECRETS)[keyof typeof SECRETS]][]) {
    const dbKey = await readSecret(conf.secretKey);
    const envKey = process.env[conf.envVar] ?? null;
    providers.push({
      id,
      label: conf.label,
      needsKey: true,
      dbKey: dbKey ? mask(dbKey) : null,
      envKey: envKey ? mask(envKey) : null,
      source: dbKey ? "admin" : envKey ? "vercel" : "none",
    });
  }
  providers.push({ id: "espn", label: "ESPN (secours, sans clé)", needsKey: false, source: "always" });
  return NextResponse.json({ ok: true, data: { providers } });
}

export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  try {
    const body = (await req.json()) as { provider?: ProviderId; key?: string; test?: boolean };

    // Tests
    if (body.test) {
      if (body.provider === "api_sports") {
        const key = await getApiSportsKey();
        return NextResponse.json({ ok: true, data: { hasKey: Boolean(key), test: key ? await testApiFootball(key) : null } });
      }
      if (body.provider === "football_data") {
        const key = await getFootballDataKey();
        return NextResponse.json({ ok: true, data: { hasKey: Boolean(key), test: key ? await testFootballData(key) : null } });
      }
      if (body.provider === "espn") {
        return NextResponse.json({ ok: true, data: { hasKey: true, test: await testEspn() } });
      }
      return NextResponse.json({ ok: false, error: "Fournisseur inconnu" }, { status: 400 });
    }

    // Sauvegarde / suppression de clé
    if (body.provider !== "api_sports" && body.provider !== "football_data") {
      return NextResponse.json({ ok: false, error: "Fournisseur inconnu" }, { status: 400 });
    }
    const conf = SECRETS[body.provider];
    const db = tryGetSupabaseAdminClient();
    if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

    const newKey = (body.key ?? "").trim();
    if (!newKey) {
      await db.from("prono_secrets").delete().eq("key", conf.secretKey);
    } else {
      // Test AVANT sauvegarde : une clé refusée n'est jamais enregistrée
      const test = body.provider === "api_sports" ? await testApiFootball(newKey) : await testFootballData(newKey);
      if (!test.ok) {
        return NextResponse.json({ ok: false, error: "Clé refusée par le fournisseur", test }, { status: 400 });
      }
      await db
        .from("prono_secrets")
        .upsert({ key: conf.secretKey, value: newKey, updated_at: new Date().toISOString() }, { onConflict: "key" });
    }

    invalidateProviderKeyCaches();
    const dbKey = await readSecret(conf.secretKey);
    const activeKey = dbKey ?? process.env[conf.envVar] ?? null;
    const test = activeKey
      ? body.provider === "api_sports"
        ? await testApiFootball(activeKey)
        : await testFootballData(activeKey)
      : null;
    return NextResponse.json({ ok: true, data: { saved: Boolean(newKey), source: dbKey ? "admin" : process.env[conf.envVar] ? "vercel" : "none", test } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
