"use client";

/**
 * Un message de la conversation avec l'assistant IA.
 */

import { motion } from "framer-motion";
import { Bot, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMsg } from "@/lib/types";

export function ChatMessage({ message }: { message: ChatMsg }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start gap-2.5", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full",
          isUser ? "bg-secondary text-foreground" : "bg-primary/20 text-primary shadow-glow-sm"
        )}
      >
        {isUser ? <User2 className="h-3.5 w-3.5" /> : <Bot className="h-4 w-4" />}
      </span>

      {/* Bulle */}
      <div
        className={cn(
          "max-w-[82%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-secondary text-foreground"
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

/** Indicateur "l'assistant écrit…" */
export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
        <Bot className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-secondary px-3 py-2.5">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
