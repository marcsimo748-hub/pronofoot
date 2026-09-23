"use client";

/**
 * Covoiturage de la communauté (MODULE 6) — FR/EN/DE.
 * Publie ton trajet (ville ↔ ville, date, places, prix), cherche un covoiturage,
 * discute d'abord via le chat privé : les coordonnées ne sont révélées qu'après
 * l'accord du propriétaire. Modération : 3 signalements = trajet masqué.
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
import { humanDate, TRIP_REPORT_REASONS } from "./voyage-data";
import { useT, type Lang } from "@/lib/i18n";
import type { PronoVoyageTrip } from "@/lib/types";

interface Props {
  loggedIn: boolean;
  userId?: string;
  initialTrips: PronoVoyageTrip[];
  deeplinkTrip?: string;
  deeplinkChat?: boolean;
  autoPublish?: boolean;
}

function seatsLabel(n: number, lang: Lang): string {
  if (n <= 0) return lang === "en" ? "full" : lang === "de" ? "voll" : "complet";
  const unit = lang === "en" ? "seat" : lang === "de" ? "Platz" : "place";
  const plural = n > 1 ? "s" : "";
  return `${n} ${unit}${plural}`;
}

export function TripsSection({ loggedIn, userId, initialTrips, deeplinkTrip, deeplinkChat, autoPublish }: Props) {
  const { t, lang } = useT();
  const L = (lang || "fr") as Lang;
  const reasons = TRIP_REPORT_REASONS[L] ?? TRIP_REPORT_REASONS.fr;

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
  const [reason, setReason] = useState(reasons[0]);
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
          toast.info(t("voy.sToastPub"), { description: L === "en" ? "You can't contact yourself." : L === "de" ? "Du kannst dich nicht selbst kontaktieren." : "Tu ne peux pas te contacter toi-même." });
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
    [chatStarting, router, t, L]
  );

  useEffect(() => {
    if (!deeplinkTrip) return;
    const open = (trip: PronoVoyageTrip) => {
      if (deeplinkChat && loggedIn) {
        if (trip.user_id !== userId) void startChat(trip.id);
        return;
      }
      setSelected(trip);
    };
    const found = trips.find((tr) => tr.id === deeplinkTrip);
    if (found) {
      open(found);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/prono-voyage?id=${deeplinkTrip}`);
        if (res.ok) {
          const json = await res.json();
          const tr = json.trips?.[0];
          if (tr) open(tr as PronoVoyageTrip);
        }
      } catch {
        /* introuvable */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deeplinkTrip]);

  const list = tab === "mine" ? myTrips : trips;
  const nextTripsCount = useMemo(
    () => trips.filter((tr) => tr.trip_date >= new Date().toISOString().slice(0, 10)).length,
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

  const submitTrip = async () => {
    setFormError("");
    if (fOrigin.trim().length < 2 || fDest.trim().length < 2) {
      setFormError(t("voy.sErrorEmpty"));
      return;
    }
    if (!fDate) {
      setFormError(t("voy.sErrorDate"));
      return;
    }
    if (!fContactValue.trim()) {
      setFormError(t("voy.sErrorContact"));
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
        setFormError(t("voy.sErrorGeneric"));
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
      toast.success(t("voy.sToastPub"), { description: t("voy.sToastPubDesc") });
    } catch {
      setFormError(t("voy.sErrorNet"));
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
      setMyTrips((l) => l.map((tr) => (tr.id === trip.id ? { ...tr, status: next } : tr)));
      setTrips((l) => (next === "hidden" ? l.filter((tr) => tr.id !== trip.id) : [trip, ...l.filter((tr) => tr.id !== trip.id)]));
      toast[next === "hidden" ? "warning" : "success"](next === "hidden" ? t("voy.sToastHide") : t("voy.sToastShow"));
    }
  };

  const onDelete = async (trip: PronoVoyageTrip) => {
    if (!window.confirm(t("voy.sDeleteTitle", { from: trip.origin_city, to: trip.dest_city }))) return;
    const res = await fetch(`/api/prono-voyage?id=${trip.id}`, { method: "DELETE" });
    if (res.ok) {
      setMyTrips((l) => l.filter((tr) => tr.id !== trip.id));
      setTrips((l) => l.filter((tr) => tr.id !== trip.id));
      toast.success(t("voy.sToastDel"));
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
        setReportMsg(t("voy.sReportDone"));
      } else if (res.ok) {
        const json = await res.json();
        setReportMsg(json.hidden ? t("voy.sReportHidden") : t("voy.sReportTeam"));
        if (json.hidden) setTrips((l) => l.filter((tr) => tr.id !== selected.id));
      } else {
        setReportMsg(t("voy.sReportFail"));
      }
    } catch {
      setReportMsg(t("voy.sErrorNet"));
    } finally {
      setSendingReport(false);
    }
  };

  const isOwner = !!userId && selected?.user_id === userId;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} placeholder={t("voy.sFilterFrom")} className="sm:max-w-[200px]" maxLength={40} />
          <Input value={destFilter} onChange={(e) => setDestFilter(e.target.value)} placeholder={t("voy.sFilterTo")} className="sm:max-w-[200px]" maxLength={40} />
        </div>
        <Button variant="glow" className="gap-2" onClick={openPublish}>
          {t("voy.sPropose")}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "mine")}>
          <TabsList>
            <TabsTrigger value="all">{t("voy.sAllTab", { n: String(nextTripsCount) })}</TabsTrigger>
            {loggedIn && <TabsTrigger value="mine">{t("voy.sMineTab", { n: String(myTrips.length) })}</TabsTrigger>}
          </TabsList>
        </Tabs>
        {loading && <span className="text-xs text-muted-foreground">{t("voy.sRefreshing")}</span>}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
          {tab === "mine" ? t("voy.sEmptyMine") : t("voy.sEmptyAll")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tr) => (
            <div key={tr.id} className="flex flex-col rounded-xl border border-white/10 bg-card/70 p-4 transition-all hover:border-primary/40 hover:shadow-lg">
              <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">{t("voy.sCars")}</Badge>
                {tr.status === "hidden" && <Badge className="bg-amber-500/90 text-[10px] text-amber-950">{t("voy.sHidden")}</Badge>}
              </div>
              <p className="font-bold leading-snug">
                {tr.origin_city} <span className="text-primary">→</span> {tr.dest_city}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">📅 {humanDate(tr.trip_date, L)}</p>
              <p className="mt-1 text-sm">💺 {seatsLabel(tr.seats, L)} · 💶 {tr.price_eur > 0 ? `${tr.price_eur} €` : t("voy.sFree")}</p>
              {tr.note && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{tr.note}</p>}
              <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 text-xs text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={tr.author?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback className="text-[9px]">{(tr.author?.username ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate">{tr.author?.username ?? t("voy.sAnon")}</span>
                {tr.author?.email_verified && <span className="shrink-0 text-emerald-400" title={t("voy.sVerify")}>✓</span>}
              </div>
              <div className="mt-3">
                {isOwnerOf(tr, userId) ? (
                  <div className="flex gap-2">
                    {tr.status === "hidden" ? (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => void onHide(tr)}>{t("voy.sShow")}</Button>
                    ) : (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => void onHide(tr)}>{t("voy.sHide")}</Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => void onDelete(tr)}>🗑️</Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="glow"
                    className="w-full gap-2"
                    onClick={() => { setSelected(tr); setReporting(false); setReportMsg(""); }}
                  >
                    {t("voy.sView")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left">
                  {t("voy.sDetailTitle", { from: selected.origin_city, to: selected.dest_city })}
                </DialogTitle>
                <DialogDescription className="text-left">
                  {t("voy.sDetailMeta", {
                    date: humanDate(selected.trip_date, L),
                    seats: seatsLabel(selected.seats, L),
                    price: selected.price_eur > 0 ? `${selected.price_eur} €` : t("voy.sFree"),
                    author: selected.author?.username ?? t("voy.sAnon"),
                  })}
                  {selected.author?.email_verified && <span className="text-emerald-400" title={t("voy.sVerify")}> ✓</span>}
                </DialogDescription>
              </DialogHeader>

              {selected.note && <p className="whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-sm leading-relaxed">{selected.note}</p>}

              {isOwner ? (
                <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{t("voy.sPrivate")}</p>
              ) : (
                <Button
                  className="w-full gap-2"
                  variant="glow"
                  disabled={chatStarting === selected.id}
                  onClick={() => (loggedIn ? void startChat(selected.id) : requireAuthFor(selected.id))}
                >
                  {chatStarting === selected.id ? t("voy.sOpening") : t("voy.sChatWith", { user: selected.author?.username ?? t("voy.sAnon") })}
                </Button>
              )}

              {!isOwner && (
                <div className="border-t border-white/10 pt-3">
                  {!reporting ? (
                    <button type="button" onClick={() => (loggedIn ? setReporting(true) : requireAuthFor(selected.id))} className="text-xs text-muted-foreground hover:text-red-400">
                      {t("voy.sReport")}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">{t("voy.sReportWhy")}</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Select value={reason} onValueChange={setReason}>
                          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {reasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="destructive" onClick={() => void sendReport()} disabled={sendingReport}>
                          {sendingReport ? t("voy.sReportSending") : t("voy.sReportSend")}
                        </Button>
                      </div>
                    </div>
                  )}
                  {reportMsg && <p className="mt-2 text-xs text-muted-foreground">{reportMsg}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground/60">{t("voy.sReportNote")}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("voy.sPublish")}</DialogTitle>
            <DialogDescription>{t("voy.sPublishDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("voy.sCityFrom")}</Label>
                <Input value={fOrigin} onChange={(e) => setFOrigin(e.target.value)} maxLength={70} placeholder={t("voy.sCityPh")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("voy.sCityTo")}</Label>
                <Input value={fDest} onChange={(e) => setFDest(e.target.value)} maxLength={70} placeholder={t("voy.sCityPh")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>{t("voy.sDate")}</Label>
                <Input type="date" value={fDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setFDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("voy.sSeats")}</Label>
                <Select value={fSeats} onValueChange={setFSeats}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={String(n)}>{seatsLabel(n, L)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("voy.sPrice")}</Label>
                <Input type="number" min={0} max={999} value={fPrice} onChange={(e) => setFPrice(e.target.value)} placeholder={t("voy.sPricePh")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("voy.sNote")}</Label>
              <Textarea value={fNote} onChange={(e) => setFNote(e.target.value)} rows={3} maxLength={500} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2 rounded-lg bg-secondary/40 p-2.5 text-xs text-muted-foreground">
                {t("voy.sPrivate")}
              </div>
              <div className="space-y-1.5">
                <Label>{t("voy.sContactLabel")}</Label>
                <Select value={fContactPref} onValueChange={setFContactPref}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">{t("voy.sContactPrefW")}</SelectItem>
                    <SelectItem value="email">{t("voy.sContactPrefE")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  {fContactPref === "whatsapp"
                    ? (L === "en" ? "WhatsApp number *" : L === "de" ? "WhatsApp-Nummer *" : "Numéro WhatsApp *")
                    : t("voy.sContactLabel")}
                </Label>
                <Input
                  value={fContactValue}
                  onChange={(e) => setFContactValue(e.target.value)}
                  maxLength={150}
                  placeholder={fContactPref === "whatsapp" ? t("voy.sContactPhW") : t("voy.sContactPhE")}
                />
              </div>
            </div>
            {formError && <p className="text-sm text-red-400">{formError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>{t("voy.sCancel")}</Button>
              <Button onClick={() => void submitTrip()} disabled={saving}>
                {saving ? t("voy.sSubmitting") : t("voy.sPublier")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        message={t("voy.sAuthMsg")}
      />
    </div>
  );
}

function isOwnerOf(t: PronoVoyageTrip, userId?: string): boolean {
  return !!userId && t.user_id === userId;
}
