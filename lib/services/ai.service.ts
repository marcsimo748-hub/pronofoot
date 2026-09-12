/**
 * Service IA — Assistant du site.
 * Chaîne d'appels : GROQ (llama-3.1-70b) → Gemini (fallback) → réponses locales.
 * L'historique est stocké dans `chat_history` (lié au user_id).
 */

import type { ChatMsg } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeQuery } from "@/lib/utils";

const SYSTEM_PROMPT =
  "Tu es l'assistant de Pronofoot (développé par Leprince Matt pour MalihaprodBerlin), tu aides les utilisateurs à naviguer, trouver les scores, les news, la musique. " +
  "Réponds en français, de façon courte, amicale et utile. Pronofoot est une plateforme de pronostics football " +
  "(Ligue des Champions, Premier League, LaLiga, Serie A, Ligue 1, Bundesliga) avec scores live, actualités, " +
  "musique et classements entre joueurs. Barème : score exact = 5 points, bon résultat = 3 points, bonus de saison jusqu'à 75 points.";

/** Construit le contexte temps réel (matchs, résultats, points du joueur) injecté au prompt système */
export async function buildContext(userId?: string): Promise<string> {
  return safeQuery(
    async () => {
      const supabase = createSupabaseServerClient();
      const parts: string[] = [];

      const { data: upcoming } = await supabase
        .from("matches")
        .select("league, match_date, home_team, away_team")
        .eq("status", "scheduled")
        .gte("match_date", new Date().toISOString())
        .order("match_date")
        .limit(8);
      if (upcoming?.length) {
        parts.push(
          "Prochains matchs à pronostiquer :\n" +
            upcoming
              .map((m) => `- ${m.home_team} - ${m.away_team} (${m.league}, ${new Date(m.match_date).toLocaleString("fr-FR")})`)
              .join("\n")
        );
      }

      const { data: results } = await supabase
        .from("matches")
        .select("home_team, away_team, home_score, away_score, league")
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .limit(5);
      if (results?.length) {
        parts.push(
          "Derniers résultats :\n" +
            results.map((m) => `- ${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team} (${m.league})`).join("\n")
        );
      }

      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, total_points")
          .eq("id", userId)
          .single();
        if (profile) {
          parts.push(`L'utilisateur connecté est ${profile.username} avec ${profile.total_points} points.`);
        }
      }

      return parts.length ? "Contexte temps réel du site :\n" + parts.join("\n\n") : "";
    },
    ""
  );
}

// ---------------------------------------------------------------
// Provider 1 : GROQ
// ---------------------------------------------------------------
async function callGroq(messages: ChatMsg[], system: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no_key");
  const model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages.slice(-10)],
      temperature: 0.6,
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const reply = json.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("empty");
  return reply;
}

// ---------------------------------------------------------------
// Provider 2 : Gemini
// ---------------------------------------------------------------
async function callGemini(messages: ChatMsg[], system: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no_key");
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.slice(-10).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 500, temperature: 0.6 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const reply = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
  if (!reply) throw new Error("empty");
  return reply;
}

// ---------------------------------------------------------------
// Provider 3 : réponses locales (aucune clé requise — jamais muet)
// ---------------------------------------------------------------
function localFallback(message: string, context: string): string {
  const q = message.toLowerCase();
  const nextMatchLine = context.split("\n").find((l) => l.startsWith("- "));

  if (/point|barème|bareme|score exact|gagner/.test(q)) {
    return (
      "📊 Le barème des points :\n" +
      "• Score exact → 5 points\n" +
      "• Bon vainqueur (ou bon nul) → 3 points\n" +
      "• Bonus de saison : champion = 50 pts, coupe nationale = 30 pts, vainqueur LDC = 75 pts, finaliste LDC = 30 pts, meilleur buteur = 25 pts.\n" +
      "Tout est calculé automatiquement dès que le résultat du match est connu !"
    );
  }
  if (/prochain|match|matchs|pronostic|parier/.test(q)) {
    return nextMatchLine
      ? `⚽ Les prochains matchs à pronostiquer commencent par : ${nextMatchLine.slice(2)}.\nRendez-vous sur la page « Pronos » pour saisir tes scores !`
      : "⚽ Va sur la page « Pronos » pour voir tous les matchs à pronostiquer (Ligue des Champions, Premier League, LaLiga, Serie A, Ligue 1 et Bundesliga).";
  }
  if (/score|live|direct|résultat/.test(q)) {
    return "🔴 Les scores en direct sont sur la page « Scores », mis à jour toutes les 90 secondes. Tu peux aussi voir le bandeau défilant en haut du site.";
  }
  if (/news|actu|actualité|information/.test(q)) {
    return "📰 Les actualités du monde défilent en haut du site et la page « News » contient tous les derniers articles, rafraîchis toutes les 10 minutes.";
  }
  if (/musique|son|mp3|playlist/.test(q)) {
    return "🎵 La musique se lance depuis la page « Musique » : choisis un titre, et le lecteur continue de jouer pendant que tu navigues partout sur le site !";
  }
  if (/classement|rank|top|ami|groupe/.test(q)) {
    return "🏆 Les classements sont sur la page « Classement » : général, par championnat, mensuel et entre amis (groupes privés).";
  }
  if (/compte|inscription|mot de passe|connexion/.test(q)) {
    return "🔐 Crée ton compte gratuitement (email + mot de passe), puis pronostique ! Si tu perds ton mot de passe, utilise « Mot de passe oublié » sur la page de connexion.";
  }
  if (/bonjour|salut|hello|hey|coucou/.test(q)) {
    return "Salut ! 👋 Je peux t'aider avec les pronostics, les scores live, les news, la musique ou les classements. Que veux-tu savoir ?";
  }
  return (
    "Je suis là pour t'aider ! 🤖 Essaie de me demander :\n" +
    "• « Quels sont les prochains matchs ? »\n" +
    "• « Comment gagner des points ? »\n" +
    "• « Où voir les scores en direct ? »\n" +
    "• « Comment marche la musique ? »"
  );
}

// ---------------------------------------------------------------
// Point d'entrée principal
// ---------------------------------------------------------------
export async function chat(
  messages: ChatMsg[],
  userId?: string
): Promise<{ reply: string; provider: string }> {
  const context = await buildContext(userId);
  const system = SYSTEM_PROMPT + (context ? `\n\n${context}` : "");
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // GROQ → Gemini → local
  try {
    const reply = await callGroq(messages, system);
    return { reply, provider: "groq" };
  } catch (e) {
    if ((e as Error).message !== "no_key") console.warn("[ai.service] Groq KO :", (e as Error).message);
  }
  try {
    const reply = await callGemini(messages, system);
    return { reply, provider: "gemini" };
  } catch (e) {
    if ((e as Error).message !== "no_key") console.warn("[ai.service] Gemini KO :", (e as Error).message);
  }
  return { reply: localFallback(lastUser, context), provider: "local" };
}

/** Sauvegarde l'historique (user + réponse) pour les connectés */
export async function saveChatHistory(userId: string, userMsg: string, assistantMsg: string) {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.from("chat_history").insert([
      { user_id: userId, role: "user", content: userMsg },
      { user_id: userId, role: "assistant", content: assistantMsg },
    ]);
  } catch {
    // non bloquant
  }
}

/** Charge l'historique d'un utilisateur */
export async function getChatHistory(userId: string, limit = 20): Promise<ChatMsg[]> {
  return safeQuery(async () => {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("chat_history")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as ChatMsg[]).reverse();
  }, []);
}
