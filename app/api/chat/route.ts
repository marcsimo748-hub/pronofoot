import { NextResponse } from "next/server";
import { chatStream, saveChatHistory, analyzeImage, extractMemories, saveMemories } from "@/lib/services/ai.service";
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

    const body = (await req.json()) as { messages?: ChatMsg[]; image?: string };
    const messages = (body.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-10);

    if (!messages.length && !body.image) {
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

    // IMAGE JOINTE → analyse vision (réponse en une fois)
    if (body.image && body.image.startsWith("data:")) {
      let reply = "";
      try {
        reply = await analyzeImage(lastUser || "Décris cette image.", body.image);
      } catch {
        reply = "Impossible d'analyser cette image pour le moment 😕";
      }
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(reply));
          controller.close();
          if (userId) void saveChatHistory(userId, "[image jointe]", reply);
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Provider": "gemini",
        },
      });
    }

    // Le premier événement du générateur porte TOUJOURS le provider :
    // on le lit AVANT de construire la réponse pour un en-tête exact.
    const gen = chatStream(messages, userId);
    const first = await gen.next();
    let provider = "local";
    let firstChunk = "";
    if (!first.done) {
      if (first.value.provider) provider = first.value.provider;
      if (first.value.chunk) firstChunk = first.value.chunk;
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let full = "";
        let sent = 0;
        // Le tag [MEMOIRE] n'est JAMAIS envoyé au navigateur :
        // on n'expédie que la partie visible de la réponse.
        const pushVisible = () => {
          const visible = full.split("[MEMOIRE")[0];
          if (visible.length > sent) {
            controller.enqueue(encoder.encode(visible.slice(sent)));
            sent = visible.length;
          }
        };
        try {
          if (firstChunk) {
            full += firstChunk;
            pushVisible();
          }
          for await (const ev of gen) {
            if (ev.chunk) {
              full += ev.chunk;
              pushVisible();
            }
          }
        } catch (e) {
          console.error("[api/chat]", e);
          if (!full) {
            full = "Oups, petit souci technique 😅 Réessaie dans un instant.";
            pushVisible();
          }
        }
        controller.close();
        if (userId && full) {
          const { cleaned, memories } = extractMemories(full);
          if (memories.length) await saveMemories(userId, memories);
          await saveChatHistory(userId, lastUser, cleaned || full);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Provider": provider, // groq | gemini | web | image | local
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
