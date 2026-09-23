"use client";

/**
 * PRONO-ANNONCES — client principal (MODULE 5).
 * Petites annonces style Leboncoin : catégories, recherche, filtre ville,
 * publication avec photos, mes annonces (masquer / supprimer), signalement.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
import { CATEGORIES, catLabel } from "./annonces-data";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import { AuthModal } from "@/components/auth/AuthModal";
import { setRedirectAfterLogin } from "@/lib/auth-redirect";
import type { PronoAnnonce } from "@/lib/types";

interface Props {
  initialAnnonces: PronoAnnonce[];
  loggedIn: boolean;
  userId?: string;
  prefill?: { city?: string; country?: string; email?: string };
  /** ?cat=logement : catégorie présélectionnée dans le filtre et le formulaire */
  initialCategory?: string;
  /** ?publier=1 : ouvrir directement le formulaire de publication */
  openFormInitially?: boolean;
  /** Deep link après connexion (?annonce=id) : rouvrir cette annonce */
  deeplinkAnnonce?: string;
  /** ?discuter=1 : démarrer directement le chat privé sur l'annonce du deep link */
  deeplinkChat?: boolean;
}


export function AnnoncesClient({ initialAnnonces, loggedIn, userId, prefill, deeplinkAnnonce, deeplinkChat, initialCategory, openFormInitially }: Props) {
  const { lang, t } = useT();
  const [annonces, setAnnonces] = useState<PronoAnnonce[]>(initialAnnonces);
  const [myAnnonces, setMyAnnonces] = useState<PronoAnnonce[]>([]);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [category, setCategory] = useState<string>(initialCategory ?? "");
  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PronoAnnonce | null>(null);
  const [formOpen, setFormOpen] = useState(Boolean(openFormInitially));
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
      {/* Barre de recherche premium */}
      <div className="glass sticky top-14 z-20 flex flex-col gap-3 rounded-2xl p-3 shadow-lg shadow-black/10 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between md:top-16">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("ann.search")}
            className="border-white/10 bg-background/50 transition-all focus-visible:ring-primary/40 sm:max-w-xs"
            maxLength={60}
          />
          <Input
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder={t("ann.locSearch")}
            className="border-white/10 bg-background/50 transition-all focus-visible:ring-primary/40 sm:max-w-[160px]"
            maxLength={40}
          />
        </div>
        {loggedIn ? (
          <Button variant="glow" className="gap-2" onClick={() => setFormOpen(true)}>
            {t("ann.publish")}
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
            <TabsTrigger value="all">{t("ann.tabAll")} ({annonces.length})</TabsTrigger>
            {loggedIn && <TabsTrigger value="mine">{t("ann.tabMine")} ({myAnnonces.length})</TabsTrigger>}
          </TabsList>
        </Tabs>
        {loading && <span className="text-xs text-muted-foreground">{t("ann.loading")}</span>}
      </div>

      {/* Catégories · pilules fluides */}
      {tab === "all" && (
        <div className="flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 ${
              category === ""
                ? "scale-105 border-primary bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                : "border-white/10 bg-secondary/40 text-muted-foreground hover:scale-105 hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t("ann.all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(category === c.value ? "" : c.value)}
              className={`group flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 ${
                category === c.value
                  ? "scale-105 border-primary bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                  : "border-white/10 bg-secondary/40 text-muted-foreground hover:scale-105 hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span className="transition-transform duration-300 group-hover:scale-125">{c.emoji}</span>
              {catLabel(c.value, lang)}
              {counts[c.value] ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    category === c.value ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
                  }`}
                >
                  {counts[c.value]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {/* Invitation visiteurs non connectés : eux aussi peuvent proposer */}
      {!loggedIn && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 text-center"
        >
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <p className="relative text-lg font-black">
            {t("ann.ctaTitle")}
          </p>
          <p className="relative mt-2 text-sm text-muted-foreground">
            <>{t("ann.ctaSub")}</>
            <span className="mt-1 block text-xs">
              Publish your service for free · Veröffentliche deinen Service kostenlos
            </span>
          </p>
          <div className="relative mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              variant="glow"
              onClick={() => {
                setRedirectAfterLogin("/prono-annonces");
                setAuthOpen(true);
              }}
            >
              {t("ann.ctaAccount")}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/boutiques">{t("ann.ctaSeeShops")}</Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Grille animée */}
      {list.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-2xl border-dashed p-14 text-center"
        >
          <p className="text-5xl">🪄</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {tab === "mine" ? t("ann.emptyMine") : category ? t("ann.emptyCat") : t("ann.emptyAll")}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a, i) => (
            <motion.div
              key={`${a.id}-${category}`}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: Math.min(i, 8) * 0.05, ease: [0.21, 0.6, 0.35, 1] }}
            >
              <AnnonceCard
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
            </motion.div>
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
          <AnnonceForm prefill={prefill} defaultCategory={initialCategory} onCreated={onCreated} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
