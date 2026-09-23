"use client";

/**
 * ShareButton — bouton « Partager ↗ ».
 * 1) Mobile : Web Share API (partage natif WhatsApp / Telegram / Facebook).
 * 2) Ordinateur : boutons directs WhatsApp · Telegram · Facebook · Copier,
 *    avec le résumé (title/text) déjà écrit dans le message.
 * URL unique par item (chemin relatif accepté, rendu absolu au clic).
 */

import { useState } from "react";
import { Share2, Check, Copy, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

interface ShareButtonProps {
  /** Titre partagé (ex : « Dortmund 2-1 Bayern — mon prono ») */
  title: string;
  /** Texte / résumé partagé (facultatif) */
  text?: string;
  /** URL unique de l'item — par défaut la page courante */
  url?: string;
  size?: "sm" | "default";
  variant?: "ghost" | "outline";
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  size = "sm",
  variant = "ghost",
  className,
}: ShareButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useT();

  const absoluteUrl = () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      return new URL(shareUrl, typeof window !== "undefined" ? window.location.origin : undefined).href;
    } catch {
      return shareUrl;
    }
  };

  const fullMessage = () => (text ? `${text}` : title);

  const share = async () => {
    // 1) Mobile : partage natif (WhatsApp, Telegram, Facebook…)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: fullMessage(), url: absoluteUrl() });
        return;
      } catch {
        /* partage annulé par l'utilisateur : rien à signaler */
        return;
      }
    }
    // 2) Ordinateur : afficher les boutons réseaux
    setShowOptions((s) => !s);
  };

  const openNetwork = (network: "wa" | "tg" | "fb") => {
    const u = encodeURIComponent(absoluteUrl());
    const m = encodeURIComponent(fullMessage());
    const links: Record<string, string> = {
      wa: `https://wa.me/?text=${m}%20${u}`,
      tg: `https://t.me/share/url?url=${u}&text=${m}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    };
    window.open(links[network], "_blank", "noopener,noreferrer,width=680,height=560");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${fullMessage()} · ${absoluteUrl()}`);
    setCopied(true);
    toast.success(t("share.copiedToast"));
    setTimeout(() => setCopied(false), 2500);
  };

  const netBtn =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white transition-transform duration-200 hover:scale-105";

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className}
        onClick={share}
        aria-label={`Partager : ${title}`}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> {t("share.copied")}
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5" /> {t("share.btn")}
          </>
        )}
      </Button>

      {showOptions && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className={`${netBtn} bg-[#16a34a]`} onClick={() => openNetwork("wa")}>
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
          <button type="button" className={`${netBtn} bg-[#2563eb]`} onClick={() => openNetwork("tg")}>
            <Send className="h-3.5 w-3.5" /> Telegram
          </button>
          <button type="button" className={`${netBtn} bg-[#1877f2]`} onClick={() => openNetwork("fb")}>
            <span className="text-sm leading-none">f</span> Facebook
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-secondary px-2.5 py-1.5 text-xs font-bold transition-transform duration-200 hover:scale-105"
            onClick={copyLink}
          >
            <Copy className="h-3.5 w-3.5" /> {t("share.copy")}
          </button>
        </div>
      )}
    </div>
  );
}
