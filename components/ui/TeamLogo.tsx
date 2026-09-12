"use client";

/**
 * TeamLogo — logo officiel d'une équipe vedette.
 *
 * Source : API-FOOTBALL (média public, https://media.api-sports.io), l'identifiant
 * de chaque équipe étant connu dans FEATURED_TEAMS (lib/constants).
 * Repli élégant si l'équipe est inconnue ou l'image indisponible :
 * un rond discret avec les initiales du club.
 */

import { useState } from "react";
import { FEATURED_TEAMS } from "@/lib/constants";

const TEAM_API_IDS = new Map<string, number>(
  FEATURED_TEAMS.map((t) => [t.name, t.apiId] as [string, number])
);

/** URL publique du logo d'une équipe (null si inconnue) */
export function teamLogoUrl(name: string): string | null {
  const id = TEAM_API_IDS.get(name);
  return id ? `https://media.api-sports.io/football/teams/${id}.png` : null;
}

export function TeamLogo({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = teamLogoUrl(name);

  // Repli : rond avec initiales (ex. "Real Madrid" → "RM")
  if (!url || failed) {
    const initials = name
      .split(/[\s-]+/)
      .map((w) => w[0])
      .slice(0, 3)
      .join("")
      .toUpperCase();
    return (
      <span
        style={{ width: size, height: size, fontSize: Math.max(8, size * 0.4) }}
        className={`grid shrink-0 place-items-center rounded-full bg-secondary font-bold text-muted-foreground ${className}`}
        aria-hidden
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
