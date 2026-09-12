/**
 * API MESSAGERIE (MODULE 7) — fil de discussion.
 * GET : messages + autre partie + coordonnées (uniquement si révélées).
 * POST : envoyer un message. PATCH : le propriétaire accepte de révéler
 * ses coordonnées. RLS garantit que seuls les participants y accèdent.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getThread, sendMessage, acceptContact } from "@/lib/services/pronochat.service";

export const dynamic = "force-dynamic";

async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/prono-chat/conversations/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const thread = await getThread(user.id, params.id);
  if (!thread) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  return NextResponse.json(thread);
}

// POST /api/prono-chat/conversations/[id] — { body }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let payload: { body?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = await sendMessage(user.id, params.id, String(payload.body ?? ""));
  if (!result.ok) return NextResponse.json({ error: result.code }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// PATCH /api/prono-chat/conversations/[id] — accepter la révélation des coordonnées
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await acceptContact(user.id, params.id);
  if (!result.ok) {
    const status = result.code === "seul_proprietaire" ? 403 : 404;
    return NextResponse.json({ error: result.code }, { status });
  }
  return NextResponse.json({ ok: true });
}
