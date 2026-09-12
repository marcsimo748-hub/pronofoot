"use client";

/**
 * AiAssistantWidget — chat flottant en bas à droite.
 * Réponses via /api/chat (GROQ → Gemini → local), historique Supabase
 * pour les utilisateurs connectés.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, SendHorizonal, Trash2, Sparkles, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useAiStore } from "@/lib/store/aiStore";
import { useUiStore } from "@/lib/store/uiStore";
import { ChatMessage, TypingIndicator } from "./ChatMessage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ChatMsg } from "@/lib/types";

type PdfPage = {
  getTextContent: () => Promise<{ items: { str?: string }[] }>;
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
};

type PdfLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (o: { data: ArrayBuffer }) => {
    promise: Promise<{ numPages: number; getPage: (n: number) => Promise<PdfPage> }>;
  };
};

/** Extrait le texte d'un PDF côté navigateur (pdf.js chargé depuis CDN à la demande) */
async function extractPdfText(file: File): Promise<string> {
  const w = window as unknown as { pdfjsLib?: PdfLib };
  if (!w.pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("cdn_indisponible"));
      document.head.appendChild(script);
    });
  }
  const lib = (window as unknown as { pdfjsLib: PdfLib }).pdfjsLib;
  lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const buf = await file.arrayBuffer();
  const doc = await lib.getDocument({ data: buf }).promise;
  let text = "";
  const pages = Math.min(doc.numPages, 20);
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str ?? "").join(" ") + "\n\n";
    if (text.length > 20_000) break;
  }
  return text.slice(0, 20_000);
}

/** Charge Tesseract.js depuis CDN à la demande (OCR gratuit, côté navigateur) */
async function loadTesseract(): Promise<{
  recognize: (img: HTMLCanvasElement | string, lang: string) => Promise<{ data: { text: string } }>;
}> {
  const w = window as unknown as { Tesseract?: unknown };
  if (!w.Tesseract) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("cdn"));
      document.head.appendChild(script);
    });
  }
  return (window as unknown as { Tesseract: { recognize: (i: HTMLCanvasElement | string, l: string) => Promise<{ data: { text: string } }> } }).Tesseract;
}

/** OCR d'un PDF scanné : rendu des 3 premières pages en image puis lecture du texte */
async function ocrPdf(file: File): Promise<string> {
  const w = window as unknown as { pdfjsLib?: PdfLib & { GlobalWorkerOptions: { workerSrc: string } } };
  if (!w.pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("cdn"));
      document.head.appendChild(script);
    });
  }
  const lib = (window as unknown as { pdfjsLib: PdfLib }).pdfjsLib;
  (w.pdfjsLib as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const tesseract = await loadTesseract();
  const buf = await file.arrayBuffer();
  const doc = await lib.getDocument({ data: buf }).promise;
  let text = "";
  const pages = Math.min(doc.numPages, 3);
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const { data } = await tesseract.recognize(canvas, "fra+eng");
    text += data.text + "\n\n";
  }
  return text.slice(0, 15_000);
}

const SUGGESTIONS = [
  "Quels sont les prochains matchs ?",
  "Comment gagner des points ?",
  "Où voir les scores en direct ?",
  "Comment marche la musique ?",
  "Dessine-moi une image de Messi",
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
  const [streamText, setStreamText] = useState("");
  const [pendingFile, setPendingFile] = useState<{ name: string; text: string } | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
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
  }, [messages, isTyping, streamText]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function onAttach(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop lourd (max 5 Mo).");
      return;
    }
    setFileLoading(true);
    try {
      if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("read"));
          reader.readAsDataURL(file);
        });
        setPendingImage(dataUrl);
        setPendingFile(null);
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        // (PDF : extraction texte, OCR de secours si scan)
        let text = await extractPdfText(file);
        if (!text.trim()) {
          // PDF scanné : OCR des 3 premières pages (gratuit, côté navigateur)
          toast.info("PDF scanné détecté, lecture OCR en cours… (une dizaine de secondes)");
          try {
            text = await ocrPdf(file);
          } catch {
            text = "";
          }
        }
        if (!text.trim()) {
          toast.error("Impossible de lire ce PDF (scan de mauvaise qualité).");
        } else {
          setPendingFile({ name: file.name, text });
          setPendingImage(null);
        }
      } else {
        const text = await file.text();
        setPendingFile({ name: file.name, text: text.slice(0, 20_000) });
        setPendingImage(null);
      }
    } catch {
      toast.error("Impossible de lire ce fichier 😕");
    } finally {
      setFileLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;

    const hasFile = !!pendingFile;
    const hasImage = !!pendingImage;
    // Le message affiche reste court ; le contenu complet (fichier) va au serveur
    const display = content + (hasFile ? `\n📎 ${pendingFile!.name}` : "") + (hasImage ? " 📷" : "");
    const fullContent = hasFile
      ? `Fichier joint : ${pendingFile!.name}\n\"\"\"\n${pendingFile!.text}\n\"\"\"\n\nQuestion : ${content}`
      : content;
    const userMsg: ChatMsg = { role: "user", content: display };
    const serverMsgs: ChatMsg[] = [...messages.map((m) => ({ role: m.role, content: m.content })), { role: "user" as const, content: fullContent }];
    addMessage(userMsg);
    setInput("");
    setPendingFile(null);
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: serverMsgs.slice(-10), image: hasImage ? pendingImage : undefined }),
      });

      // Erreur JSON classique (quota, 429...)
      const ctype = res.headers.get("content-type") ?? "";
      if (!res.ok || ctype.includes("application/json")) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        addMessage({
          role: "assistant",
          content: json?.error ?? "Oups, petit souci technique 😅 Réessaie dans un instant.",
        });
        return;
      }

      // Flux streaming : affichage progressif, mot à mot
      const provider = res.headers.get("X-Provider");
      if (provider) setProvider(provider);
      setStreamText("");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setStreamText(full);
        }
      } else {
        full = await res.text();
        setStreamText(full);
      }

      if (full.trim()) {
        addMessage({ role: "assistant", content: full });
      } else {
        addMessage({ role: "assistant", content: "Oups, réponse vide 😅 Réessaie dans un instant." });
      }
    } catch {
      addMessage({ role: "assistant", content: "Impossible de contacter l'assistant pour le moment 😕" });
    } finally {
      setStreamText("");
      setPendingImage(null);
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
                  <p className="text-sm font-bold">Assistant PRONO</p>
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
              {isTyping && !streamText && <TypingIndicator />}
              {streamText && <ChatMessage message={{ role: "assistant", content: streamText }} />}
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
              className="relative flex items-center gap-2 border-t border-white/5 bg-secondary/30 p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pose ta question…"
                className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring"
                maxLength={500}
              />
              {(pendingFile || pendingImage || fileLoading) && (
                <div className="absolute -top-10 left-2 flex max-w-[85%] items-center gap-1.5 rounded-full border border-primary/30 bg-secondary px-3 py-1 text-[11px]">
                  {fileLoading ? (
                    <span className="text-muted-foreground">Lecture du fichier…</span>
                  ) : pendingFile ? (
                    <>
                      <span className="truncate">📎 {pendingFile.name}</span>
                      <button type="button" onClick={() => setPendingFile(null)} className="ml-1 text-muted-foreground hover:text-foreground">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="truncate">📷 Image jointe</span>
                      <button type="button" onClick={() => setPendingImage(null)} className="ml-1 text-muted-foreground hover:text-foreground">✕</button>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md,.csv,.json,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onAttach(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isTyping || fileLoading}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                aria-label="Joindre un fichier (PDF, texte ou image)"
                title="Joindre un PDF, un fichier texte ou une image"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={(!input.trim() && !pendingImage) || isTyping}
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
