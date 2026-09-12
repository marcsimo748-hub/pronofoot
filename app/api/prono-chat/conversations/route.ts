/**
 * API MESSAGERIE (MODULE 7) — GET mes conversations, POST démarrer une
 * discussion sur une annonce / un trajet (création ou récupération).
 * Toutes les vérifications de sécurité sont en RLS côté base.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrGetConversation, myConversations } from "@/lib/services/pronochat.service";

export const dynamic = "force-dynamic";

// GET /api/prono-chat/conversations — ma liste de discussions
export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ conversations: [] }, { status: 401 });

  const conversations = await myConversations(user.id);
  return NextResponse.json({ conversations });
}

// POST /api/prono-chat/conversations — { context_type, context_id }
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { context_type?: string; context_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.context_type || !body.context_id) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const result = await createOrGetConversation(user.id, body.context_type, body.context_id);
  if (!result.ok) {
    const status = result.code === "annonce_a_soi" ? 400 : 404;
    return NextResponse.json({ error: result.code }, { status });
  }
  return NextResponse.json({ ok: true, conversation_id: result.conversationId }, { status: 201 });
}
