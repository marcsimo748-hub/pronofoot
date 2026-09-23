import { getSessionUser } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET  /api/theme-override  → lit la valeur depuis site_settings
 *      (lecture publique, non sensible : juste un identifiant de thème)
 * POST /api/theme-override  → met à jour (admin seulement) avec
 *      { value: "auto" | "off" | "season:..." | "event:..." | "template:..." }
 */

export const dynamic = "force-dynamic";

const ALLOWED_PREFIXES = ["season:", "event:", "template:"];
const ALLOWED_VALUES = new Set(["auto", "off"]);

export async function GET() {
  try {
    const supa = createSupabaseServerClient();
    const { data } = await supa
      .from("site_settings")
      .select("value")
      .eq("key", "theme_override")
      .maybeSingle();
    return Response.json({ ok: true, data: { value: (data?.value as string) ?? "auto" } });
  } catch {
    return Response.json({ ok: false, code: "error" });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.is_admin) {
    return Response.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }
  let body: { value?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, code: "bad_json" });
  }
  const v = String(body.value ?? "").trim();
  const okValue =
    ALLOWED_VALUES.has(v) || ALLOWED_PREFIXES.some((p) => v.startsWith(p));
  if (!okValue) {
    return Response.json({ ok: false, code: "bad_value" });
  }
  try {
    const supa = createSupabaseServerClient();
    // upsert
    const { error } = await supa
      .from("site_settings")
      .upsert({ key: "theme_override", value: v, updated_at: new Date().toISOString() } as any, {
        onConflict: "key",
      });
    if (error) return Response.json({ ok: false, code: "db_error", error: error.message });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, code: "error", error: String(e) });
  }
}
