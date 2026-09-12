/**
 * Service MESSAGERIE INTERNE (MODULE 7).
 * Chat privé lié aux comptes et aux annonces / trajets.
 * ⚠️ Protection des coordonnées : téléphone et email ne sont jamais
 * exposés publiquement. Le propriétaire les révèle dans le chat,
 * uniquement s'il est d'accord (table contacts + RLS).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ChatContextType,
  ChatThread,
  ChatThreadSummary,
  PronoConversation,
  PronoMessage,
} from "@/lib/types";

const CONTEXTS: ChatContextType[] = ["annonce", "trajet"];

/** Crée la conversation (ou renvoie l'existante) pour une annonce / un trajet */
export async function createOrGetConversation(
  userId: string,
  contextType: string,
  contextId: string
): Promise<{ ok: boolean; code?: string; conversationId?: string }> {
  if (!CONTEXTS.includes(contextType as ChatContextType)) {
    return { ok: false, code: "contexte_invalide" };
  }
  try {
    const supabase = createSupabaseServerClient();

    // Le propriétaire de l'annonce / trajet (lecture publique par id)
    let ownerId: string | null = null;
    if (contextType === "annonce") {
      const { data } = await supabase.from("prono_annonces").select("id, user_id").eq("id", contextId).maybeSingle();
      ownerId = data?.user_id ?? null;
    } else {
      const { data } = await supabase.from("prono_voyage_trips").select("id, user_id").eq("id", contextId).maybeSingle();
      ownerId = data?.user_id ?? null;
    }
    if (!ownerId) return { ok: false, code: "introuvable" };
    if (ownerId === userId) return { ok: false, code: "annonce_a_soi" };

    // Conversation existante ?
    const { data: existing } = await supabase
      .from("prono_conversations")
      .select("id")
      .eq("context_type", contextType)
      .eq("context_id", contextId)
      .eq("requester", userId)
      .maybeSingle();
    if (existing) return { ok: true, conversationId: existing.id };

    const { data: created, error } = await supabase
      .from("prono_conversations")
      .insert({ context_type: contextType, context_id: contextId, listing_owner: ownerId, requester: userId })
      .select("id")
      .single();
    if (error) {
      if (error.message.includes("exist")) return { ok: false, code: "no_table" };
      if (error.code === "23505") {
        // Créée entre-temps : on la récupère
        const { data: again } = await supabase
          .from("prono_conversations")
          .select("id")
          .eq("context_type", contextType)
          .eq("context_id", contextId)
          .eq("requester", userId)
          .maybeSingle();
        if (again) return { ok: true, conversationId: again.id };
      }
      return { ok: false, code: "db_error" };
    }
    return { ok: true, conversationId: created.id };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/** Titre lisible du contexte (annonce ou trajet) */
async function contextTitle(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  type: ChatContextType,
  id: string
): Promise<string> {
  try {
    if (type === "annonce") {
      const { data } = await supabase.from("prono_annonces").select("title").eq("id", id).maybeSingle();
      return data?.title ?? "Annonce";
    }
    const { data } = await supabase
      .from("prono_voyage_trips")
      .select("origin_city, dest_city")
      .eq("id", id)
      .maybeSingle();
    if (!data) return "Trajet";
    return `${data.origin_city} → ${data.dest_city}`;
  } catch {
    return type === "annonce" ? "Annonce" : "Trajet";
  }
}

/** Mes conversations (les deux rôles) avec dernier message et non-lus */
export async function myConversations(userId: string): Promise<ChatThreadSummary[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: convs } = await supabase
      .from("prono_conversations")
      .select("*")
      .or(`requester.eq.${userId},listing_owner.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (!convs || convs.length === 0) return [];

    const summaries: ChatThreadSummary[] = [];
    for (const c of convs as PronoConversation[]) {
      const amOwner = c.listing_owner === userId;
      const otherId = amOwner ? c.requester : c.listing_owner;

      // Dernier message
      const { data: lastMsg } = await supabase
        .from("prono_messages")
        .select("body, sender_id, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Non-lus : messages de l'autre après ma dernière lecture
      const myLastRead = amOwner ? c.last_read_owner : c.last_read_requester;
      let unread = 0;
      if (lastMsg && lastMsg.sender_id === otherId && new Date(lastMsg.created_at) > new Date(myLastRead)) {
        unread = 1;
      }

      // Profil de l'autre partie
      const { data: other } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", otherId)
        .maybeSingle();

      summaries.push({
        id: c.id,
        context_type: c.context_type,
        context_id: c.context_id,
        context_title: await contextTitle(supabase, c.context_type, c.context_id),
        other_username: other?.username ?? null,
        other_avatar: other?.avatar_url ?? null,
        last_message: lastMsg?.body ?? null,
        last_message_at: lastMsg?.created_at ?? null,
        unread,
        contact_revealed: c.contact_revealed,
        am_owner: amOwner,
      });
    }
    return summaries;
  } catch {
    return [];
  }
}

/** Fil complet (messages, autre partie, contact révélé si autorisé) */
export async function getThread(
  userId: string,
  conversationId: string
): Promise<ChatThread | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: c } = await supabase
      .from("prono_conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();
    if (!c) return null;
    const conv = c as PronoConversation;
    const amOwner = conv.listing_owner === userId;
    const otherId = amOwner ? conv.requester : conv.listing_owner;

    const { data: messages } = await supabase
      .from("prono_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(300);

    const { data: other } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", otherId)
      .maybeSingle();

    // Coordonnées : la RLS ne renvoie la ligne QUE si contact révélé
    // (ou propriétaire / admin). Aucune fuite possible côté serveur.
    let contact: { preference: string; value: string } | null = null;
    const contactTable = conv.context_type === "annonce" ? "prono_annonces_contacts" : "prono_voyage_trips_contacts";
    const contactIdCol = conv.context_type === "annonce" ? "annonce_id" : "trip_id";
    const { data: contactRow } = await supabase
      .from(contactTable)
      .select("contact_preference, contact_value")
      .eq(contactIdCol, conv.context_id)
      .maybeSingle();
    if (contactRow) {
      contact = { preference: contactRow.contact_preference, value: contactRow.contact_value };
    }

    // Marque ma lecture
    const now = new Date().toISOString();
    await supabase
      .from("prono_conversations")
      .update(amOwner ? { last_read_owner: now } : { last_read_requester: now })
      .eq("id", conversationId);

    return {
      conversation: conv,
      messages: (messages ?? []) as PronoMessage[],
      am_owner: amOwner,
      other_username: other?.username ?? null,
      other_avatar: other?.avatar_url ?? null,
      context_title: await contextTitle(supabase, conv.context_type, conv.context_id),
      contact,
    };
  } catch {
    return null;
  }
}

/** Envoie un message */
export async function sendMessage(
  userId: string,
  conversationId: string,
  body: string
): Promise<{ ok: boolean; code?: string }> {
  const clean = body.trim().slice(0, 2000);
  if (!clean) return { ok: false, code: "message_vide" };
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("prono_messages")
      .insert({ conversation_id: conversationId, sender_id: userId, body: clean });
    if (error) {
      if (error.message.includes("exist")) return { ok: false, code: "no_table" };
      return { ok: false, code: "interdit" };
    }
    await supabase
      .from("prono_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    return { ok: true };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/** Le propriétaire accepte de révéler ses coordonnées dans le chat */
export async function acceptContact(
  userId: string,
  conversationId: string
): Promise<{ ok: boolean; code?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: c } = await supabase
      .from("prono_conversations")
      .select("listing_owner")
      .eq("id", conversationId)
      .maybeSingle();
    if (!c) return { ok: false, code: "introuvable" };
    if (c.listing_owner !== userId) return { ok: false, code: "seul_proprietaire" };

    const { error } = await supabase
      .from("prono_conversations")
      .update({ contact_revealed: true, updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    if (error) return { ok: false, code: "db_error" };
    return { ok: true };
  } catch {
    return { ok: false, code: "exception" };
  }
}
