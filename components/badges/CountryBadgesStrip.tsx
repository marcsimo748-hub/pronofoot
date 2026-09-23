/**
 * CountryBadgesStrip — affiche les badges pays africain obtenus
 * par un utilisateur (supporter-{slug}, fidele-{slug}, ambassadeur-{slug}).
 *
 * Visuel : drapeau + nom du pays + emoji du tier + badge tooltip trilingue.
 */

import { decodeCountryBadge, AFRICA_COUNTRIES } from "@/lib/services/country-badges.service";

interface Props {
  badges: { code: string; awarded_at: string }[];
  /** Affiche le pays même s'il n'a pas de badge (avec compteur 0). */
  showAll?: boolean;
  /** Compteurs par pays pour le mode "showAll". */
  countsBySlug?: Record<string, number>;
}

export function CountryBadgesStrip({ badges, showAll, countsBySlug }: Props) {
  // Décoder chaque badge en {slug, tier}
  const decoded = badges
    .map((b) => decodeCountryBadge(b.code))
    .filter((b): b is NonNullable<typeof b> => b !== null);

  // Si showAll, on affiche tous les pays africains, badge ou pas
  if (showAll) {
    return (
      <div className="flex flex-wrap gap-2">
        {AFRICA_COUNTRIES.map((c) => {
          const count = countsBySlug?.[c.slug] ?? 0;
          const userBadge = decoded.filter((b) => b.slug === c.slug).sort((a, b) => b.tier - a.tier)[0];
          const tier = userBadge?.tier ?? 0;
          return (
            <div
              key={c.slug}
              className={`group relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                tier > 0
                  ? "border-amber-500/40 bg-amber-500/10"
                  : count > 0
                  ? "border-white/10 bg-card/50"
                  : "border-white/5 bg-card/30 opacity-50"
              }`}
              title={userBadge?.tierLabel ?? "Aucun badge"}>
              <span className="text-base">{c.flag}</span>
              <span className="font-semibold">{c.name.fr}</span>
              {tier > 0 && <span className="text-sm">{userBadge?.emoji}</span>}
              <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Sinon : seulement les badges obtenus, triés par tier décroissant
  if (decoded.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Aucun badge pays africain pour l'instant. Pronostique sur les matchs de ton pays pour débloquer{" "}
        <span className="font-semibold">Supporter 🌱</span>,{" "}
        <span className="font-semibold">Fidèle 💪</span> et{" "}
        <span className="font-semibold">Ambassadeur 👑</span>.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {decoded
        .sort((a, b) => b.tier - a.tier || a.slug.localeCompare(b.slug))
        .map((b) => {
          const country = AFRICA_COUNTRIES.find((c) => c.slug === b.slug);
          return (
            <div
              key={b.slug + b.tier}
              className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-500/5 px-3 py-1.5 text-xs"
              title={`${b.tierLabel} ${country?.name.fr ?? b.slug}`}
            >
              <span className="text-base">{country?.flag ?? "🌍"}</span>
              <span className="font-semibold">{country?.name.fr ?? b.slug}</span>
              <span className="text-base">{b.emoji}</span>
            </div>
          );
        })}
    </div>
  );
}
