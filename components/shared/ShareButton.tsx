"use client";

/**
 * ShareButton — bouton « Partager ↗ » des cartes.
 * Web Share API (mobile natif) + repli : copier le lien dans le
 * presse-papiers avec toast de confirmation. URL unique par item.
 */

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  /** Titre partagé (ex : « Dortmund 2-1 Bayern — mon prono ») */
  title: string;
  /** Texte partagé (facultatif) */
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
  const [shared, setShared] = useState(false);

  const share = async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      // 1) Web Share API (mobile : partage natif WhatsApp & co)
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        return;
      }
      // 2) Repli desktop : copier le lien
      await navigator.clipboard.writeText(`${title} — ${shareUrl}`);
      setShared(true);
      toast.success("Lien copié ! Colle-le sur WhatsApp, Telegram ou ailleurs");
      setTimeout(() => setShared(false), 2500);
    } catch {
      /* partage annulé par l'utilisateur : rien à signaler */
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={share}
      aria-label={`Partager : ${title}`}
    >
      {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      Partager ↗
    </Button>
  );
}
