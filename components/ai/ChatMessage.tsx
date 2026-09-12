"use client";

/**
 * Un message de la conversation avec l'assistant IA.
 */

import { motion } from "framer-motion";
import { Bot, User2, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMsg } from "@/lib/types";

/** Exporte le texte d'une réponse en PDF (jsPDF via CDN, gratuit, local au navigateur) */
async function exportToPdf(content: string) {
  const w = window as unknown as { jspdf?: { jsPDF: new (o: object) => { splitTextToSize: (t: string, w: number) => string[]; text: (t: string, x: number, y: number) => void; addPage: () => void; save: (f: string) => void; setFontSize: (s: number) => void } } };
  if (!w.jspdf) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("cdn"));
      document.head.appendChild(script);
    });
  }
  const lib = (window as unknown as { jspdf: { jsPDF: new (o: object) => { splitTextToSize: (t: string, w: number) => string[]; text: (t: string, x: number, y: number) => void; addPage: () => void; save: (f: string) => void; setFontSize: (s: number) => void } } }).jspdf;
  const doc = new lib.jsPDF({ unit: "mm", format: "a4" });
  doc.setFontSize(11);
  // Nettoyage : on retire les balises d'images markdown et le gras
  const clean = content.replace(/!\[[^\]]*\]\([^)]*\)/g, "[image]").replace(/\*\*/g, "");
  const lines = doc.splitTextToSize(clean, 180);
  let y = 20;
  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 15, y);
    y += 5.5;
  }
  doc.save("reponse-assistant-prono.pdf");
}

/** Découpe le texte en segments texte / image markdown ![alt](url) */
function splitImages(content: string): { text?: string; image?: { alt: string; url: string } }[] {
  const out: { text?: string; image?: { alt: string; url: string } }[] = [];
  const re = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    if (m.index > last) out.push({ text: content.slice(last, m.index) });
    out.push({ image: { alt: m[1], url: m[2] } });
    last = m.index + m[0].length;
  }
  if (last < content.length) out.push({ text: content.slice(last) });
  return out;
}

export function ChatMessage({ message }: { message: ChatMsg }) {
  const isUser = message.role === "user";
  const parts = splitImages(message.content);

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
        {parts.map((part, i) =>
          part.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={part.image.url}
              alt={part.image.alt}
              className="my-1.5 max-h-64 w-full rounded-lg border border-white/10 object-contain"
              loading="lazy"
            />
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </div>

      {/* Export PDF (réponses de l'assistant, gratuit et local) */}
      {!isUser && message.content.length > 200 && (
        <button
          type="button"
          onClick={() => void exportToPdf(message.content)}
          className="mt-1 flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-secondary/40 px-1.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          title="Télécharger cette réponse en PDF"
        >
          <FileDown className="h-3 w-3" /> PDF
        </button>
      )}
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
