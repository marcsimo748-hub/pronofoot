import { NextResponse } from "next/server";
import { chatStream, saveChatHistory } from "@/lib/services/ai.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { ChatMsg } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/chat — Assistant IA du site (STREAMING).
 * Réponse : flux texte brut (chunks), en-tête X-Provider = groq|gemini|local.
 * Historique sauvegardé dans `chat_history` pour les utilisateurs connectés.
 */
export async function POST(req: Request) {
  try {
    // Quota anti-abus : 20 messages / minute / IP
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      /* invité */
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const encoder = new TextEncoder();
    let provider = "local";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let full = "";
        try {
          for await (const ev of chatStream(messages, userId)) {
            if (ev.provider) provider = ev.provider;
            if (ev.chunk) {
              full += ev.chunk;
              controller.enqueue(encoder.encode(ev.chunk));
            }
          }
        } catch (e) {
          console.error("[api/chat]", e);
          if (!full) {
            const msg = "Oups, petit souci technique 😅 Réessaie dans un instant.";
            full = msg;
            controller.enqueue(encoder.encode(msg));
          }
        }
        controller.close();
        if (userId && full) await saveChatHistory(userId, lastUser, full);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Provider": provider === "groq" ? "groq" : provider === "gemini" ? "gemini" : "local",
      },
    });
  } catch (e) {
    console.error("[api/chat]", e);
    return NextResponse.json(
      { ok: false, error: "L'assistant est momentanément indisponible." },
      { status: 500 }
    );
  }
}
