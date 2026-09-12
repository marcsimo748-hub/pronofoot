"use client";

/**
 * PRONO-ANNONCES — client principal (MODULE 5).
 * Petites annonces style Leboncoin : catégories, recherche, filtre ville,
 * publication avec photos, mes annonces (masquer / supprimer), signalement.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnonceCard } from "./AnnonceCard";
import { AnnonceDetail } from "./AnnonceDetail";
import { AnnonceForm } from "./AnnonceForm";
import { CATEGORIES } from "./annonces-data";
import { AuthModal } from "@/components/auth/AuthModal";
import { setRedirectAfterLogin } from "@/lib/auth-redirect";
import type { PronoAnnonce } from "@/lib/types";

interface Props {
  initialAnnonces: PronoAnnonce[];
  loggedIn: boolean;
  userId?: string;
  prefill?: { city?: string; country?: string; email?: string };
  /** Deep link après connexion (?annonce=id) : rouvrir cette annonce */
  deeplinkAnnonce?: string;
  /** ?discuter=1 : démarrer directement le chat privé sur l'annonce du deep link */
  deeplinkChat?: boolean;
}

const PLACEHOLDER = [
  "Aucune annonce pour l'instant, sois le premier à publier ! 🚀",
  "Rien dans cette catégorie… reviens bientôt !",
];

export function AnnoncesClient({ initialAnnonces, loggedIn, userId, prefill, deeplinkAnnonce, deeplinkChat }: Props) {
  const [annonces, setAnnonces] = useState<PronoAnnonce[]>(initialAnnonces);
  const [myAnnonces, setMyAnnonces] = useState<PronoAnnonce[]>([]);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [category, setCategory] = useState<string>("");
  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PronoAnnonce | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [chatStarting, setChatStarting] = useState<string | null>(null);
  const router = useRouter();

  // Recharge la liste quand filtres changent (debounce simple)
  useEffect(() => {
    if (tab !== "all") return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        if (category) sp.set("category", category);
        if (cityFilter.trim()) sp.set("city", cityFilter.trim());
        if (q.trim()) sp.set("q", q.trim());
        const res = await fetch(`/api/prono-annonces?${sp.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setAnnonces(json.annonces ?? []);
        }
      } catch {
        /* offline : on garde la liste actuelle */
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [category, q, cityFilter, tab, reloadKey]);

  // Mes annonces (si connecté)
  const loadMine = useCallback(async () => {
    if (!loggedIn) return;
    try {
      const res = await fetch("/api/prono-annonces?mine=1");
      if (res.ok) {
        const json = await res.json();
        setMyAnnonces(json.annonces ?? []);
      }
    } catch {
      /* ignore */
    }
  }, [loggedIn]);

  useEffect(() => {
    void loadMine();
  }, [loadMine, reloadKey]);

  /** Démarrer (ou retrouver) la discussion privée sur une annonce */
  const startChat = useCallback(
    async (annonceId: string) => {
      if (chatStarting) return;
      setChatStarting(annonceId);
      try {
        const res = await fetch("/api/prono-chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context_type: "annonce", context_id: annonceId }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.conversation_id) {
            router.push(`/messages/${json.conversation_id}`);
            return;
          }
        }
        const json = await res.json().catch(() => ({}));
        if (json.error === "annonce_a_soi") {
          toast.info("C'est ton annonce 😊", { description: "Tu ne peux pas te contacter toi-même." });
        } else if (json.error === "no_contact_table") {
          toast.error("Chat indisponible", { description: "Configuration en cours, réessaie dans un instant." });
        } else {
          toast.error("Discussion impossible", { description: "Annonce introuvable ou problème technique." });
        }
      } catch {
        toast.error("Erreur réseau, réessaie.");
      } finally {
        setChatStarting(null);
      }
    },
    [chatStarting, router],
  );

  // Deep link après connexion : rouvrir l'annonce exacte cliquée.
  // Avec ?discuter=1 : ouvrir directement le chat privé.
  useEffect(() => {
    if (!deeplinkAnnonce) return;
    const open = (a: PronoAnnonce) => {
      if (deeplinkChat && loggedIn) {
        if (a.user_id !== userId) void startChat(a.id);
        return;
      }
      setSelected(a);
    };
    const found = annonces.find((a) => a.id === deeplinkAnnonce);
    if (found) {
      open(found);
      return;
    }
    // Annonce plus ancienne : on la récupère par son id
    void (async () => {
      try {
        const res = await fetch(`/api/prono-annonces?id=${deeplinkAnnonce}`);
        if (res.ok) {
          const json = await res.json();
          const a = json.annonces?.[0];
          if (a) open(a as PronoAnnonce);
        }
      } catch {
        /* introuvable, on reste sur la liste */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deeplinkAnnonce]);

  /** Non connecté : modale connexion/inscription, retour à l'annonce exacte */
  const requireAuthFor = (annonceId: string) => {
    setRedirectAfterLogin(`/prono-annonces?annonce=${annonceId}&discuter=1`);
    setAuthOpen(true);
  };

  const list = tab === "mine" ? myAnnonces : annonces;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of annonces) c[a.category] = (c[a.category] ?? 0) + 1;
    return c;
  }, [annonces]);

  const onCreated = (annonce: PronoAnnonce) => {
    setAnnonces((l) => [annonce, ...l]);
    setMyAnnonces((l) => [annonce, ...l]);
    setFormOpen(false);
    setReloadKey((k) => k + 1);
    toast.success("Annonce publiée 🎉", {
      description: "Elle est maintenant visible par toute la communauté.",
    });
  };

  const onHide = async (annonce: PronoAnnonce) => {
    const next = annonce.status === "hidden" ? "active" : "hidden";
    const res = await fetch("/api/prono-annonces", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: annonce.id, status: next }),
    });
    if (res.ok) {
      setMyAnnonces((l) => l.map((a) => (a.id === annonce.id ? { ...a, status: next } : a)));
      setAnnonces((l) =>
        next === "hidden" ? l.filter((a) => a.id !== annonce.id) : [annonce, ...l.filter((a) => a.id !== annonce.id)]
      );
      if (next === "hidden") {
        toast.warning("Annonce masquée", { description: "Elle n'apparaît plus dans la liste publique." });
      } else {
        toast.success("Annonce réaffichée", { description: "Elle est de nouveau visible." });
      }
    }
  };

  const onDelete = async (annonce: PronoAnnonce) => {
    if (!window.confirm(`Supprimer « ${annonce.title} » ? Cette action est définitive.`)) return;
    const res = await fetch(`/api/prono-annonces?id=${annonce.id}`, { method: "DELETE" });
    if (res.ok) {
      setMyAnnonces((l) => l.filter((a) => a.id !== annonce.id));
      setAnnonces((l) => l.filter((a) => a.id !== annonce.id));
      toast.success("Annonce supprimée");
    }
  };

  const onReported = (id: string) => {
    // Si auto-masquée, on la retire de la liste publique
    setAnnonces((l) => {
      const found = l.find((a) => a.id === id);
      if (found && found.status !== "active") return l.filter((a) => a.id !== id);
      return l;
    });
  };

  return (
    <div className="space-y-5">
      {/* Barre d'actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Rechercher…"
            className="sm:max-w-xs"
            maxLength={60}
          />
          <Input
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder="📍 Ville"
            className="sm:max-w-[160px]"
            maxLength={40}
          />
        </div>
        {loggedIn ? (
          <Button variant="glow" className="gap-2" onClick={() => setFormOpen(true)}>
            ➕ Publier une annonce
          </Button>
        ) : (
          <Button
            variant="glow"
            className="gap-2"
            onClick={() => {
              setRedirectAfterLogin("/prono-annonces");
              setAuthOpen(true);
            }}
          >
            ➕ Publier une annonce
          </Button>
        )}
      </div>

      {/* Onglets */}
      <div className="flex items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "mine")}>
          <TabsList>
            <TabsTrigger value="all">📣 Toutes ({annonces.length})</TabsTrigger>
            {loggedIn && <TabsTrigger value="mine">👤 Mes annonces ({myAnnonces.length})</TabsTrigger>}
          </TabsList>
        </Tabs>
        {loading && <span className="text-xs text-muted-foreground">Actualisation…</span>}
      </div>

      {/* Catégories */}
      {tab === "all" && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              category === ""
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/10 bg-secondary/40 text-muted-foreground hover:border-primary/40"
            }`}
          >
            ✨ Toutes
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(category === c.value ? "" : c.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                category === c.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/10 bg-secondary/40 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {c.emoji} {c.short} {counts[c.value] ? `(${counts[c.value]})` : ""}
            </button>
          ))}
        </div>
      )}

      {/* Grille */}
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          {tab === "mine"
            ? "Tu n'as pas encore publié d'annonce. Clique sur Publier pour ta première !"
            : PLACEHOLDER[category ? 1 : 0]}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <AnnonceCard
              key={a.id}
              annonce={a}
              isOwner={!!userId && a.user_id === userId}
              onOpen={() => {
                // On prend la version à jour de la liste (statut inclus)
                const fresh = list.find((x) => x.id === a.id) ?? a;
                setSelected(fresh);
              }}
              onHide={() => void onHide(a)}
              onDelete={() => void onDelete(a)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnnonceDetail
        annonce={selected}
        isOwner={!!userId && selected?.user_id === userId}
        loggedIn={loggedIn}
        onChat={(id) => {
          if (loggedIn) void startChat(id);
          else requireAuthFor(id);
        }}
        onAuthRequired={requireAuthFor}
        onClose={() => setSelected(null)}
        onReported={onReported}
      />

      {/* Modale connexion / inscription (contacter, publier, signaler) */}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        message="Connecte-toi ou crée ton compte gratuit, tu reviendras directement sur cette annonce."
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>📢 Publier une annonce</DialogTitle>
            <DialogDescription>
              Visible par toute la communauté PRONO. Reste respectueux : les annonces
              inappropriées sont masquées après 3 signalements.
            </DialogDescription>
          </DialogHeader>
          <AnnonceForm prefill={prefill} onCreated={onCreated} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
