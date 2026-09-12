/**
 * API PRONO-VOYAGE (MODULE 6) — GET (liste / mes trajets),
 * POST (publier), PATCH (masquer/afficher), DELETE (supprimer).
 * Sécurité par RLS (owner / admin) + session serveur.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listTrips,
  createTrip,
  updateTripStatus,
  deleteTrip,
} from "@/lib/services/pronovoyage.service";

export const dynamic = "force-dynamic";

async function getSession() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/prono-voyage?origin=&dest=&mine=1&id=
export async function GET(req: NextRequest) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ trips: [] }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const mine = sp.get("mine") === "1";

  // L'admin voit tout (y compris masqués et passés), RLS le garantit côté base
  let isAdmin = false;
  try {
    const { supabase } = await getSession();
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = Boolean(profile?.is_admin);
  } catch {
    /* profil illisible, admin = false */
  }

  const trips = await listTrips(
    { origin: sp.get("origin") ?? undefined, dest: sp.get("dest") ?? undefined, id: sp.get("id") ?? undefined },
    { ...(mine ? { mine: true, userId: user.id } : {}), ...(isAdmin ? { all: true } : {}) }
  );
  return NextResponse.json({ trips });
}

// POST /api/prono-voyage — publier un trajet (connecté)
export async function POST(req: NextRequest) {
  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = await createTrip(user.id, body);
  if (!result.ok) {
    return NextResponse.json({ error: result.code ?? "error" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, trip: result.trip }, { status: 201 });
}

// PATCH /api/prono-voyage — masquer / afficher (owner ou admin via RLS)
export async function PATCH(req: NextRequest) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id || !["active", "hidden", "removed"].includes(String(body.status))) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const result = await updateTripStatus(body.id, body.status as "active" | "hidden" | "removed");
  if (!result.ok) {
    const status = result.code === "not_allowed" ? 403 : 400;
    return NextResponse.json({ error: result.code }, { status });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/prono-voyage?id=… — supprimer (owner ou admin via RLS)
export async function DELETE(req: NextRequest) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const result = await deleteTrip(id);
  if (!result.ok) {
    const status = result.code === "not_allowed" ? 403 : 400;
    return NextResponse.json({ error: result.code }, { status });
  }
  return NextResponse.json({ ok: true });
}
