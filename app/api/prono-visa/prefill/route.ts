import { getSessionUser } from "@/lib/supabase/server";
import { getVisaHistory, getVisaPrefill } from "@/lib/services/pronovisa.service";

/**
 * GET /api/prono-visa/prefill
 * Renvoie l'historique des simulations + le préremplissage du dernier visa
 * de l'utilisateur courant. Si non connecté : { ok:false, code:"anon" }.
 *
 * La page /prono-visa est désormais un composant client (parcours trilingue),
 * donc on passe par cette route au lieu d'appeler les services côté serveur.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ ok: false, code: "anon" });
  }
  try {
    const [history, prefill] = await Promise.all([
      getVisaHistory(user.id),
      getVisaPrefill(user.id),
    ]);
    return Response.json({
      ok: true,
      data: {
        history: history ?? [],
        prefill: prefill ?? {},
      },
    });
  } catch (e) {
    return Response.json({ ok: false, code: "error", error: String(e) });
  }
}
