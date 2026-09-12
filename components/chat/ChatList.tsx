"use client";

/**
 * Liste des discussions privées (MODULE 7) — /messages.
 * Actualisation automatique toutes les 20 s.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatThreadSummary } from "@/lib/types";

function timeShort(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function ChatList() {
  const [conversations, setConversations] = useState<ChatThreadSummary[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/prono-chat/conversations");
      if (res.ok) {
        const json = await res.json();
        setConversations(json.conversations ?? []);
      } else {
        setConversations([]);
      }
    } catch {
      /* réseau : on garde la liste actuelle */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 20_000);
    return () => clearInterval(t);
  }, [load]);

  if (conversations === null) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
        Aucune discussion pour l'instant 💬<br />
        Va sur les <Link href="/prono-annonces" className="text-primary hover:underline">annonces</Link> ou le{" "}
        <Link href="/prono-voyage" className="text-primary hover:underline">covoiturage</Link> et clique sur
        Discuter avec un membre.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/messages/${c.id}`}
          className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all hover:border-primary/40 hover:bg-secondary/30 ${
            c.unread > 0 ? "border-primary/30 bg-primary/5" : "border-white/10 bg-card/60"
          }`}
        >
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={c.other_avatar ?? undefined} alt="" />
            <AvatarFallback>{(c.other_username ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold">{c.other_username ?? "Membre PRONO"}</p>
              {c.contact_revealed && <span title="Coordonnées révélées">🔓</span>}
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                {timeShort(c.last_message_at)}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {c.context_type === "annonce" ? "📢" : "🚗"} {c.context_title}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {c.last_message ?? "Nouvelle discussion, écris le premier message !"}
            </p>
          </div>
          {c.unread > 0 && (
            <Badge className="h-5 min-w-5 shrink-0 rounded-full px-1.5">
              {c.unread}
            </Badge>
          )}
        </Link>
      ))}
    </div>
  );
}
