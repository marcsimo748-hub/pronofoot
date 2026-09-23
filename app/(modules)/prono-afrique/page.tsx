import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BannerRotator } from "@/components/shared/BannerRotator";
import { PronosClient } from "@/components/pronos/PronosClient";
import { getMatchesForPrediction, getStartedMatches, getAdminPredictionPeek, getUpcomingParticipants } from "@/lib/services/predictions.service";
import { getSettings } from "@/lib/services/settings.service";
import { getSessionUser } from "@/lib/supabase/server";
import { AFRICA_LEAGUE_CODES, AFRICA_FEATURED_TEAMS, LEAGUES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import type { Match } from "@/lib/types";
import { Trophy, Globe2, Flag } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Pronostics Sélections Africaines · CAN, Qualifs CDM, Amicaux — PRONO",
  description:
    "Pronostique les matchs de TOUTES les sélections africaines : Cameroun, Sénégal, Maroc, Nigeria, Côte d'Ivoire, Égypte, Ghana, Algérie, Tunisie, Mali. CAN, qualifications Coupe du Monde et matchs amicaux. Badges exclusifs par pays (Lions-fan 🦁, Lions de la Téranga 🦁🇸🇳, Lions de l'Atlas 🦁🇲🇦, etc.).",
  path: "/prono-afrique",
  ogImage: "/og-afrique.png",
  keywords: [
    "sélections africaines",
    "CAN 2025",
    "football africain",
    "Lions Indomptables Cameroun",
    "Lions de la Téranga Sénégal",
    "Lions de l'Atlas Maroc",
    "Super Eagles Nigeria",
    "Éléphants Côte d'Ivoire",
    "Pharaons Égypte",
    "Black Stars Ghana",
    "Fennecs Algérie",
    "Aigles de Carthage Tunisie",
    "qualifications coupe du monde Afrique",
    "match amical africain",
  ],
});

/**
 * Page /prono-afrique — MODULE 9 « Sélections Africaines ».
 *
 * POUR TOUTE LA DIASPORA AFRICAINE, pas seulement camerounaise.
 * Couvre : CAN seniors + CAN U17/U20/U23, Qualifications CDM (zone Afrique),
 * matchs amicaux internationaux des sélections africaines.
 *
 * Filtrage : on ne récupère que les matchs dont `league` est dans AFRICA_LEAGUE_CODES.
 * Le sélecteur pays (client) filtre ensuite les matchs d'un pays précis.
 *
 * Badges exclusifs par pays dans lib/badges.ts (lions-fan 🇨🇲, etc.).
 */
export default async function PronoAfriquePage({
  searchParams,
}: {
  searchParams?: { pays?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/prono-afrique");

  const [{ matches: allMatches, predictions }, settings, startedMatches] = await Promise.all([
    getMatchesForPrediction(user.id),
    getSettings(),
    getStartedMatches(),
  ]);

  // Filtre les matchs africains uniquement (sélection nationale, compétitions africaines ou qualifs CDM zone Afrique)
  const africanLeaguesSet = new Set<string>(AFRICA_LEAGUE_CODES);
  const matches: Match[] = allMatches.filter((m) => africanLeaguesSet.has(m.league));

  // Admin : aperçu des pronos des joueurs avant le coup d'envoi
  const adminPeek = user.is_admin ? await getAdminPredictionPeek(matches.map((m) => m.id)) : undefined;

  // 👥 Qui a déjà pronostiqué chaque match à venir
  const participants = await getUpcomingParticipants(matches.map((m) => m.id));

  // Compteurs par compétition pour les badges en haut de page
  const competitionCounts: Record<string, number> = {};
  for (const m of matches) {
    competitionCounts[m.league] = (competitionCounts[m.league] ?? 0) + 1;
  }

  // Compteurs par pays (détecte le pays via home_team/away_team)
  const normalizeForCountry = (s: string) => s.toLowerCase().replace(/[-/&.]/g, " ").trim();
  const countryMatches: Record<string, number> = {};
  for (const t of AFRICA_FEATURED_TEAMS) {
    countryMatches[normalizeForCountry(t.name)] = 0;
  }
  for (const m of matches) {
    const home = normalizeForCountry(m.home_team);
    const away = normalizeForCountry(m.away_team);
    for (const t of AFRICA_FEATURED_TEAMS) {
      const tn = normalizeForCountry(t.name);
      if (home.includes(tn) || away.includes(tn) || tn.includes(home) || tn.includes(away)) {
        countryMatches[tn] = (countryMatches[tn] ?? 0) + 1;
      }
    }
  }
  const countriesWithMatches = AFRICA_FEATURED_TEAMS
    .filter((t) => countryMatches[normalizeForCountry(t.name)] > 0)
    .sort((a, b) => (countryMatches[normalizeForCountry(b.name)] ?? 0) - (countryMatches[normalizeForCountry(a.name)] ?? 0));

  // Si ?pays=XYZ est fourni, on filtre la liste des matchs (côté serveur)
  const selectedCountry = searchParams?.pays
    ? AFRICA_FEATURED_TEAMS.find((t) => normalizeForCountry(t.name) === normalizeForCountry(searchParams.pays!))
    : undefined;
  const filteredMatches: Match[] = selectedCountry
    ? matches.filter((m) => {
        const home = normalizeForCountry(m.home_team);
        const away = normalizeForCountry(m.away_team);
        const tn = normalizeForCountry(selectedCountry.name);
        return home.includes(tn) || away.includes(tn) || tn.includes(home) || tn.includes(away);
      })
    : matches;

  // Matchs à venir triés par date (preview)
  const upcomingAfrica = filteredMatches.slice(0, 10);

  return (
    <div className="theme-foot container space-y-8 py-8">
      {/* Bannière panafricaine */}
      <BannerRotator
        images={[
          "/banners/foot/01.jpg",
          "/banners/foot/02.jpg",
          "/banners/foot/03.jpg",
          "/banners/foot/04.jpg",
          "/banners/foot/05.jpg",
        ]}
        title="🌍 Sélections Africaines · CAN · Qualifs CDM · Amicaux"
        subtitle="Cameroun, Sénégal, Maroc, Nigeria, Côte d'Ivoire, Égypte, Ghana, Algérie, Tunisie : pronostique TOUTES les grandes nations du continent. Badges exclusifs par pays."
      />

      {/* En-tête */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="flex items-center gap-2 text-3xl font-black">
            <Globe2 className="h-7 w-7 text-amber-400" />
            <span className="text-gradient">PRONO Afrique</span>
          </h1>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            🌍 {matches.length} match{matches.length > 1 ? "s" : ""} africain{matches.length > 1 ? "s" : ""} à venir
          </span>
          {startedMatches.filter((s) => africanLeaguesSet.has(s.league)).length > 0 && (
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red-500" /> {startedMatches.filter((s) => africanLeaguesSet.has(s.league)).length} en direct / récents
            </span>
          )}
          {selectedCountry && (
            <a
              href="/prono-afrique"
              className="rounded-full border border-white/10 bg-card/60 px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-card"
            >
              {selectedCountry.flag} {selectedCountry.name} · ✕ Effacer
            </a>
          )}
        </div>
        <p className="max-w-2xl text-muted-foreground">
          CAN seniors, CAN U17/U20/U23, qualifications Coupe du Monde 2026 (zone Afrique)
          et matchs amicaux des <strong>sélections nationales africaines</strong>.
          Choisis ton pays dans la grille ci-dessous pour filtrer les matchs
          et débloquer son badge exclusif 🏅.
        </p>
      </header>

      {/* Compteurs par compétition (couleurs panafricaines) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AFRICA_LEAGUE_CODES.filter((c) => competitionCounts[c]).map((code) => {
          const meta = LEAGUES[code];
          return (
            <a
              key={code}
              href={`#${code}`}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 p-3 transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xs font-black text-white"
                style={{ background: meta.color }}
              >
                {meta.short}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{meta.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {competitionCounts[code]} à venir
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {/* Sélections vedettes — CLIC = filtre la liste */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Flag className="h-5 w-5 text-amber-400" /> Sélections nationales — choisis ton pays
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
          {AFRICA_FEATURED_TEAMS.map((t) => {
            const tn = normalizeForCountry(t.name);
            const count = countryMatches[tn] ?? 0;
            const isSelected = selectedCountry?.name === t.name;
            const hasMatches = count > 0;
            return (
              <a
                key={t.name}
                href={hasMatches ? `/prono-afrique?pays=${encodeURIComponent(t.name)}` : undefined}
                className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                  isSelected
                    ? "border-amber-500/80 bg-amber-500/15 shadow-lg"
                    : hasMatches
                    ? "border-white/10 bg-card/50 hover:border-amber-500/40 cursor-pointer"
                    : "border-white/5 bg-card/30 opacity-60"
                }`}
                style={!isSelected && hasMatches ? { borderColor: `${t.color}55` } : undefined}
              >
                <span className="text-3xl" aria-hidden>
                  {t.flag}
                </span>
                <span className="text-[11px] font-semibold leading-tight">{t.name}</span>
                {hasMatches && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-primary/90 px-1.5 text-[9px] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </section>

      {/* Matchs à venir (preview) */}
      {upcomingAfrica.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">
            📅 Prochains matchs africains
            {selectedCountry && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                · {selectedCountry.flag} {selectedCountry.name}
              </span>
            )}
          </h2>
          <ul className="space-y-2">
            {upcomingAfrica.slice(0, 6).map((m) => {
              const meta = LEAGUES[m.league as keyof typeof LEAGUES];
              const date = new Date(m.match_date ?? Date.now());
              const dateStr = date.toLocaleString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <li
                  key={m.id}
                  id={m.league}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-card/60 p-3"
                >
                  <span
                    className="grid h-9 w-12 shrink-0 place-items-center rounded-md text-[10px] font-black text-white"
                    style={{ background: meta?.color ?? "#eab308" }}
                  >
                    {meta?.short ?? m.league.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold">
                    {m.home_team} <span className="text-muted-foreground">vs</span> {m.away_team}
                  </span>
                  <span className="text-xs text-muted-foreground">{dateStr}</span>
                  <a
                    href={`#prono-${m.id}`}
                    className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500/25"
                  >
                    Pronostiquer →
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Pronos (composant existant, on lui passe la liste filtrée) */}
      <section id="pronos" className="space-y-3">
        <h2 className="text-xl font-bold">
          ⚽ {selectedCountry ? `Matchs ${selectedCountry.flag} ${selectedCountry.name}` : "Tous les matchs africains"}
        </h2>
        <PronosClient
          matches={filteredMatches}
          predictions={predictions}
          settings={settings}
          startedMatches={startedMatches.filter((s) => africanLeaguesSet.has(s.league))}
          adminPeek={adminPeek}
          participants={participants}
        />
      </section>

      {/* Footer SEO — POUR TOUTE LA DIASPORA AFRICAINE */}
      <footer className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm">
        <p className="font-semibold text-amber-400">🌍 Pour toute la diaspora africaine</p>
        <p className="text-muted-foreground">
          La diaspora africaine est massive en Europe (Allemagne, France, Italie, Belgique, Royaume-Uni, Espagne)
          et au-delà (Amérique du Nord, Golfe, Asie). Cette section te permet de suivre et pronostiquer
          chaque match des <strong>grandes nations du continent</strong> :
          Cameroun 🇨🇲, Sénégal 🇸🇳, Maroc 🇲🇦, Nigeria 🇳🇬, Côte d&apos;Ivoire 🇨🇮,
          Égypte 🇪🇬, Ghana 🇬🇭, Algérie 🇩🇿, Tunisie 🇹🇳, Mali 🇲🇱,
          Burkina Faso 🇧🇫, Guinée 🇬🇳, RD Congo 🇨🇩, Gabon 🇬🇦, Cap-Vert 🇨🇻.
        </p>
        <p className="text-muted-foreground">
          Les <strong>qualifications Coupe du Monde 2026</strong> (zone Afrique)
          offrent <strong>5 places directes + 1 barrage intercontinental</strong>.
          Chaque match compte, chaque pronostic te rapproche du badge 🏅
          de ton pays préféré !
        </p>
      </footer>
    </div>
  );
}
