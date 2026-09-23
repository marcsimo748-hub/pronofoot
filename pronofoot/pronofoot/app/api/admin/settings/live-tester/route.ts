import { NextResponse } from "next/server";
import { getSettings } from "@/lib/services/settings.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/settings/live-tester — état du mode testeur (polling léger) */
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ ok: true, data: settings.live_tester });
}
