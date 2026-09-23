/**
 * Service des réglages du site (table `site_settings`, JSONB par clé).
 * Lecture publique + cache mémoire court ; écriture réservée aux routes admin.
 */

import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeQuery } from "@/lib/utils";

type SettingsKey = keyof SiteSettings;

// Cache mémoire 20s pour éviter de marteler Supabase à chaque rendu
let cache: { data: SiteSettings; at: number } | null = null;
const CACHE_TTL = 20_000;

/** Fusionne la table avec les valeurs par défaut (jamais d'exception) */
export async function getSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data;

  const merged: SiteSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  const rows = await safeQuery(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data } = await supabase.from("site_settings").select("key, value");
      return data ?? [];
    },
    [] as { key: string; value: unknown }[]
  );

  for (const row of rows) {
    if (row.value && typeof row.value === "object") {
      const k = row.key as SettingsKey;
      if (k in merged) {
        // Object.assign typed-bypass : la valeur de la DB est validée côté admin
        Object.assign(merged[k] as unknown as object, row.value as unknown as object);
      }
    }
  }

  cache = { data: merged, at: Date.now() };
  return merged;
}

/** Invalide le cache (après une écriture admin) */
export function invalidateSettingsCache() {
  cache = null;
}

/** Écrit une clé de réglages (service role uniquement) */
export async function updateSetting(key: SettingsKey, value: Record<string, unknown>) {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) throw new Error("Service role non configuré");

  // Fusionne avec l'existant pour ne pas écraser les autres champs de la clé
  const { data: existing } = await admin.from("site_settings").select("value").eq("key", key).single();
  const existingValue = (existing?.value ?? {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...existingValue, ...value };

  const { error } = await admin
    .from("site_settings")
    .upsert({ key, value: merged, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) throw error;
  invalidateSettingsCache();
  return merged;
}
