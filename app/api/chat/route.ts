import { NextResponse } from "next/server";
import { chat, saveChatHistory } from "@/lib/services/ai.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { ChatMsg } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/chat — Assistant IA du site.
 * Chaîne : GROQ (llama-3.1-70b) → Gemini → réponses locales.
 * Historique sauvegardé dans `chat_history` pour les utilisateurs connectés.
 */
export async function POST(req: Request) {
  try {
    // Quota anti-abus : 20 messages / minute / IP (protège les clés GROQ/Gemini)
    const rl = rateLimit(`chat:${clientIp(req)}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Tu envoies des messages trop vite, patiente un instant." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { messages?: ChatMsg[] };
    const messages = (body.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-10);

    if (!messages.length) {
      return NextResponse.json({ ok: false, error: "Messages requis" }, { status: 400 });
    }

    // Utilisateur connecté ? (pour le contexte et l'historique)
    let userId: string | undefined;
    try {
      const supabase = createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      /* invité */
    }

    const { reply, provider } = await chat(messages, userId);

    if (userId) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      if (lastUser) await saveChatHistory(userId, lastUser.content, reply);
    }

    return NextResponse.json({ ok: true, data: { reply, provider } });
  } catch (e) {
    console.error("[api/chat]", e);
    return NextResponse.json(
      { ok: false, error: "L'assistant est momentanément indisponible." },
      { status: 500 }
    );
  }
}
