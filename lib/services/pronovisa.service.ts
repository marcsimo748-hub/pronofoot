/**
 * Service PRONOVISA — historique des simulations du calculateur (MODULE 3).
 * Table prono_visa_checks : chaque joueur peut sauvegarder ses simulations
 * et suivre ses progrès. Le score reste une ESTIMATION.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfiles } from "@/lib/services/pronoprofile.service";

const VISA_TYPES = ["ausbildung", "studium", "chancenkarte", "travail", "tourisme"];

export interface VisaCheckRow {
  id: string;
  visa_type: string;
  score: number;
  created_at: string;
}

/** Historique des simulations d'un joueur (les 5 dernières) */
export async function getVisaHistory(userId: string): Promise<VisaCheckRow[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prono_visa_checks")
      .select("id, visa_type, score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error || !data) return [];
    return data as VisaCheckRow[];
  } catch {
    return [];
  }
}

/** Enregistre une simulation (max 20 conservées par joueur) */
export async function saveVisaCheck(
  userId: string,
  body: { visa_type?: string; answers?: unknown; score?: number }
): Promise<{ ok: boolean; code?: string; data?: VisaCheckRow }> {
  const visaType = VISA_TYPES.includes(String(body.visa_type)) ? String(body.visa_type) : "";
  const score = Math.max(0, Math.min(100, Math.round(Number(body.score) || 0)));
  const answers =
    body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? body.answers
      : {};

  try {
    const supabase = createSupabaseServerClient();

    // Ménage : on garde les 20 dernières simulations
    const { data: old } = await supabase
      .from("prono_visa_checks")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(19, 1000);
    if (old && old.length > 0) {
      await supabase
        .from("prono_visa_checks")
        .delete()
        .in("id", old.map((o) => o.id));
    }

    const { data, error } = await supabase
      .from("prono_visa_checks")
      .insert({ user_id: userId, visa_type: visaType, answers, score })
      .select("id, visa_type, score, created_at")
      .single();

    if (error) {
      if (error.message.includes("exist") || error.code === "PGRST205") {
        return { ok: false, code: "no_table" };
      }
      return { ok: false, code: "db_error" };
    }
    return { ok: true, data: data as VisaCheckRow };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/**
 * Pré-remplissage du questionnaire depuis le profil VISA du joueur
 * (MODULE 2 : prono_profiles, intention "visa").
 */
export async function getVisaPrefill(userId: string): Promise<{
  german?: string;
  visaType?: string;
  age?: string;
}> {
  const profiles = await getProfiles(userId);
  const visa = profiles.find((p) => p.intention === "visa");
  if (!visa) return {};

  const german = ["none", "A1", "A2", "B1", "B2", "C1", "C2"].includes(visa.german_level)
    ? (visa.german_level === "C2" ? "C1" : visa.german_level)
    : undefined;

  // mapping libellé profil → clé questionnaire
  const visaTypeMap: Record<string, string> = {
    "Ausbildung (formation pro)": "ausbildung",
    "Studium (études)": "studium",
    "Chancenkarte (carte opportunité)": "chancenkarte",
    "Visa de travail": "travail",
    "Visa touriste / visite": "tourisme",
  };
  const visaType = visa.visa_type ? visaMap(visa.visa_type, visaTypeMap) : undefined;

  // année de naissance → tranche d'âge
  let age: string | undefined;
  if (visa.birth_year) {
    const years = new Date().getFullYear() - visa.birth_year;
    age =
      years < 18 ? "-18"
      : years <= 24 ? "18-24"
      : years <= 30 ? "25-30"
      : years <= 35 ? "31-35"
      : years <= 40 ? "36-40"
      : "40+";
  }

  const prefill: { german?: string; visaType?: string; age?: string } = {};
  if (german) prefill.german = german;
  if (visaType) prefill.visaType = visaType;
  if (age) prefill.age = age;
  return prefill;
}

function visaMap(label: string, map: Record<string, string>): string | undefined {
  for (const [k, v] of Object.entries(map)) {
    if (label.toLowerCase().includes(k.toLowerCase().slice(0, 10))) return v;
  }
  return undefined;
}
