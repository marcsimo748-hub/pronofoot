/**
 * API /api/pronoshops — boutiques des membres.
 * GET   ?slug=xx → une boutique + ses articles · sans slug → annuaire
 * POST  → créer MA boutique (connecté, 1 par membre)
 * PATCH → modifier MA boutique (connecté, propriétaire)
 * Sécurité : session serveur + RLS (owner uniquement).
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listShops,
  getShopBySlug,
  getShopItems,
  getMyShop,
  createShop,
  updateShop,
  shopItemCounts,
} from "@/lib/services/pronoshops.service";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/pronoshops[?slug=]
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (slug) {
    const shop = await getShopBySlug(slug);
    if (!shop || shop.status !== "active") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const items = await getShopItems(shop.user_id);
    return NextResponse.json({ shop, items });
  }

  const [shops, counts] = await Promise.all([listShops(), shopItemCounts()]);
  return NextResponse.json({ shops, counts });
}

// POST /api/pronoshops — créer ma boutique
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = await createShop(user.id, body);
  if (!result.ok) {
    const status =
      result.code === "no_table" ? 503 :
      result.code === "already_has_shop" ? 409 : 400;
    return NextResponse.json({ error: result.code, shop: result.shop ?? undefined }, { status });
  }
  return NextResponse.json({ ok: true, shop: result.shop }, { status: 201 });
}

// PATCH /api/pronoshops — modifier ma boutique
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const mine = await getMyShop(user.id);
  if (!mine) return NextResponse.json({ error: "no_shop" }, { status: 404 });

  const result = await updateShop(user.id, body);
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true, shop: result.shop });
}
