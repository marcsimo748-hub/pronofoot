import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import { updateSetting, getSettings, invalidateSettingsCache } from "@/lib/services/settings.service";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET|POST /api/admin/settings — lecture / écriture des réglages du site (admin only).
 * POST body : { key: keyof SiteSettings, value: Partial<...> }
 */
export async function GET() {
  const admin = await requireAdminUser(new Request("http://local"));
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });
  const settings = await getSettings();
  return NextResponse.json({ ok: true, data: settings });
}

export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  try {
    const body = (await req.json()) as { key?: keyof SiteSettings; value?: unknown };
    if (!body.key || !(body.key in DEFAULT_SETTINGS)) {
      return NextResponse.json({ ok: false, error: "Clé de réglage invalide" }, { status: 400 });
    }
    const merged = await updateSetting(body.key, body.value as object);
    return NextResponse.json({ ok: true, data: merged });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  // Invalide le cache (utile après modifications externes)
  invalidateSettingsCache();
  return NextResponse.json({ ok: true });
}
