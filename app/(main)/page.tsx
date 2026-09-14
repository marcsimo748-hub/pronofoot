import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { ServicesGrid } from "@/components/landing/ServicesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AboutSection } from "@/components/landing/AboutSection";
import { NextMatches } from "@/components/landing/NextMatches";
import { LiveTicker } from "@/components/scores/LiveTicker";
import { getUpcomingMatches } from "@/lib/services/football.service";
import { getLiveScores } from "@/lib/services/football.service";
import { getSettings } from "@/lib/services/settings.service";
import { getSessionUser } from "@/lib/supabase/server";
import { safeQuery } from "@/lib/utils";
import { FEATURED_TEAMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Landing publique — hero, ticker live, fonctionnalités, prochains matchs, barème.
 */
export default async function LandingPage() {
  const [live, upcoming, settings, user] = await Promise.all([
    getLiveScores(),
    getUpcomingMatches(12),
    getSettings(),
    getSessionUser(),
  ]);

  // Stats live (best-effort)
  const stats = await safeQuery(async () => {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    const [{ count: players }, { count: matches }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("matches").select("id", { count: "exact", head: true }).gte("match_date", new Date().toISOString()),
    ]);
    return { players: players ?? 0, matches: matches ?? 0 };
  }, { players: 0, matches: 629 });

  return (
    <div className="theme-foot">
      <Hero
        stats={{ ...stats, teams: FEATURED_TEAMS.length }}
        loggedIn={Boolean(user)}
      />
      <ServicesGrid />
      <LiveTicker initialLive={live} upcoming={upcoming} />
      <FeaturesGrid />
      <NextMatches matches={upcoming} />
      <HowItWorks />
      <AboutSection />

      {/* CTA final */}
      <section className="container pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-transparent to-primary/5 p-10 text-center">
          <h2 className="text-3xl font-black md:text-4xl">
            Prêt à dominer l'arène ? <span className="text-gradient">⚽</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Rejoins la communauté, pronostique les plus grands matchs d'Europe et grimpe dans le classement.
            Gratuit, pour toujours.
          </p>
          <div className="mt-6">
            <Link href={user ? "/pronos" : "/signup"}>
              <Button size="xl" variant="glow" className="gap-2">
                <Zap className="h-5 w-5" />
                {user ? "Faire mes pronostics" : "Créer mon compte gratuit"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
