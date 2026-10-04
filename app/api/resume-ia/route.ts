// app/api/resume-ia/route.ts
// =====================================================================
// API qui génère un résumé IA du jour (3 phrases + 5 matchs clés)
// Cache 6h via next: { revalidate: 21600 } côté composant.
// =====================================================================

import { NextResponse } from "next/server";
import { chat } from "@/lib/services/ai.service";
import { getAllCommunityPredictions } from "@/lib/services/predictions.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ResumePayload {
  intro: string;
  matches: Array<{
    home: string;
    away: string;
    league: string;
    date: string;
    blurb: string;
  }>;
  callToAction: string;
}

const SYSTEM_PROMPT = `Tu es l'assistant éditorial de PRONO, site de pronostics sportifs.
Tu écris pour la communauté africaine et sa diaspora (Cameroun, Sénégal, RDC, Côte d'Ivoire, Maroc, etc.).
Style : allschool classique et moderne, pro, accessible, jamais condescendant.

MISSION : produire un résumé du jour en français en JSON strict :

{
  "intro": "Une phrase d'accroche (max 180 caractères). Ton : 'Voici ce qu'il faut surveiller aujourd'hui...' ou 'La journée s'annonce explosive avec X matchs africains au programme'.",
  "matches": [
    {
      "home": "équipe domicile",
      "away": "équipe extérieur",
      "league": "nom lisible du championnat",
      "date": "ISO 8601",
      "blurb": "1 phrase (max 110 caractères) sur l'enjeu ou l'ambiance (pas le score)"
    }
  ],
  "callToAction": "Une phrase d'appel à l'action invitant à pronostiquer sur /pronos ou /prono-afrique."
}

Tu dois sélectionner les 5 matchs les plus pertinents : priorité aux matchs africains, matchs de CAN, gros chocs européens visibles par la diaspora. Si aucun match africain, mets-en quand même 5 des plus gros enjeux du jour.

RÉPONDS UNIQUEMENT en JSON strict. Pas de markdown, pas d'explication.`;

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Récupère les matchs des 36 prochaines heures
    const now = new Date();
    const horizon = new Date(now.getTime() + 36 * 60 * 60 * 1000);
    const { data: upcoming, error: matchErr } = await supabase
      .from("matches")
      .select("id, league, match_date, home_team, away_team, status")
      .gte("match_date", now.toISOString())
      .lte("match_date", horizon.toISOString())
      .order("match_date")
      .limit(40);
    if (matchErr) {
      return NextResponse.json({ error: matchErr.message }, { status: 500 });
    }

    if (!upcoming || upcoming.length === 0) {
      return NextResponse.json({
        intro: "Aucun match africain au programme dans les 36 prochaines heures.",
        matches: [],
        callToAction: "Reviens demain pour de nouveaux pronostics !",
        generatedAt: new Date().toISOString(),
      } satisfies ResumePayload & { generatedAt: string });
    }

    // Construit la liste condensée pour le prompt
    const matchesList = upcoming
      .slice(0, 20)
      .map(
        (m, i) =>
          `${i + 1}. ${m.home_team} - ${m.away_team} (${m.league}, ${new Date(m.match_date).toISOString()})`
      )
      .join("\n");

    const prompt = `Voici les ${Math.min(upcoming.length, 20)} prochains matchs des 36 prochaines heures sur PRONO :\n\n${matchesList}\n\nProduis le JSON du résumé du jour en sélectionnant les 5 plus pertinents (priorité : matchs africains, CAN, gros chocs).`;

    const { reply, provider } = await chat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      undefined
    );

    // Parse le JSON retourné par l'IA (au cas où elle ajoute du blabla)
    let parsed: ResumePayload;
    try {
      const cleaned = reply
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "");
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback : génère un résumé simple sans IA
      const top = upcoming.slice(0, 5);
      parsed = {
        intro: `Voici les ${top.length} matchs à surveiller aujourd'hui sur PRONO.`,
        matches: top.map((m) => ({
          home: m.home_team,
          away: m.away_team,
          league: m.league,
          date: m.match_date,
          blurb: "Match à suivre de près · tous les pronos sont sur /pronos.",
        })),
        callToAction: "Fais ton pronostic sur /pronos avant le coup d'envoi.",
      };
    }

    // En-tête de cache côté composant (force-dynamic ici, revalidation gérée par le client)
    return NextResponse.json(
      {
        ...parsed,
        provider,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}