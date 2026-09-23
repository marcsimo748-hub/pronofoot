"use client";

/**
 * AiAssistantWidget — chat flottant en bas à droite.
 * Réponses via /api/chat (GROQ → Gemini → local), historique Supabase
 * pour les utilisateurs connectés.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, SendHorizonal, Trash2, Sparkles } from "lucide-react";
import { useAiStore } from "@/lib/store/aiStore";
import { useUiStore } from "@/lib/store/uiStore";
import { ChatMessage, TypingIndicator } from "./ChatMessage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ChatMsg } from "@/lib/types";

const SUGGESTIONS = [
  "Quels sont les prochains matchs ?",
  "Comment gagner des points ?",
  "Où voir les scores en direct ?",
  "Comment marche la musique ?",
];

export function AiAssistantWidget() {
  const { isOpen, toggle, open, close } = useAiStore();
  const isTyping = useAiStore((s) => s.isTyping);
  const setTyping = useAiStore((s) => s.setTyping);
  const messages = useAiStore((s) => s.messages);
  const addMessage = useAiStore((s) => s.addMessage);
  const setMessages = useAiStore((s) => s.setMessages);
  const clear = useAiStore((s) => s.clear);
  const setProvider = useAiStore((s) => s.setProvider);
  const provider = useAiStore((s) => s.provider);

  const [input, setInput] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charge l'historique Supabase à la première ouverture (utilisateurs connectés)
  useEffect(() => {
    if (!isOpen || historyLoaded) return;
    setHistoryLoaded(true);
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("chat_history")
          .select("role, content")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12);
        if (data && data.length) {
          setMessages([...data.reverse() as ChatMsg[]]);
        }
      } catch {
        /* silencieux */
      }
    })();
  }, [isOpen, historyLoaded, setMessages]);

  // Scroll automatique vers le bas
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;

    const userMsg: ChatMsg = { role: "user", content };
    addMessage(userMsg);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].slice(-10) }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { reply: string; provider: string }; error?: string };
      if (json.ok && json.data) {
        addMessage({ role: "assistant", content: json.data.reply });
        setProvider(json.data.provider);
      } else {
        addMessage({ role: "assistant", content: "Oups, petit souci technique 😅 Réessaie dans un instant." });
      }
    } catch {
      addMessage({ role: "assistant", content: "Impossible de contacter l'assistant pour le moment 😕" });
    } finally {
      setTyping(false);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        id="ai-assistant-widget"
        onClick={toggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-20 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow md:bottom-6"
        aria-label="Assistant IA"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
              <Bot className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse-dot rounded-full border-2 border-background bg-emerald-400" />
        )}
      </motion.button>

      {/* Panneau de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="fixed bottom-36 right-4 z-50 flex h-[480px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-popover/95 shadow-2xl backdrop-blur-xl md:bottom-24"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-white/5 bg-secondary/50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold">Assistant PRONOFOOT</p>
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {provider ? `Propulsé par ${provider === "groq" ? "Groq Llama 3.1 70B" : provider === "gemini" ? "Gemini" : "mode local"}` : "En ligne · Groq / Gemini"}
                  </p>
                </div>
              </div>
              <button
                onClick={clear}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Effacer la conversation"
                title="Effacer la conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <ChatMessage key={i} message={m} />
              ))}
              {isTyping && <TypingIndicator />}
            </div>

            {/* Suggestions (uniquement au début) */}
            {messages.length <= 1 && !isTyping && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Saisie */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex items-center gap-2 border-t border-white/5 bg-secondary/30 p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pose ta question…"
                className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all",
                  input.trim() && !isTyping
                    ? "bg-primary text-primary-foreground shadow-glow-sm"
                    : "bg-secondary text-muted-foreground"
                )}
                aria-label="Envoyer"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
