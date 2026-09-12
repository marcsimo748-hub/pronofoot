"use client";

/**
 * Covoiturage de la communauté (MODULE 6).
 * Publie ton trajet (ville ↔ ville, date, places, prix), cherche un covoiturage,
 * discute d'abord via le chat privé : les coordonnées ne sont révélées qu'après
 * l'accord du propriétaire. Modération : 3 signalements = trajet masqué.
 * Connecté requis pour publier, contacter et signaler (modale + retour au trajet exact).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthModal } from "@/components/auth/AuthModal";
import { setRedirectAfterLogin } from "@/lib/auth-redirect";
import { toast } from "sonner";
import { humanDateFr, TRIP_REPORT_REASONS_CLIENT } from "./voyage-data";
import type { PronoVoyageTrip } from "@/lib/types";

interface Props {
  loggedIn: boolean;
  userId?: string;
  initialTrips: PronoVoyageTrip[];
  deeplinkTrip?: string;
  /** ?discuter=1 : démarrer directement le chat privé sur le trajet du deep link */
  deeplinkChat?: boolean;
  /** Retour après connexion via le bouton Publier : rouvrir le formulaire */
  autoPublish?: boolean;
}

function seatsLabel(n: number): string {
  return n <= 0 ? "complet" : `${n} place${n > 1 ? "s" : ""}`;
}

export function TripsSection({ loggedIn, userId, initialTrips, deeplinkTrip, deeplinkChat, autoPublish }: Props) {
  const [trips, setTrips] = useState<PronoVoyageTrip[]>(initialTrips);
  const [myTrips, setMyTrips] = useState<PronoVoyageTrip[]>([]);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [originFilter, setOriginFilter] = useState("");
  const [destFilter, setDestFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [authOpen, setAuthOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<PronoVoyageTrip | null>(null);
  const [chatStarting, setChatStarting] = useState<string | null>(null);
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);

  // Formulaire
  const [fOrigin, setFOrigin] = useState("");
  const [fDest, setFDest] = useState("");
  const [fDate, setFDate] = useState("");
  const [fSeats, setFSeats] = useState("3");
  const [fPrice, setFPrice] = useState("");
  const [fNote, setFNote] = useState("");
  const [fContactPref, setFContactPref] = useState("whatsapp");
  const [fContactValue, setFContactValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Signalement
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState(TRIP_REPORT_REASONS_CLIENT[0]);
  const [reportMsg, setReportMsg] = useState("");
  const [sendingReport, setSendingReport] = useState(false);

  // ---- Chargement ----
  useEffect(() => {
    const t = setTimeout(async () => {
      if (tab !== "all") return;
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        if (originFilter.trim()) sp.set("origin", originFilter.trim());
        if (destFilter.trim()) sp.set("dest", destFilter.trim());
        const res = await fetch(`/api/prono-voyage?${sp.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setTrips(json.trips ?? []);
        }
      } catch {
        /* on garde la liste actuelle */
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [originFilter, destFilter, tab, reloadKey]);

  const loadMine = useCallback(async () => {
    if (!loggedIn) return;
    try {
      const res = await fetch("/api/prono-voyage?mine=1");
      if (res.ok) {
        const json = await res.json();
        setMyTrips(json.trips ?? []);
      }
    } catch {
      /* ignore */
    }
  }, [loggedIn]);

  useEffect(() => {
    void loadMine();
  }, [loadMine, reloadKey]);

  // Retour après connexion via Publier : rouvrir le formulaire automatiquement
  useEffect(() => {
    if (autoPublish && loggedIn) setFormOpen(true);
  }, [autoPublish, loggedIn]);

  /** Démarrer (ou retrouver) la discussion privée sur un trajet */
  const startChat = useCallback(
    async (tripId: string) => {
      if (chatStarting) return;
      setChatStarting(tripId);
      try {
        const res = await fetch("/api/prono-chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context_type: "trajet", context_id: tripId }),
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
          toast.info("C'est ton trajet 😊", { description: "Tu ne peux pas te contacter toi-même." });
        } else if (json.error === "no_contact_table") {
          toast.error("Chat indisponible", { description: "Configuration en cours, réessaie dans un instant." });
        } else {
          toast.error("Discussion impossible", { description: "Trajet introuvable ou problème technique." });
        }
      } catch {
        toast.error("Erreur réseau, réessaie.");
      } finally {
        setChatStarting(null);
      }
    },
    [chatStarting, router],
  );

  // Deep link après connexion : rouvrir le trajet exact cliqué.
  // Avec ?discuter=1 : ouvrir directement le chat privé.
  useEffect(() => {
    if (!deeplinkTrip) return;
    const open = (t: PronoVoyageTrip) => {
      if (deeplinkChat && loggedIn) {
        if (t.user_id !== userId) void startChat(t.id);
        return;
      }
      setSelected(t);
    };
    const found = trips.find((t) => t.id === deeplinkTrip);
    if (found) {
      open(found);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/prono-voyage?id=${deeplinkTrip}`);
        if (res.ok) {
          const json = await res.json();
          const t = json.trips?.[0];
          if (t) open(t as PronoVoyageTrip);
        }
      } catch {
        /* introuvable, on reste sur la liste */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deeplinkTrip]);

  const list = tab === "mine" ? myTrips : trips;
  const nextTripsCount = useMemo(
    () => trips.filter((t) => t.trip_date >= new Date().toISOString().slice(0, 10)).length,
    [trips]
  );

  const requireAuthFor = (tripId: string) => {
    setRedirectAfterLogin(`/prono-voyage?trajet=${tripId}&discuter=1`);
    setAuthOpen(true);
  };

  const openPublish = () => {
    if (!loggedIn) {
      setRedirectAfterLogin("/prono-voyage?publier=1");
      setAuthOpen(true);
      return;
    }
    setFormOpen(true);
  };

  // ---- Publication ----
  const submitTrip = async () => {
    setFormError("");
    if (fOrigin.trim().length < 2 || fDest.trim().length < 2) {
      setFormError("Indique la ville de départ et la destination.");
      return;
    }
    if (!fDate) {
      setFormError("Choisis la date du trajet.");
      return;
    }
    if (!fContactValue.trim()) {
      setFormError("Indique un moyen de contact (WhatsApp ou email).");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/prono-voyage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_city: fOrigin,
          dest_city: fDest,
          trip_date: fDate,
          seats: Number(fSeats) || 3,
          price_eur: Number(fPrice) || 0,
          note: fNote,
          contact_preference: fContactPref,
          contact_value: fContactValue,
        }),
      });
      if (!res.ok) {
        setFormError("Publication momentanément indisponible, réessaie dans un instant.");
        return;
      }
      const json = await res.json();
      setTrips((l) => [json.trip, ...l]);
      setMyTrips((l) => [json.trip, ...l]);
      setFormOpen(false);
      setFOrigin("");
      setFDest("");
      setFDate("");
      setFSeats("3");
      setFPrice("");
      setFNote("");
      setFContactValue("");
      setReloadKey((k) => k + 1);
      toast.success("Trajet publié 🎉", { description: "Les membres peuvent maintenant te contacter." });
    } catch {
      setFormError("Erreur réseau, réessaie.");
    } finally {
      setSaving(false);
    }
  };

  const onHide = async (trip: PronoVoyageTrip) => {
    const next = trip.status === "hidden" ? "active" : "hidden";
    const res = await fetch("/api/prono-voyage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trip.id, status: next }),
    });
    if (res.ok) {
      setMyTrips((l) => l.map((t) => (t.id === trip.id ? { ...t, status: next } : t)));
      setTrips((l) =>
        next === "hidden" ? l.filter((t) => t.id !== trip.id) : [trip, ...l.filter((t) => t.id !== trip.id)]
      );
      toast[next === "hidden" ? "warning" : "success"](next === "hidden" ? "Trajet masqué" : "Trajet réaffiché");
    }
  };

  const onDelete = async (trip: PronoVoyageTrip) => {
    if (!window.confirm(`Supprimer le trajet ${trip.origin_city} → ${trip.dest_city} ?`)) return;
    const res = await fetch(`/api/prono-voyage?id=${trip.id}`, { method: "DELETE" });
    if (res.ok) {
      setMyTrips((l) => l.filter((t) => t.id !== trip.id));
      setTrips((l) => l.filter((t) => t.id !== trip.id));
      toast.success("Trajet supprimé");
    }
  };

  const sendReport = async () => {
    if (!selected) return;
    setSendingReport(true);
    setReportMsg("");
    try {
      const res = await fetch("/api/prono-voyage/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, reason }),
      });
      if (res.status === 409) {
        setReportMsg("Tu as déjà signalé ce trajet ✅");
      } else if (res.ok) {
        const json = await res.json();
        setReportMsg(
          json.hidden
            ? "Merci ! Signalement enregistré, le trajet a été masqué automatiquement (3 signalements)."
            : "Merci ! L'équipe va examiner ce trajet."
        );
        if (json.hidden) setTrips((l) => l.filter((t) => t.id !== selected.id));
      } else {
        setReportMsg("Signalement impossible pour le moment.");
      }
    } catch {
      setReportMsg("Erreur réseau, réessaie.");
    } finally {
      setSendingReport(false);
    }
  };

  const isOwner = !!userId && selected?.user_id === userId;

  return (
    <div className="space-y-5">
      {/* Barre d'actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            placeholder="🛫 Ville de départ"
            className="sm:max-w-[200px]"
            maxLength={40}
          />
          <Input
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            placeholder="🛬 Destination"
            className="sm:max-w-[200px]"
            maxLength={40}
          />
        </div>
        <Button variant="glow" className="gap-2" onClick={openPublish}>
          ➕ Proposer un trajet
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "mine")}>
          <TabsList>
            <TabsTrigger value="all">🚗 Trajets ({nextTripsCount})</TabsTrigger>
            {loggedIn && <TabsTrigger value="mine">👤 Mes trajets ({myTrips.length})</TabsTrigger>}
          </TabsList>
        </Tabs>
        {loading && <span className="text-xs text-muted-foreground">Actualisation…</span>}
      </div>

      {/* Liste */}
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          {tab === "mine"
            ? "Tu n'as pas encore proposé de trajet. Propose ton premier covoiturage !"
            : "Aucun trajet pour l'instant. Propose le premier covoiturage de la communauté ! 🚗"}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <div
              key={t.id}
              className="flex flex-col rounded-xl border border-white/10 bg-card/70 p-4 transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">🚗 Covoiturage</Badge>
                {t.status === "hidden" && (
                  <Badge className="bg-amber-500/90 text-[10px] text-amber-950">Masqué</Badge>
                )}
              </div>
              <p className="font-bold leading-snug">
                {t.origin_city} <span className="text-primary">→</span> {t.dest_city}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                📅 {humanDateFr(t.trip_date)}
              </p>
              <p className="mt-1 text-sm">
                💺 {seatsLabel(t.seats)} · 💶 {t.price_eur > 0 ? `${t.price_eur} €` : "gratuit"}
              </p>
              {t.note && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{t.note}</p>}
              <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 text-xs text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={t.author?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback className="text-[9px]">
                    {(t.author?.username ?? "?").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{t.author?.username ?? "Anonyme"}</span>
              </div>
              <div className="mt-3">
                {isOwnerOf(t, userId) ? (
                  <div className="flex gap-2">
                    {t.status === "hidden" ? (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => void onHide(t)}>
                        👁️ Afficher
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => void onHide(t)}>
                        🚫 Masquer
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => void onDelete(t)}>
                      🗑️
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="glow"
                    className="w-full gap-2"
                    onClick={() => {
                      setSelected(t);
                      setReporting(false);
                      setReportMsg("");
                    }}
                  >
                    💬 Voir le trajet
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale détail trajet */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left">
                  🚗 {selected.origin_city} <span className="text-primary">→</span> {selected.dest_city}
                </DialogTitle>
                <DialogDescription className="text-left">
                  📅 {humanDateFr(selected.trip_date)} · 💺 {seatsLabel(selected.seats)} · 💶{" "}
                  {selected.price_eur > 0 ? `${selected.price_eur} €` : "gratuit"} · par{" "}
                  {selected.author?.username ?? "Anonyme"}
                </DialogDescription>
              </DialogHeader>

              {selected.note && (
                <p className="whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-sm leading-relaxed">
                  {selected.note}
                </p>
              )}

              {/* Contact : tout passe par le chat privé, coordonnées protégées */}
              {isOwner ? (
                <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
                  🔒 Ton contact reste privé. Les membres te contactent par le chat PRONO
                  et tu choisis quand révéler tes coordonnées.
                </p>
              ) : (
                <Button
                  className="w-full gap-2"
                  variant="glow"
                  disabled={chatStarting === selected.id}
                  onClick={() => (loggedIn ? void startChat(selected.id) : requireAuthFor(selected.id))}
                >
                  {chatStarting === selected.id ? "Ouverture…" : "💬 Discuter"} avec{" "}
                  {selected.author?.username ?? "l'auteur"}
                </Button>
              )}

              {/* Signalement */}
              {!isOwner && (
                <div className="border-t border-white/10 pt-3">
                  {!reporting ? (
                    <button
                      type="button"
                      onClick={() => (loggedIn ? setReporting(true) : requireAuthFor(selected.id))}
                      className="text-xs text-muted-foreground hover:text-red-400"
                    >
                      🚩 Signaler ce trajet
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Pourquoi signales-tu ce trajet ?</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Select value={reason} onValueChange={setReason}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRIP_REPORT_REASONS_CLIENT.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="destructive" onClick={() => void sendReport()} disabled={sendingReport}>
                          {sendingReport ? "…" : "Envoyer"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {reportMsg && <p className="mt-2 text-xs text-muted-foreground">{reportMsg}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    3 signalements différents = masquage automatique du trajet.
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modale publication */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>🚗 Proposer un trajet</DialogTitle>
            <DialogDescription>
              Partage tes places libres avec la communauté. Reste clair sur la date,
              le départ et le prix.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ville de départ *</Label>
                <Input value={fOrigin} onChange={(e) => setFOrigin(e.target.value)} maxLength={70} placeholder="Berlin" />
              </div>
              <div className="space-y-1.5">
                <Label>Destination *</Label>
                <Input value={fDest} onChange={(e) => setFDest(e.target.value)} maxLength={70} placeholder="Paris" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={fDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setFDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Places</Label>
                <Select value={fSeats} onValueChange={setFSeats}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} place{n > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prix (€)</Label>
                <Input
                  type="number"
                  min={0}
                  max={999}
                  value={fPrice}
                  onChange={(e) => setFPrice(e.target.value)}
                  placeholder="0 = gratuit"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Note (itinéraire, bagages, horaires de départ…)</Label>
              <Textarea value={fNote} onChange={(e) => setFNote(e.target.value)} rows={3} maxLength={500} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2 rounded-lg bg-secondary/40 p-2.5 text-xs text-muted-foreground">
                🔒 Ton contact reste privé : il n&apos;apparaît jamais dans le trajet.
                Les membres discutent avec toi par le chat PRONO, et tu choisis quand leur
                révéler tes coordonnées.
              </div>
              <div className="space-y-1.5">
                <Label>Contact *</Label>
                <Select value={fContactPref} onValueChange={setFContactPref}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                    <SelectItem value="email">✉️ Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{fContactPref === "whatsapp" ? "Numéro WhatsApp *" : "Adresse email *"}</Label>
                <Input
                  value={fContactValue}
                  onChange={(e) => setFContactValue(e.target.value)}
                  maxLength={150}
                  placeholder={fContactPref === "whatsapp" ? "+49 170 1234567" : "toi@email.com"}
                />
              </div>
            </div>
            {formError && <p className="text-sm text-red-400">{formError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={() => void submitTrip()} disabled={saving}>
                {saving ? "Publication…" : "🚗 Publier mon trajet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale connexion */}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        message="Connecte-toi ou crée ton compte gratuit, tu reviendras directement sur ce trajet."
      />
    </div>
  );
}

function isOwnerOf(t: PronoVoyageTrip, userId?: string): boolean {
  return !!userId && t.user_id === userId;
}
