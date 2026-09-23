"use client";

/**
 * Utilitaires partagés des outils admin :
 * appels API + upload direct vers Supabase Storage (évite la limite Vercel 4.5 Mo).
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Appel API admin (JSON) */
export async function adminFetch<T = unknown>(url: string, body?: unknown, method = "POST"): Promise<T> {
  const res = await fetch(url, {
    method: body ? method : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) throw new Error(json.error ?? `Erreur ${res.status}`);
  return json.data as T;
}

/** Upload d'un fichier vers Storage (bucket songs|media) — retourne l'URL publique */
export async function uploadToStorage(file: File, bucket: "songs" | "media", folder: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(safeName, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Upload impossible : ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(safeName);
  return data.publicUrl;
}

/** Enregistre une clé de réglages */
export function saveSetting(key: string, value: unknown) {
  return adminFetch("/api/admin/settings", { key, value });
}
