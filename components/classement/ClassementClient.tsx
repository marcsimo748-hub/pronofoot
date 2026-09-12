"use client";

/**
 * Onglets du classement : Général / Championnat / Mensuel / Groupes.
 * Les classements par championnat se chargent à la demande via RPC Supabase.
 */

import { useEffect, useState } from "react";
import { Trophy, CalendarDays, Medal, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from "./LeaderboardTable";
import { GroupsPanel } from "./GroupsPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LEAGUES, LEAGUE_CODES } from "@/lib/constants";
import type { StandingRow } from "@/lib/types";

export function ClassementClient({
  initial,
  currentUserId,
  loggedIn,
}: {
  initial: Record<string, StandingRow[]>;
  currentUserId?: string;
  loggedIn: boolean;
}) {
  const [leagueTab, setLeagueTab] = useState(LEAGUE_CODES[0]);
  const [leagueRows, setLeagueRows] = useState<Record<string, StandingRow[]>>({});

  // Charge le classement du championnat sélectionné (une seule fois par ligue)
  useEffect(() => {
    if (leagueRows[leagueTab]) return;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.rpc("get_league_standings", { p_league: leagueTab });
        setLeagueRows((r) => ({ ...r, [leagueTab]: (data ?? []) as StandingRow[] }));
      } catch {
        setLeagueRows((r) => ({ ...r, [leagueTab]: [] }));
      }
    })();
  }, [leagueTab, leagueRows]);

  return (
    <Tabs defaultValue="general">
      <TabsList className="flex-wrap">
        <TabsTrigger value="general" className="gap-1.5"><Trophy className="h-3.5 w-3.5" /> Général</TabsTrigger>
        <TabsTrigger value="league" className="gap-1.5"><Medal className="h-3.5 w-3.5" /> Par championnat</TabsTrigger>
        <TabsTrigger value="monthly" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Mensuel</TabsTrigger>
        <TabsTrigger value="groups" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Entre amis</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-4">
        <LeaderboardTable rows={initial.general ?? []} currentUserId={currentUserId} />
      </TabsContent>

      <TabsContent value="league" className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {LEAGUE_CODES.map((code) => (
            <button
              key={code}
              onClick={() => setLeagueTab(code)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                leagueTab === code ? "border-transparent text-white" : "border-white/10 text-muted-foreground"
              }`}
              style={leagueTab === code ? { backgroundColor: LEAGUES[code].color } : undefined}
            >
              {LEAGUES[code].name}
            </button>
          ))}
        </div>
        <LeaderboardTable rows={leagueRows[leagueTab] ?? []} currentUserId={currentUserId} showPreds />
      </TabsContent>

      <TabsContent value="monthly" className="mt-4">
        <LeaderboardTable rows={initial.monthly ?? []} currentUserId={currentUserId} showPreds />
      </TabsContent>

      <TabsContent value="groups" className="mt-4">
        {loggedIn ? (
          <GroupsPanel currentUserId={currentUserId} />
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Connecte-toi pour créer ou rejoindre un groupe d'amis 🔑
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
