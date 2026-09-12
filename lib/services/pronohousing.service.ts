/**
 * Service PRONO-HOUSING — lettres de motivation logement (MODULE 4).
 * Table prono_housing_letters : 1 lettre sauvegardée par joueur
 * (données du formulaire + textes allemand/français édités).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfiles } from "@/lib/services/pronoprofile.service";

/** La lettre sauvegardée d'un joueur (null si aucune) */
export async function getHousingLetter(userId: string): Promise<{
  data: Record<string, unknown>;
  letter_de: string;
  letter_fr: string;
} | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prono_housing_letters")
      .select("data, letter_de, letter_fr")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as { data: Record<string, unknown>; letter_de: string; letter_fr: string };
  } catch {
    return null;
  }
}

/** Enregistre / met à jour la lettre (upsert, 1 par joueur) */
export async function saveHousingLetter(
  userId: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; code?: string }> {
  const clean = (v: unknown, max: number) => String(v ?? "").slice(0, max);
  const row = {
    user_id: userId,
    data:
      body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : {},
    letter_de: clean(body.letter_de, 8000),
    letter_fr: clean(body.letter_fr, 8000),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("prono_housing_letters")
      .upsert(row, { onConflict: "user_id" });
    if (error) {
      if (error.message.includes("exist") || error.code === "PGRST205") {
        return { ok: false, code: "no_table" };
      }
      return { ok: false, code: "db_error" };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/**
 * Pré-remplissage du générateur d'Anschreiben depuis les profils du joueur
 * (module 2) et sa session.
 */
export async function getHousingPrefill(
  userId: string,
  session: { email: string | null; username: string }
): Promise<Record<string, string>> {
  const profiles = await getProfiles(userId);
  const logement = profiles.find((p) => p.intention === "logement");
  const emploi = profiles.find((p) => p.intention === "emploi");
  const any = logement ?? emploi ?? profiles[0] ?? null;

  const prefill: Record<string, string> = {};
  if (any?.full_name) prefill.name = any.full_name;
  if (any?.phone) prefill.phone = any.phone;
  if (any?.city) prefill.city = logement?.housing_city || any.city;
  if (logement?.housing_city) prefill.city = logement.housing_city;
  if (logement?.budget_max) prefill.budget = String(logement.budget_max);
  if (any?.german_level && any.german_level !== "none") prefill.germanLevel = any.german_level;
  if (any?.other_languages) prefill.otherLanguages = any.other_languages;
  if (session.email) prefill.email = session.email;
  if (any?.birth_year) prefill.age = String(new Date().getFullYear() - any.birth_year);
  // profession : depuis le profil emploi ou la bio logement
  if (emploi?.job_title) prefill.profession = emploi.job_title;
  if (any?.country) prefill.country = any.country;
  return prefill;
}
