"use client";

/**
 * Bandeau d'annonce publique (Admin > 📢 Annonce Publique).
 * Fermable (le choix est mémorisé par message).
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "lucide-react";
import { useUiStore } from "@/lib/store/uiStore";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVEL_STYLES = {
  info: "border-primary/40 bg-primary/10 text-primary",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

export function AnnouncementBanner({ settings }: { settings: SiteSettings }) {
  const { active, message, level } = settings.announcement;
  const dismissed = useUiStore((s) => s.announcementDismissed);
  const dismiss = useUiStore((s) => s.dismissAnnouncement);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || !active || !message || dismissed === message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className={cn("border-b px-4 py-2.5 text-sm", LEVEL_STYLES[level ?? "info"])}>
          <div className="container flex items-center gap-3">
            <Megaphone className="h-4 w-4 shrink-0" />
            <p className="flex-1 truncate font-medium">{message}</p>
            <button
              onClick={() => dismiss(message)}
              className="opacity-70 hover:opacity-100"
              aria-label="Fermer l'annonce"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
