import { NextResponse } from "next/server";
import { syncNews } from "@/lib/services/news.service";
import { getSettings, updateSetting } from "@/lib/services/settings.service";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET|POST /api/news/sync — Cron des actualités (toutes les 10 minutes).
 * GNews API en priorité, fallback Google News RSS (gratuit, sans clé).
 */
async function handle() {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return NextResponse.json({ ok: true, skipped: "no_supabase" });

  // Throttle 10 minutes (NEWS_SYNC_INTERVAL)
  const settings = await getSettings();
  const interval = (Number(process.env.NEWS_SYNC_INTERVAL) || 600) * 1000;
  if (Date.now() - settings.sync_state.last_news_sync < interval) {
    return NextResponse.json({ ok: true, skipped: "throttled" });
  }
  await updateSetting("sync_state", { last_news_sync: Date.now() }).catch(() => {});

  try {
    const result = await syncNews();
    if (result.skipped) return NextResponse.json({ ok: true, skipped: result.skipped });
    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    console.error("[api/news/sync]", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
