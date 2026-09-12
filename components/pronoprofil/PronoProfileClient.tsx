"use client";

/**
 * PronoProfileClient — hub des profils (MODULE 2).
 * 4 intentions (Emploi / Logement / Visa / Rencontre) + onglet CV.
 * Le formulaire s'adapte dynamiquement à l'intention choisie.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { PronoProfileForm } from "./PronoProfileForm";
import type { PronoProfile, PronoIntention } from "@/lib/types";

// Le builder PDF (html2canvas/jsPDF) ne tourne que dans le navigateur
const CvBuilder = dynamic(() => import("./CvBuilder").then((m) => m.CvBuilder), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-white/5 bg-card/70 p-8 text-center text-sm text-muted-foreground">
      Chargement du générateur de CV…
    </div>
  ),
});

const TABS: { key: PronoIntention | "cv"; label: string; icon: string }[] = [
  { key: "emploi", label: "Emploi", icon: "💼" },
  { key: "logement", label: "Logement", icon: "🏠" },
  { key: "visa", label: "Visa", icon: "🛂" },
  { key: "rencontre", label: "Rencontre", icon: "❤️" },
  { key: "cv", label: "Mon CV", icon: "📄" },
];

export function PronoProfileClient({
  initialProfiles,
  username,
  email,
}: {
  initialProfiles: PronoProfile[];
  username: string;
  email: string;
}) {
  const [profiles, setProfiles] = useState<PronoProfile[]>(initialProfiles);
  const [tab, setTab] = useState<PronoIntention | "cv">("emploi");
  const [flash, setFlash] = useState<string | null>(null);

  // L'intention choisie à l'inscription (localStorage) est présélectionnée
  useEffect(() => {
    try {
      const intent = localStorage.getItem("pronofoot-intent");
      if (intent && TABS.some((t) => t.key === intent)) setTab(intent as PronoIntention);
    } catch {
      /* localStorage indisponible */
    }
  }, []);

  function onSaved(profile: PronoProfile) {
    setProfiles((list) => {
      const i = list.findIndex((p) => p.intention === profile.intention);
      if (i >= 0) {
        const copy = [...list];
        copy[i] = profile;
        return copy;
      }
      return [...list, profile];
    });
    setFlash("✅ Profil enregistré !");
    setTimeout(() => setFlash(null), 4000);
  }

  const current = profiles.find((p) => p.intention === tab) ?? null;
  const emploiProfile = profiles.find((p) => p.intention === "emploi") ?? null;
  const doneCount = profiles.length;

  return (
    <div className="theme-job container space-y-6 py-8">
      {/* ===== En-tête ===== */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">🧩 Mes profils</h1>
          <Badge variant="default" className="bg-primary/15 text-primary">MODULE PRONOCV</Badge>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Salut <strong>{username}</strong> ! Un seul compte, plusieurs profils selon ton besoin :
          le formulaire s&apos;adapte à ton objectif. Ton profil <strong>Emploi</strong> alimente
          automatiquement le PronoScore de PronoJob et ton CV.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{doneCount}/4 profils créés</Badge>
          {profiles.map((p) => (
            <Badge key={p.id} variant="outline" className="border-green-500/30 text-green-400">
              ✓ {p.intention}
            </Badge>
          ))}
        </div>
      </header>

      {flash && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">{flash}</div>
      )}

      {/* ===== Onglets des intentions ===== */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {TABS.map((t) => {
          const exists = t.key !== "cv" && profiles.some((p) => p.intention === t.key);
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative rounded-xl border p-3 text-left transition-colors ${
                active
                  ? "border-primary/50 bg-primary/10"
                  : "border-white/5 bg-card/70 hover:border-primary/30"
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="mt-1 block text-sm font-semibold">{t.label}</span>
              {exists && (
                <span className="absolute right-2 top-2 text-[10px] text-green-400">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===== Contenu ===== */}
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {tab === "cv" ? (
          emploiProfile ? (
            <CvBuilder profile={emploiProfile} username={username} email={email} />
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="text-4xl">📄</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Remplis d&apos;abord ton profil <strong>Emploi</strong> — le CV se génère
                automatiquement à partir de tes informations.
              </p>
              <button
                onClick={() => setTab("emploi")}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                💼 Remplir mon profil Emploi
              </button>
            </div>
          )
        ) : (
          <PronoProfileForm intention={tab} profile={current} onSaved={onSaved} />
        )}
      </motion.div>
    </div>
  );
}
