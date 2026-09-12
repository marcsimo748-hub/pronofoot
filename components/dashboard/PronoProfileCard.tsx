"use client";

/**
 * PronoProfileCard — carte "Mes profils" du dashboard.
 * Raccourci vers /prono-profil (profils Emploi/Logement/Visa/Rencontre + CV).
 * Invisible si l'API n'est pas disponible (tables 005 absentes).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PronoProfile } from "@/lib/types";

const LABELS: Record<string, string> = {
  emploi: "💼 Emploi",
  logement: "🏠 Logement",
  visa: "🛂 Visa",
  rencontre: "❤️ Rencontre",
};

export function PronoProfileCard() {
  const [profiles, setProfiles] = useState<PronoProfile[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/prono-profiles")
      .then((r) => r.json())
      .then((json) => {
        if (alive && json.ok && Array.isArray(json.data)) setProfiles(json.data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!profiles) return null; // non connecté ou tables absentes → invisible

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/70 p-4">
      <div>
        <h3 className="flex items-center gap-2 font-semibold">🧩 Mes profils Pronofoot</h3>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crée ton profil (Emploi, Logement, Visa, Rencontre) et génère ton CV gratuitement.
            </p>
          ) : (
            profiles.map((p) => (
              <Badge key={p.id} variant="outline" className="border-green-500/30 text-green-400">
                {LABELS[p.intention] ?? p.intention}
              </Badge>
            ))
          )}
        </div>
      </div>
      <Link
        href="/prono-profil"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        {profiles.length === 0 ? "Créer mon profil →" : "Gérer mes profils & CV →"}
      </Link>
    </section>
  );
}
