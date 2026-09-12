/**
 * Service IA — Assistant du site (Mission 11 : Intelligence).
 * Chaîne : GROQ (Llama 3.3 70B, streaming) → Gemini → réponses locales.
 *
 * Clés API : variable d'environnement OU table privée prono_secrets
 * (renseignée par l'admin via Admin > 🤖 Assistant IA, migration 012).
 * Réponses en STREAMING pour un effet instantané.
 */

import type { ChatMsg } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { safeQuery } from "@/lib/utils";

/** Modèle Groq par défaut (surchargeable via la variable GROQ_MODEL) */
const GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Tu es l'assistant intelligent de PRONO (développé par Leprince Matt pour MalihaprodBerlin), la Super-App de la diaspora africaine.

TON RÔLE : tu es un VRAI assistant conversationnel, comme ChatGPT ou Claude. Tu réponds à TOUT type de question : football, sport, actualité générale, culture, histoire, maths, traduction, conseils, vie quotidienne, technologie... ET en expert tu connais parfaitement le site PRONO.

RÈGLES :
- Réponds dans la langue de l'utilisateur (français par défaut, mais aussi anglais ou allemand si on t'écrit dans ces langues).
- Réponses précises et VRAIES. Si tu n'es pas sûr d'un fait, dis-le honnêtement plutôt que d'inventer.
- Style : amical, direct, concis (2 à 6 phrases en général). Emojis avec modération.
- Pour les questions sur le site, appuie-toi sur TA CONNAISSANCE DU SITE ci-dessous et le contexte temps réel fourni.

TA CONNAISSANCE DU SITE PRONO :
- PRONOSTICS FOOT (/pronos) : 6 championnats (Ligue des Champions, Premier League, LaLiga, Serie A, Ligue 1, Bundesliga) avec les 19 équipes vedettes dont le Bayern, Real Madrid, Barcelone, PSG, Manchester City, Liverpool, Dortmund. Barème : score exact = 5 points, bon vainqueur ou bon nul = 3 points. Les pronos se verrouillent au coup d'envoi. Bonus de saison : champion = 50 pts, coupe nationale = 30 pts, vainqueur LDC = 75 pts, finaliste LDC = 30 pts, meilleur buteur = 25 pts (jusqu'à 75 points de bonus).
- PRONOS DÉVOILÉS : dès qu'un match a commencé, tout le monde voit les pronostics de tous les joueurs (onglet 🔴 En direct de la page Pronos). L'admin peut les voir avant.
- SCORES LIVE (/scores) : scores en direct mis à jour toutes les 90 secondes + bandeau défilant en haut du site.
- CLASSEMENTS (/classement) : général, par championnat, mensuel, et groupes privés entre amis (code d'invitation).
- NEWS (/news) : actualités rafraîchies toutes les 10 minutes.
- MUSIQUE (/music) : playlists, le lecteur continue pendant la navigation.
- EMPLOI (/prono-job) : offres d'emploi en Allemagne pour la diaspora, candidatures internes.
- PROFIL (/prono-profil) : profil public personnalisable.
- VISA (/prono-visa) : guides et infos pour les démarches de visa.
- LOGEMENT (/prono-housing) : annonces de logement.
- ANNONCES (/prono-annonces) : petites annonces de la communauté style Leboncoin, avec photos.
- Covoiturage (/prono-voyage) : billets d'avion et de train (liens officiels Kayak, Google Flights, Trainline, FlixBus) + covoiturage communautaire.
- MESSAGERIE PRIVÉE (/messages) : chat interne lié aux comptes. On discute d'abord sur le site, les coordonnées (numéro/email) ne sont révélées QUE si le propriétaire de l'annonce accepte. Badge ✓ vert = email vérifié.
- NOTIFICATIONS : cloche 🔔 dans le header (nouveaux messages, discussions, coordonnées partagées).
- APPLICATION MOBILE : le site est une PWA installable gratuitement. Android : menu Chrome puis Ajouter à l'écran d'accueil. iPhone : bouton Partager dans Safari puis Sur l'écran d'accueil.
- COMPTE : inscription gratuite avec email + mot de passe, mot de passe oublié récupérable. 100% gratuit.
- IA : c'est toi ! L'admin peut brancher les clés Groq ou Gemini dans Admin > 🤖 Assistant IA.`;

/** Construit le contexte temps réel (matchs, résultats, classement, joueur) */
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
        .limit(10);
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
        .select("home_team, away_team, home_score, away_score, league, match_date")
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .limit(6);
      if (results?.length) {
        parts.push(
          "Derniers résultats :\n" +
            results.map((m) => `- ${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team} (${m.league})`).join("\n")
        );
      }

      const { data: top } = await supabase
        .from("profiles")
        .select("username, total_points")
        .order("total_points", { ascending: false })
        .order("username")
        .limit(5);
      if (top?.length) {
        parts.push("Top 5 du classement général : " + top.map((p, i) => `${i + 1}. ${p.username} (${p.total_points} pts)`).join(", "));
      }

      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, total_points")
          .eq("id", userId)
          .single();
        if (profile) {
          const { count: rank } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .gt("total_points", profile.total_points);
          parts.push(
            `L'utilisateur connecté est ${profile.username} avec ${profile.total_points} points (rang approx. ${rank !== null ? rank + 1 : "?"}).`
          );
        }
      }

      const now = new Date();
      const today = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const heure = now.toLocaleTimeString("fr-FR", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
      parts.push(`Date et heure actuelles : ${today}, il est ${heure} (heure de Berlin, UTC+2 en été).`);

      return parts.length ? "Contexte temps réel du site (données actuelles) :\n" + parts.join("\n\n") : "";
    },
    ""
  );
}

// ---------------------------------------------------------------
// CLÉS API : env vars OU table privée prono_secrets (admin)
// ---------------------------------------------------------------
const SECRETS_CACHE_TTL = 60_000;
let secretsCache: { groq: string | null; gemini: string | null; at: number } | null = null;

async function loadSecrets(): Promise<{ groq: string | null; gemini: string | null }> {
  if (secretsCache && Date.now() - secretsCache.at < SECRETS_CACHE_TTL) {
    return { groq: secretsCache.groq, gemini: secretsCache.gemini };
  }
  let groq: string | null = process.env.GROQ_API_KEY || null;
  let gemini: string | null = process.env.GEMINI_API_KEY || null;
  try {
    const admin = tryGetSupabaseAdminClient();
    if (admin) {
      const { data } = await admin.from("prono_secrets").select("key, value").in("key", ["groq_api_key", "gemini_api_key"]);
      for (const row of data ?? []) {
        const v = String(row.value ?? "").trim();
        if (!v) continue;
        if (row.key === "groq_api_key") groq = v;
        if (row.key === "gemini_api_key") gemini = v;
      }
    }
  } catch {
    /* table absente (migration 012 non exécutée) : on garde les vars d'env */
  }
  secretsCache = { groq, gemini, at: Date.now() };
  return { groq, gemini };
}

/** Invalide le cache des secrets (après une écriture admin) */
export function invalidateSecretsCache() {
  secretsCache = null;
}

/** Teste la présence des clés (pour l'admin) */
export async function getAiKeyStatus(): Promise<{ groq: boolean; gemini: boolean; env_groq: boolean; env_gemini: boolean }> {
  const envGroq = !!process.env.GROQ_API_KEY;
  const envGemini = !!process.env.GEMINI_API_KEY;
  const { groq, gemini } = await loadSecrets();
  return { groq: !!groq, gemini: !!gemini, env_groq: envGroq, env_gemini: envGemini };
}

// ---------------------------------------------------------------
// Provider 1 : GROQ (streaming)
// ---------------------------------------------------------------
async function* groqStream(messages: ChatMsg[], system: string): AsyncGenerator<string> {
  const { groq: key } = await loadSecrets();
  if (!key) throw new Error("no_key");
  const model = process.env.GROQ_MODEL || GROQ_DEFAULT_MODEL;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages.slice(-10)],
      temperature: 0.6,
      max_tokens: 900,
      stream: true,
      reasoning_effort: "low",
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Groq ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let emitted = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
        const chunk = json.choices?.[0]?.delta?.content;
        if (chunk) {
          emitted = true;
          yield chunk;
        }
      } catch {
        /* ligne partielle ignorée */
      }
    }
  }
  if (!emitted) throw new Error("empty");
}

// ---------------------------------------------------------------
// Provider 2 : Gemini (réponse complète)
// ---------------------------------------------------------------
async function callGemini(messages: ChatMsg[], system: string): Promise<string> {
  const { gemini: key } = await loadSecrets();
  if (!key) throw new Error("no_key");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

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
        generationConfig: { maxOutputTokens: 700, temperature: 0.6 },
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

  // Heure et date (fuseau Berlin, le cœur de la communauté)
  if (/heure|horloge|quelle heure|time|date.*jour|on est quel/.test(q)) {
    const now = new Date();
    const heure = now.toLocaleTimeString("fr-FR", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
    const jour = now.toLocaleDateString("fr-FR", { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return `🕒 Il est ${heure} à Berlin, ${jour}.`;
  }

  if (/point|barème|bareme|score exact|gagner/.test(q)) {
    return (
      "📊 Le barème des points :\n" +
      "• Score exact → 5 points\n" +
      "• Bon vainqueur (ou bon nul) → 3 points\n" +
      "• Bonus de saison : champion = 50 pts, coupe nationale = 30 pts, vainqueur LDC = 75 pts, finaliste LDC = 30 pts, meilleur buteur = 25 pts.\n" +
      "Tout est calculé automatiquement dès que le résultat du match est connu !"
    );
  }
  if (/prochain|match|matchs|pronostic|parier|prono/.test(q)) {
    return nextMatchLine
      ? `⚽ Le prochain match : ${nextMatchLine.slice(2)}. Page « Pronos » pour jouer !`
      : "⚽ Tous les matchs à pronostiquer sont sur la page « Pronos ».";
  }
  if (/score|live|direct|résultat/.test(q)) {
    return "🔴 Scores en direct sur la page « Scores » (maj toutes les 90 s) + bandeau défilant en haut du site.";
  }
  if (/news|actu|actualité|information/.test(q)) {
    return "📰 Actus rafraîchies toutes les 10 min : bandeau en haut + page « News ».";
  }
  if (/musique|son|mp3|playlist/.test(q)) {
    return "🎵 Choisis un titre sur la page « Musique » : il continue pendant toute ta navigation !";
  }
  if (/classement|rank|top|ami|groupe/.test(q)) {
    return "🏆 Classement général, par championnat, mensuel et groupes privés : page « Classement ».";
  }
  if (/annonce|leboncoin|vendre|acheter/.test(q)) {
    return "📢 Petites annonces de la communauté sur la page « Annonces ». Discussion via le chat privé, coordonnées révélées uniquement si l'auteur accepte 🔒";
  }
  if (/covoiturage|trajet|voyage|billet|avion|train/.test(q)) {
    return "✈️ Billets avion/train (Kayak, Trainline, FlixBus...) + covoiturage communautaire : page « Voyage ».";
  }
  if (/emploi|job|travail|jobbing/.test(q)) {
    return "💼 Offres d'emploi en Allemagne : page « Emploi », candidature directe depuis le site.";
  }
  if (/app|installer|téléphone|mobile|écran d'accueil/.test(q)) {
    return "📱 Installe PRONO : Android → menu Chrome → Ajouter à l'écran d'accueil. iPhone → Partager → Sur l'écran d'accueil.";
  }
  if (/compte|inscription|mot de passe|connexion/.test(q)) {
    return "🔐 Inscription gratuite (email + mot de passe). Mot de passe perdu ? « Mot de passe oublié » sur la page de connexion.";
  }
  if (/bonjour|salut|hello|hey|coucou/.test(q)) {
    return "Salut ! 👋 Pronos, scores, annonces, emploi, voyage... pose ta question !";
  }
  return "Je suis en mode simplifié 🤖 Pose-moi une question sur le site (pronos, scores, classement, annonces, emploi, voyage, musique...) !";
}

// ---------------------------------------------------------------
// Point d'entrée principal : STREAMING
// ---------------------------------------------------------------
export async function* chatStream(
  messages: ChatMsg[],
  userId?: string
): AsyncGenerator<{ chunk?: string; provider?: string }> {
  const context = await buildContext(userId);
  const system = SYSTEM_PROMPT + (context ? `\n\n${context}` : "");
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // GROQ en streaming
  try {
    let started = false;
    for await (const chunk of groqStream(messages, system)) {
      if (!started) {
        started = true;
        yield { provider: "groq" };
      }
      yield { chunk };
    }
    if (started) return;
  } catch (e) {
    if ((e as Error).message !== "no_key") console.warn("[ai.service] Groq KO :", (e as Error).message);
  }

  // Gemini (réponse complète en une fois)
  try {
    const reply = await callGemini(messages, system);
    yield { provider: "gemini" };
    yield { chunk: reply };
    return;
  } catch (e) {
    if ((e as Error).message !== "no_key") console.warn("[ai.service] Gemini KO :", (e as Error).message);
  }

  // Local
  yield { provider: "local" };
  yield { chunk: localFallback(lastUser, context) };
}

/** Diagnostic détaillé (admin) : présence des clés + appel réel à Groq */
export async function diagnoseAi(): Promise<{
  groq_key: boolean;
  gemini_key: boolean;
  groq_model: string;
  groq_error: string | null;
}> {
  const { groq, gemini } = await loadSecrets();
  const model = process.env.GROQ_MODEL || GROQ_DEFAULT_MODEL;
  let groq_error: string | null = null;
  if (groq) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${groq}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Réponds juste : ok" }],
          max_tokens: 60,
          reasoning_effort: "low",
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        groq_error = `HTTP ${res.status} — ${body.slice(0, 220)}`;
      }
    } catch (e) {
      groq_error = `Réseau : ${(e as Error).message}`;
    }
  }
  return { groq_key: !!groq, gemini_key: !!gemini, groq_model: model, groq_error };
}

/** Compat : réponse complète sans streaming (tests admin) */
export async function chat(messages: ChatMsg[], userId?: string): Promise<{ reply: string; provider: string }> {
  let reply = "";
  let provider = "local";
  for await (const ev of chatStream(messages, userId)) {
    if (ev.provider) provider = ev.provider;
    if (ev.chunk) reply += ev.chunk;
  }
  return { reply, provider };
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
