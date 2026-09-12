"use client";

/**
 * CLOCHE DE NOTIFICATIONS (Mission 10).
 * Badge de non-lus + menu déroulant : nouveaux messages, nouvelles
 * discussions, coordonnées partagées. Créées par les triggers SQL (011).
 * Actualisation toutes les 30 s. Affichée uniquement si connecté.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PronoNotification } from "@/lib/types";

const TYPE_ICON: Record<PronoNotification["type"], string> = {
  chat_message: "💬",
  chat_new: "✨",
  chat_contact: "🔓",
  system: "📣",
};

function timeShort(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function NotificationsBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<PronoNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.notifications ?? []);
      setUnread(json.unread ?? 0);
    } catch {
      /* réseau : on garde l'état */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openItem = async (n: PronoNotification) => {
    setOpen(false);
    if (!n.read) {
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id }),
        });
        if (res.ok) setUnread((u) => Math.max(0, u - 1));
      } catch {
        /* on navigue quand même */
      }
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        const json = await res.json();
        setUnread(json.unread ?? 0);
        setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      }
    } catch {
      /* réseau */
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        className="relative text-muted-foreground hover:text-foreground"
        onClick={() => {
          setOpen((v) => !v);
          void load();
        }}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/10 bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
            <p className="text-sm font-bold">🔔 Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAll()}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">
                Aucune notification pour l&apos;instant.
                Les nouveaux messages et discussions arrivent ici 🔔
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => void openItem(n)}
                  className={`flex w-full items-start gap-2.5 border-b border-white/5 px-3.5 py-2.5 text-left transition-colors last:border-0 hover:bg-secondary/40 ${
                    n.read ? "opacity-70" : "bg-primary/5"
                  }`}
                >
                  <span className="mt-0.5 text-base">{TYPE_ICON[n.type] ?? "📣"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </span>
                    {n.body && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.body}</span>}
                    <span className="mt-0.5 block text-[10px] text-muted-foreground/70">{timeShort(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
