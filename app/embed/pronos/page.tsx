import { getUpcomingMatches } from "@/lib/services/football.service";
import Link from "next/link";

/**
 * /embed/pronos — widget embarquable (iframe) pour d'autres sites.
 *
 * Usage :
 *   <iframe src="https://pronofoot-phi.vercel.app/embed/pronos?league=BUNDESLIGA"
 *           width="100%" height="480" frameborder="0" style="border:0"></iframe>
 *
 * Affiche les 5 prochains matchs d'un championnat avec un bouton "pronostiquer
 * sur PRONO" qui ouvre la home dans un nouvel onglet. Backlink garanti + visibilité.
 *
 * Paramètres :
 *   ?league=BUNDESLIGA|LIGUE_1|PREMIER_LEAGUE|LIGA|SERIE_A (defaut BUNDESLIGA)
 *   &limit=5 (defaut 5, max 10)
 *   &theme=dark|light (defaut dark)
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";

const LEAGUES: Record<string, { name: string; color: string }> = {
  BUNDESLIGA: { name: "Bundesliga", color: "#d20515" },
  PREMIER_LEAGUE: { name: "Premier League", color: "#3d195b" },
  LIGUE_1: { name: "Ligue 1", color: "#091c3e" },
  LIGA: { name: "La Liga", color: "#ee8707" },
  SERIE_A: { name: "Serie A", color: "#008fd7" },
};

export const dynamic = "force-dynamic";
export const metadata = {
  title: "PRONO Widget",
  robots: { index: false, follow: false },
};

export default async function PronosEmbedWidget({
  searchParams,
}: {
  searchParams?: { league?: string; limit?: string; theme?: "dark" | "light" };
}) {
  const league = (searchParams?.league ?? "BUNDESLIGA").toUpperCase();
  const limit = Math.min(10, Math.max(1, Number(searchParams?.limit ?? 5)));
  const theme = searchParams?.theme === "light" ? "light" : "dark";

  const allMatches = await getUpcomingMatches(limit * 2);
  const matches = allMatches
    .filter((m) => (league === "ALL" ? true : m.league === league))
    .slice(0, limit);

  const l = LEAGUES[league] ?? { name: league, color: "#10b981" };
  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#0a0a0f" : "#ffffff",
    card: isDark ? "#18181b" : "#f4f4f5",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#fafafa" : "#18181b",
    muted: isDark ? "#a1a1aa" : "#71717a",
    primary: l.color,
    cta: "#10b981",
  };

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        background: colors.bg,
        color: colors.text,
        minHeight: 400,
        padding: 16,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: `2px solid ${colors.primary}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: colors.primary,
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{l.name}</span>
        </div>
        <span style={{ fontSize: 11, color: colors.muted }}>
          Powered by <strong style={{ color: colors.cta }}>PRONO</strong>
        </span>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {matches.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: colors.muted,
              fontSize: 13,
            }}
          >
            Aucun match à venir.
          </div>
        ) : (
          matches.map((m) => {
            const date = new Date(m.match_date ?? Date.now());
            const dateStr = date.toLocaleString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={m.id}
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: colors.muted,
                      marginBottom: 4,
                    }}
                  >
                    {dateStr}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.home_team} <span style={{ color: colors.muted }}>vs</span> {m.away_team}
                  </div>
                </div>
                <a
                  href={`${SITE_URL}/pronos`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: colors.cta,
                    color: "#fff",
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Pronostiquer ⚽
                </a>
              </div>
            );
          })
        )}
      </div>

      <footer
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
          color: colors.muted,
        }}
      >
        <span>Widget embarquable · PRONO</span>
        <a
          href={`${SITE_URL}?ref=embed`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: colors.cta, textDecoration: "none", fontWeight: 600 }}
        >
          Découvrir PRONO →
        </a>
      </footer>
    </div>
  );
}
