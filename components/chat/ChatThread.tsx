"use client";

/**
 * Fil de discussion privé (MODULE 7) — /messages/[id].
 * Tout se passe sur le site : les coordonnées ne sont visibles qu'après
 * l'accord du propriétaire de l'annonce (bouton 🔓 côté propriétaire).
 * Actualisation automatique toutes les 8 s.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { ChatThread } from "@/lib/types";

function timeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function contactHref(preference: string, value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (preference === "email") return `mailto:${v}`;
  const digits = v.replace(/[^\d]/g, "");
  const intl = v.startsWith("+") ? digits : digits.startsWith("0") ? `49${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

export function ChatThread({ initial, myId }: { initial: ChatThread; myId: string }) {
  const [thread, setThread] = useState<ChatThread>(initial);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(initial.messages.length);

  // Actualisation régulière (nouveaux messages, révélation du contact)
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/prono-chat/conversations/${initial.conversation.id}`);
      if (res.ok) setThread(await res.json());
    } catch {
      /* réseau : on garde l'état */
    }
  }, [initial.conversation.id]);

  useEffect(() => {
    const t = setInterval(() => void refresh(), 8_000);
    return () => clearInterval(t);
  }, [refresh]);

  // Défilement automatique quand de nouveaux messages arrivent
  useEffect(() => {
    if (thread.messages.length !== lastCount.current) {
      lastCount.current = thread.messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      bottomRef.current?.scrollIntoView();
    }
  }, [thread.messages.length]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/prono-chat/conversations/${thread.conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setInput("");
        await refresh();
      } else {
        toast.error("Message non envoyé, réessaie.");
      }
    } catch {
      toast.error("Erreur réseau, réessaie.");
    } finally {
      setSending(false);
    }
  };

  const accept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/prono-chat/conversations/${thread.conversation.id}`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Coordonnées révélées 🔓", {
          description: `${thread.other_username ?? "Votre interlocuteur"} peut maintenant te contacter directement.`,
        });
        await refresh();
      } else {
        toast.error("Action impossible.");
      }
    } catch {
      toast.error("Erreur réseau, réessaie.");
    } finally {
      setAccepting(false);
    }
  };

  const other = thread.other_username ?? "Membre PRONO";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {/* En-tête */}
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 p-3">
        <Link href="/messages" className="rounded-md p-1.5 text-muted-foreground hover:text-foreground" aria-label="Retour">
          ←
        </Link>
        <Avatar className="h-10 w-10">
          <AvatarImage src={thread.other_avatar ?? undefined} alt="" />
          <AvatarFallback>{other.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">
            {other}
            {thread.other_email_verified && (
              <span className="ml-1 text-sm font-normal text-emerald-400" title="Email vérifié">✓ Vérifié</span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {thread.conversation.context_type === "annonce" ? "📢" : "🚗"} {thread.context_title}
            {thread.am_owner ? " · tu es le propriétaire" : ""}
          </p>
        </div>
      </div>

      {/* Bandeau protection des coordonnées */}
      {thread.conversation.contact_revealed && thread.contact ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <p className="font-semibold text-emerald-400">
            🔓 Coordonnées partagées
          </p>
          <a
            href={contactHref(thread.contact.preference, thread.contact.value)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 font-semibold text-emerald-300 hover:bg-emerald-500/30"
          >
            {thread.contact.preference === "email" ? "✉️" : "💬"} {thread.contact.value}
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            {thread.am_owner
              ? "Tes coordonnées sont visibles dans cette discussion uniquement."
              : "Tu peux maintenant contacter directement. Partage tes propres coordonnées dans le chat si tu le souhaites."}
          </p>
        </div>
      ) : thread.am_owner ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-primary">🔒 Tes coordonnées restent privées</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {other} te discute via le chat PRONO. Si tu es d'accord, révèle tes coordonnées,
            sinon continuez simplement à discuter ici.
          </p>
          <Button className="mt-3 gap-2" variant="glow" onClick={() => void accept()} disabled={accepting}>
            🔓 Accepter d&apos;échanger mes coordonnées
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-secondary/30 p-4 text-sm text-muted-foreground">
          🔒 Discutez d&apos;abord ici. {other} choisit quand partager ses coordonnées :
          ton numéro et ton email restent protégés tant que personne n&apos;accepte l&apos;échange.
        </div>
      )}

      {/* Messages */}
      <div className="flex max-h-[55vh] min-h-[240px] flex-col gap-2 overflow-y-auto rounded-xl border border-white/10 bg-card/40 p-4">
        {thread.messages.length === 0 && (
          <p className="my-auto text-center text-sm text-muted-foreground">
            Écris le premier message, sois poli et clair 😊
          </p>
        )}
        {thread.messages.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-secondary text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-right text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {timeShort(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      {thread.conversation.status === "active" ? (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Écris ton message…"
            maxLength={2000}
          />
          <Button onClick={() => void send()} disabled={sending || !input.trim()} className="gap-2" variant="glow">
            {sending ? "…" : "Envoyer"}
          </Button>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Cette discussion est fermée.</p>
      )}

      <p className="text-center text-[11px] text-muted-foreground/60">
        🛡️ Évite de taper ton numéro avant d&apos;être sûr de ton interlocuteur. En cas de
        problème, signale l&apos;annonce : 3 signalements = masquage automatique.
      </p>
    </div>
  );
}
