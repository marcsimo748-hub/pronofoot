/**
 * Service PRONOPROFIL — un compte, plusieurs profils selon le besoin.
 * Intentions : emploi, logement, visa, rencontre (table prono_profiles).
 * Le profil EMPLOI alimente aussi le PronoScore de PronoJob (bridge
 * automatique vers prono_job_prefs) et le générateur de CV.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PronoProfile, PronoIntention, ProfileExperience, ProfileEducation } from "@/lib/types";

export const INTENTIONS: { key: PronoIntention; label: string; icon: string; desc: string }[] = [
  { key: "emploi", label: "Emploi", icon: "💼", desc: "CV, expériences, diplômes, langues" },
  { key: "logement", label: "Logement", icon: "🏠", desc: "Ville, budget, type de logement" },
  { key: "visa", label: "Visa", icon: "🛂", desc: "Pays, visa visé, niveau d'allemand" },
  { key: "rencontre", label: "Rencontre", icon: "❤️", desc: "Recherche, ville, présentation" },
];

/** Tous les profils d'un joueur (1 par intention maximum) */
export async function getProfiles(userId: string): Promise<PronoProfile[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prono_profiles")
      .select("*")
      .eq("user_id", userId);
    if (error || !data) return [];
    return data as PronoProfile[];
  } catch {
    return [];
  }
}

/** Champs texte sécurisés (types + longueurs) pour l'upsert */
function sanitizeText(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max).trim();
}

function sanitizeExperiences(v: unknown): ProfileExperience[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 10)
    .map((e: any) => ({
      role: sanitizeText(e?.role, 120),
      company: sanitizeText(e?.company, 120),
      period: sanitizeText(e?.period, 60),
      description: sanitizeText(e?.description, 400),
    }))
    .filter((e) => e.role || e.company);
}

function sanitizeEducations(v: unknown): ProfileEducation[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 10)
    .map((e: any) => ({
      degree: sanitizeText(e?.degree, 150),
      school: sanitizeText(e?.school, 150),
      year: sanitizeText(e?.year, 40),
    }))
    .filter((e) => e.degree || e.school);
}

const LEVELS = ["none", "A1", "A2", "B1", "B2", "C1", "C2"];
const safeLevel = (v: unknown) => (LEVELS.includes(String(v)) ? String(v) : "none");

/** Enregistre (ou met à jour) le profil d'une intention. */
export async function upsertProfile(
  userId: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; code?: string; profile?: PronoProfile }> {
  const intention = String(body.intention ?? "");
  if (!["emploi", "logement", "visa", "rencontre"].includes(intention)) {
    return { ok: false, code: "invalid_intention" };
  }

  const row = {
    user_id: userId,
    intention: intention as PronoIntention,
    full_name: sanitizeText(body.full_name, 120),
    phone: sanitizeText(body.phone, 40),
    city: sanitizeText(body.city, 80),
    country: sanitizeText(body.country, 80),
    birth_year: Number.isFinite(Number(body.birth_year)) && body.birth_year
      ? Math.min(Math.max(Number(body.birth_year), 1900), new Date().getFullYear() - 14)
      : null,
    bio: sanitizeText(body.bio, 1500),
    job_title: sanitizeText(body.job_title, 120),
    skills: sanitizeText(body.skills, 400),
    experiences: sanitizeExperiences(body.experiences),
    educations: sanitizeEducations(body.educations),
    german_level: safeLevel(body.german_level),
    english_level: safeLevel(body.english_level),
    other_languages: sanitizeText(body.other_languages, 200),
    linkedin_url: sanitizeText(body.linkedin_url, 200),
    target_country: sanitizeText(body.target_country, 80),
    visa_type: sanitizeText(body.visa_type, 80),
    blocked_note: sanitizeText(body.blocked_note, 1000),
    housing_city: sanitizeText(body.housing_city, 80),
    housing_type: sanitizeText(body.housing_type, 40),
    budget_max: Number.isFinite(Number(body.budget_max)) && Number(body.budget_max) > 0
      ? Math.min(Number(body.budget_max), 99999)
      : null,
    age_range: sanitizeText(body.age_range, 40),
    looking_for: sanitizeText(body.looking_for, 80),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prono_profiles")
      .upsert(row, { onConflict: "user_id,intention" })
      .select()
      .single();

    if (error) {
      if (error.message.includes("exist") || error.code === "PGRST205") {
        return { ok: false, code: "no_table" };
      }
      return { ok: false, code: "db_error" };
    }

    // 🎯 Bridge : le profil EMPLOI alimente automatiquement le PronoScore de PronoJob
    if (intention === "emploi") {
      await bridgeJobPrefs(userId, row).catch(() => {});
    }

    return { ok: true, profile: data as PronoProfile };
  } catch {
    return { ok: false, code: "exception" };
  }
}

/** Synchronise prono_job_prefs (PronoScore) depuis le profil emploi. Best effort. */
async function bridgeJobPrefs(
  userId: string,
  profile: { job_title: string; skills: string; city: string; german_level: string; english_level: string }
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const keywords = [profile.job_title, ...profile.skills.split(/[,;]/)]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ")
    .slice(0, 300);

  await supabase.from("prono_job_prefs").upsert(
    {
      user_id: userId,
      keywords,
      city: profile.city.slice(0, 80),
      remote_only: false,
      german_level: safeLevel(profile.german_level),
      english_level: safeLevel(profile.english_level),
      contract: "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}
