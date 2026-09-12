/**
 * API PRONO-ANNONCES (MODULE 5) — GET (liste / mes annonces),
 * POST (publier), PATCH (masquer/afficher), DELETE (supprimer).
 * Sécurité par RLS (owner / admin) + session serveur.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listAnnonces,
  createAnnonce,
  updateAnnonceStatus,
  deleteAnnonce,
} from "@/lib/services/pronoannonces.service";

export const dynamic = "force-dynamic";

async function getSession() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/prono-annonces?category=&city=&q=&mine=1
export async function GET(req: NextRequest) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ annonces: [] }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const mine = sp.get("mine") === "1";
  const annonces = await listAnnonces(
    {
      id: sp.get("id") ?? undefined,
      category: sp.get("category") ?? undefined,
      city: sp.get("city") ?? undefined,
      q: sp.get("q") ?? undefined,
    },
    mine ? { mine: true, userId: user.id } : {}
  );
  return NextResponse.json({ annonces });
}

// POST /api/prono-annonces — publier une annonce (connecté)
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

  const result = await createAnnonce(user.id, body);
  if (!result.ok) {
    return NextResponse.json({ error: result.code ?? "error" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, annonce: result.annonce }, { status: 201 });
}

// PATCH /api/prono-annonces — masquer / afficher (owner ou admin via RLS)
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

  const result = await updateAnnonceStatus(body.id, body.status as "active" | "hidden" | "removed");
  if (!result.ok) {
    const status = result.code === "not_allowed" ? 403 : 400;
    return NextResponse.json({ error: result.code }, { status });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/prono-annonces?id=… — supprimer (owner ou admin via RLS)
export async function DELETE(req: NextRequest) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const result = await deleteAnnonce(id);
  if (!result.ok) {
    const status = result.code === "not_allowed" ? 403 : 400;
    return NextResponse.json({ error: result.code }, { status });
  }
  return NextResponse.json({ ok: true });
}
