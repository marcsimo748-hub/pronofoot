/**
 * Service PRONOJOB — agrégateur d'offres d'emploi légal (module /prono-job).
 *
 * Sources (API officielles et gratuites, AUCUN scraping) :
 *  1. Arbeitnow  — jobs Allemagne/Europe, SANS CLÉ        → https://www.arbeitnow.com/api
 *  2. Remotive   — jobs en télétravail, SANS CLÉ           → https://remotive.com/api
 *  3. Adzuna     — agrégateur monde (clés gratuites optionnelles)
 *  4. JSearch    — Indeed/LinkedIn agrégé via RapidAPI (clé optionnelle)
 *
 * ⚖️ Respect des sources : on n'affiche/jamais stocke la description complète —
 * uniquement titre + extrait court (≤ 280 caractères) + lien vers l'offre originale.
 *
 * Deux modes de lecture :
 *  - "db"   : offres en cache dans la table prono_jobs (remplie par /api/cron/jobs toutes les 6 h)
 *  - "live" : si la table est vide/inexistante → lecture directe des API (cache mémoire 10 min)
 */

import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PronoJob, JobPrefs, JobFilters } from "@/lib/types";

const PAGE_SIZE = 20;
const MAX_DESC = 280;          // longueur max de l'extrait (conformité légale)
const STALE_DAYS = 30;         // purge des offres de plus de 30 jours
const LIVE_CACHE_MS = 10 * 60 * 1000; // cache mémoire du mode live

// ============================================================
// Utilitaires
// ============================================================

/** fetch JSON avec timeout (évite de bloquer le cron ou la page) */
async function fetchJson<T = any>(url: string, init?: RequestInit, timeoutMs = 15000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} sur ${new URL(url).host}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Nettoie une description d'offre : certaines sources (Arbeitnow, Adzuna…)
 * envoient du HTML échappé une ou deux fois. On décode PUIS on retire les
 * balises, en plusieurs passes jusqu'à stabilité, pour n'avoir que du texte.
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&mdash;/gi, ", ")
    .replace(/&ndash;/gi, "-")
    .replace(/&hellip;/gi, "…")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/** Retire les balises : les fermetures de blocs deviennent des espaces, le reste disparaît */
function stripTags(s: string): string {
  return s
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr|td|table|section|article|blockquote)>|<br\s*\/?>/gi, " ")
    .replace(/<\/?[a-zA-Z!][^>]*>/g, "");
}

/** Passe complète : décoder puis retirer les balises */
function onePass(s: string): string {
  return stripTags(decodeEntities(s));
}

/** Nettoie entièrement (multi-passes) puis tronque proprement */
function htmlToExcerpt(html: string | null | undefined): string | null {
  if (!html) return null;
  let text = html;
  for (let i = 0; i < 3; i++) {
    const pass = onePass(text);
    if (pass === text) break;
    text = pass;
  }
  text = text
    .replace(/\s+/g, " ")
    .replace(/:\s*:/g, ":")
    .trim();
  if (!text) return null;
  return text.length <= MAX_DESC ? text : text.slice(0, MAX_DESC - 1).trimEnd() + "…";
}

/** Re-nettoie un extrait déjà stocké en cache (correction des anciennes lignes) */
function recleanExcerpt(s: string | null | undefined): string | null {
  if (!s) return null;
  return htmlToExcerpt(s) ?? s;
}

/** Normalise n'importe quel libellé de contrat en catégorie stable */
function normalizeContract(raw: string | string[] | null | undefined): string {
  const s = (Array.isArray(raw) ? raw.join(" ") : raw ?? "").toLowerCase();
  if (!s) return "other";
  if (/intern|student|apprentice|ausbildung|working student|werkstudent/.test(s)) return "internship";
  if (/freelance/.test(s)) return "freelance";
  if (/part|mini.?job|teilzeit/.test(s) && !/full/.test(s)) return "part-time";
  if (/full|vollzeit|permanent/.test(s)) return "full-time";
  if (/contract|fixed|temp|befristet|cdd/.test(s)) return "contract";
  return "other";
}

/** Devine le pays depuis une localisation libre (ville, région, pays mélangés) */
function classifyCountry(location: string | null | undefined, remote: boolean): string | null {
  const s = (location ?? "").toLowerCase();
  if (!s || remote) {
    if (remote) return "Télétravail";
    return null;
  }
  if (/remote|anywhere|worldwide/.test(s)) return "Télétravail";
  if (/london|manchester|birmingham|united kingdom|england|scotland|wales|\buk\b|leeds|liverpool|glasgow/.test(s)) return "Royaume-Uni";
  if (/france|paris|lyon|marseille|toulouse|bordeaux|lille|nantes|nice|strasbourg|rennes|arrondissement/.test(s)) return "France";
  if (/deutschland|germany|berlin|münchen|munich|hamburg|köln|cologne|frankfurt|stuttgart|düsseldorf|dortmund|essen|leipzig|bremen|dresden|hannover|hannover|nürnberg|nuremberg|heidelberg|mainz|kiel|saarbrücken/.test(s)) return "Allemagne";
  if (/österreich|austria|wien\b|vienna|graz|linz|salzburg|innsbruck/.test(s)) return "Autriche";
  if (/schweiz|switzerland|zürich|zurich|genf|geneva|basel|bern|lausanne|winterthur/.test(s)) return "Suisse";
  if (/netherlands|amsterdam|rotterdam|den haag|utrecht|eindhoven|groningen/.test(s)) return "Pays-Bas";
  if (/españa|spain|madrid|barcelona|valencia|sevilla|malaga|bilbao/.test(s)) return "Espagne";
  if (/italia|italy|milano|milan|roma|rome|torino|napoli|bologna/.test(s)) return "Italie";
  if (/belgium|belgique|belgien|brussels|bruxelles|antwerp|antwerpen|gent|liège/.test(s)) return "Belgique";
  if (/luxembourg/.test(s)) return "Luxembourg";
  if (/poland|polska|warszawa|warsaw|kraków|krakow/.test(s)) return "Pologne";
  if (/portugal|lisboa|lisbon|porto/.test(s)) return "Portugal";
  if (/ireland|dublin/.test(s)) return "Irlande";
  if (/sweden|stockholm|gothenburg/.test(s)) return "Suède";
  if (/denmark|copenhagen|københavn/.test(s)) return "Danemark";
  return "Europe / Monde";
}

/** Extrait la ville (première partie avant la virgule) */
function extractCity(location: string | null | undefined): string | null {
  const s = (location ?? "").split(",")[0].trim();
  return s.length > 0 && s.length <= 60 ? s : null;
}

// ============================================================
// SOURCE 1 — Arbeitnow (Allemagne/Europe, sans clé)
// ============================================================

async function fetchArbeitnow(): Promise<InsertableJob[]> {
  const json = await fetchJson<{ data?: ArbeitnowJob[] }>("https://www.arbeitnow.com/api/job-board-api");
  return (json.data ?? []).map((j) => ({
    source: "arbeitnow",
    source_id: j.slug ?? `${j.company_name}-${j.title}`.slice(0, 120),
    title: j.title ?? "Offre",
    company: j.company_name ?? "",
    city: extractCity(j.location),
    country: classifyCountry(j.location, Boolean(j.remote)),
    contract_type: normalizeContract(j.job_types),
    remote: Boolean(j.remote),
    description_short: htmlToExcerpt(j.description),
    url: j.url ?? `https://www.arbeitnow.com/${j.slug ?? ""}`,
    salary_min: null,
    salary_max: null,
    published_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
  }));
}

interface ArbeitnowJob {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  job_types?: string[];
  location?: string;
  created_at?: number; // timestamp Unix (secondes)
}

// ============================================================
// SOURCE 2 — Remotive (télétravail, sans clé)
// ============================================================

async function fetchRemotive(): Promise<InsertableJob[]> {
  const json = await fetchJson<{ jobs?: RemotiveJob[] }>("https://remotive.com/api/remote-jobs?limit=100");
  return (json.jobs ?? []).map((j) => ({
    source: "remotive",
    source_id: String(j.id ?? j.url),
    title: j.title ?? "Offre",
    company: j.company_name ?? "",
    city: null,
    country: classifyCountry(j.candidate_required_location, true),
    contract_type: normalizeContract(j.job_type),
    remote: true,
    description_short: htmlToExcerpt(j.description),
    url: j.url ?? "https://remotive.com/remote-jobs",
    salary_min: null,
    salary_max: null,
    published_at: j.publication_date ?? null,
  }));
}

interface RemotiveJob {
  id?: number | string;
  url?: string;
  title?: string;
  company_name?: string;
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  description?: string;
}

// ============================================================
// SOURCE 3 — Adzuna (clés gratuites optionnelles)
// ============================================================

async function fetchAdzuna(): Promise<InsertableJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return []; // pas de clés → source désactivée

  const countries = (process.env.ADZUNA_COUNTRIES || "de,fr")
    .split(",").map((c) => c.trim()).filter(Boolean);

  const results = await Promise.allSettled(
    countries.map((c) =>
      fetchJson<{ results?: AdzunaJob[] }>(
        `https://api.adzuna.com/v1/api/jobs/${c}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=40&content-type=application/json`
      )
    )
  );

  return results
    .filter((r): r is PromiseFulfilledResult<{ results?: AdzunaJob[] }> => r.status === "fulfilled")
    .flatMap((r) =>
      (r.value.results ?? []).map((j) => ({
        source: "adzuna",
        source_id: String(j.id),
        title: j.title ?? "Offre",
        company: j.company?.display_name ?? "",
        city: extractCity(j.location?.display_name),
        country: classifyCountry(j.location?.display_name, false),
        contract_type: normalizeContract(j.contract_time),
        remote: /remote|home ?office|télétravail/i.test(`${j.title ?? ""} ${j.location?.display_name ?? ""}`),
        description_short: htmlToExcerpt(j.description),
        url: j.redirect_url ?? "https://www.adzuna.com",
        salary_min: j.salary_min ?? null,
        salary_max: j.salary_max ?? null,
        published_at: j.created ?? null,
      }))
    );
}

interface AdzunaJob {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  contract_time?: string;
  created?: string;
  salary_min?: number | null;
  salary_max?: number | null;
}

// ============================================================
// SOURCE 4 — JSearch / RapidAPI (Indeed + LinkedIn agrégés, clé optionnelle)
// ============================================================

async function fetchJsearch(): Promise<InsertableJob[]> {
  const key = process.env.RAPIDAPI_KEY ?? process.env.JSEARCH_API_KEY;
  if (!key) return []; // pas de clé → source désactivée

  const query = process.env.JSEARCH_QUERY || "jobs in germany";
  const json = await fetchJson<{ data?: JsearchJob[] }>(
    `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1`,
    { headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" } }
  );

  return (json.data ?? []).map((j) => ({
    source: "jsearch",
    source_id: String(j.job_id ?? j.job_apply_link),
    title: j.job_title ?? "Offre",
    company: j.employer_name ?? "",
    city: j.job_city ?? null,
    country: j.job_country === "Germany" ? "Allemagne" : (j.job_country ?? null),
    contract_type: normalizeContract(j.job_employment_type),
    remote: /remote|hybrid/i.test(`${j.job_title ?? ""} ${j.job_description ?? ""}`),
    description_short: htmlToExcerpt(j.job_description),
    url: j.job_apply_link ?? "https://rapidapi.com/letscodelimited/api/jsearch",
    salary_min: null,
    salary_max: null,
    published_at: j.job_posted_at_datetime_utc ?? null,
  }));
}

interface JsearchJob {
  job_id?: string;
  employer_name?: string;
  job_title?: string;
  job_apply_link?: string;
  job_city?: string | null;
  job_country?: string | null;
  job_employment_type?: string;
  job_description?: string;
  job_posted_at_datetime_utc?: string;
}

// ============================================================
// Synchronisation (cron /api/cron/jobs — toutes les 6 h)
// ============================================================

interface InsertableJob {
  source: string;
  source_id: string;
  title: string;
  company: string;
  city: string | null;
  country: string | null;
  contract_type: string;
  remote: boolean;
  description_short: string | null;
  url: string;
  salary_min: number | null;
  salary_max: number | null;
  published_at: string | null;
}

/** Lance toutes les sources actives et met le cache DB à jour (admin/service_role). */
export async function syncJobs(): Promise<{ ok: boolean; fetched: number; upserted: number; sources: string[]; error?: string }> {
  const settled = await Promise.allSettled([fetchArbeitnow(), fetchRemotive(), fetchAdzuna(), fetchJsearch()]);

  // Dédoublonnage par URL (une même offre peut venir de 2 sources)
  const seen = new Set<string>();
  const all: InsertableJob[] = [];
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const job of r.value) {
      const key = job.url.replace(/[#?].*$/, "");
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(job);
    }
  }
  const sources = [...new Set(all.map((j) => j.source))];

  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { ok: false, fetched: all.length, upserted: 0, sources, error: "no_supabase_admin" };

  // Upsert par lots de 100
  let upserted = 0;
  for (let i = 0; i < all.length; i += 100) {
    const chunk = all.slice(i, i + 100);
    const { error } = await admin.from("prono_jobs").upsert(chunk, { onConflict: "source,source_id" });
    if (error) throw new Error(error.message);
    upserted += chunk.length;
  }

  // Purge : offres de plus de 30 jours (le site reste léger et à jour)
  const cutoff = new Date(Date.now() - STALE_DAYS * 86400000).toISOString();
  await admin.from("prono_jobs").delete().lt("published_at", cutoff);

  return { ok: true, fetched: all.length, upserted, sources };
}

// ============================================================
// Lecture des offres : DB d'abord, sinon mode live
// ============================================================

let dbReadyCache: boolean | null = null; // tables 004 créées ?
let lastEnsure = 0;
let liveCache: { at: number; jobs: PronoJob[] } | null = null;

/** Les tables prono_ existent-elles ? (sonde légère, mémoisée) */
export async function probeDbReady(): Promise<boolean> {
  if (dbReadyCache !== null) return dbReadyCache;
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("prono_jobs").select("id").limit(1);
    dbReadyCache = !error;
  } catch {
    dbReadyCache = false;
  }
  return dbReadyCache;
}

export function isDbReady(): boolean {
  return dbReadyCache === true;
}

/** Appelé par la page : si la table est vide → 1ᵉʳ remplissage automatique (best effort) */
export async function ensureJobsSynced(): Promise<void> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return;
  if (Date.now() - lastEnsure < 20 * 60 * 1000) return; // max 1 tentative / 20 min
  lastEnsure = Date.now();
  try {
    const { count, error } = await admin.from("prono_jobs").select("id", { count: "exact", head: true });
    dbReadyCache = !error;
    if (error || (count ?? 0) > 0) return;
    // Table vide → premier remplissage (timeout 15 s pour ne pas bloquer la page)
    await Promise.race([syncJobs(), new Promise((r) => setTimeout(r, 15000))]);
  } catch {
    dbReadyCache = false;
  }
}

/** Offres en direct (Arbeitnow + Remotive + sources à clés), cache mémoire 10 min */
async function fetchLiveJobs(): Promise<PronoJob[]> {
  if (liveCache && Date.now() - liveCache.at < LIVE_CACHE_MS) return liveCache.jobs;
  const settled = await Promise.allSettled([fetchArbeitnow(), fetchRemotive(), fetchAdzuna(), fetchJsearch()]);
  const seen = new Set<string>();
  const jobs: PronoJob[] = [];
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const j of r.value) {
      const key = j.url.replace(/[#?].*$/, "");
      if (seen.has(key)) continue;
      seen.add(key);
      jobs.push({ id: `${j.source}-${j.source_id}`, ...j });
    }
  }
  jobs.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  liveCache = { at: Date.now(), jobs };
  return jobs;
}

/** Lit les offres (cache DB si dispo, sinon live) + filtres + pagination. */
export async function getJobs(
  filters: JobFilters
): Promise<{ jobs: PronoJob[]; total: number; mode: "db" | "live" }> {
  const page = Math.max(0, filters.page ?? 0);

  // ---------- Mode DB (cache du cron) ----------
  if (await probeDbReady()) {
    try {
      const supabase = createSupabaseServerClient();
      let q = supabase
        .from("prono_jobs")
        .select("*", { count: "exact" })
        .order("published_at", { ascending: false, nullsFirst: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const clean = (s?: string) => (s ?? "").trim().replace(/[%(),]/g, " ");
      const fq = clean(filters.q);
      if (fq) q = q.or(`title.ilike.%${fq}%,company.ilike.%${fq}%,description_short.ilike.%${fq}%`);
      if (clean(filters.city)) q = q.ilike("city", `%${clean(filters.city)}%`);
      if (clean(filters.country)) q = q.eq("country", filters.country!.trim());
      if (clean(filters.contract)) q = q.eq("contract_type", filters.contract!.trim());
      if (filters.remote) q = q.eq("remote", true);
      if (clean(filters.source)) q = q.eq("source", filters.source!.trim());

      const { data, count, error } = await q;
      if (!error && (count ?? 0) > 0) {
        // Re-nettoyage : les anciennes lignes du cache peuvent contenir du HTML visible
        const jobs = (data ?? []).map((row: PronoJob) => ({
          ...row,
          description_short: recleanExcerpt(row.description_short),
        })) as PronoJob[];
        return { jobs, total: count ?? 0, mode: "db" };
      }
      if (!error && page > 0) return { jobs: [], total: count ?? 0, mode: "db" }; // fin de pagination
    } catch {
      /* chute vers le mode live */
    }
  }

  // ---------- Mode live (lecture directe des API) ----------
  const all = await fetchLiveJobs();
  const needle = (filters.q ?? "").trim().toLowerCase();
  const city = (filters.city ?? "").trim().toLowerCase();
  const filtered = all.filter((j) => {
    if (needle && !`${j.title} ${j.company} ${j.description_short ?? ""}`.toLowerCase().includes(needle)) return false;
    if (city && !(j.city ?? "").toLowerCase().includes(city)) return false;
    if (filters.country && j.country !== filters.country) return false;
    if (filters.contract && j.contract_type !== filters.contract) return false;
    if (filters.remote && !j.remote) return false;
    if (filters.source && j.source !== filters.source) return false;
    return true;
  });
  return {
    jobs: filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    total: filtered.length,
    mode: "live",
  };
}

// ============================================================
// PronoScore — compatibilité profil ↔ offre (0-99)
// ============================================================

const LEVEL_POINTS: Record<string, number> = { none: 0, A1: 3, A2: 6, B1: 9, B2: 12, C1: 15, C2: 15 };

/**
 * Calcule la probabilité (en %) que le profil du joueur matche l'offre.
 * Retourne null si aucun profil n'est enregistré.
 */
export function scoreForJob(
  job: PronoJob,
  prefs: JobPrefs | null
): { score: number; reasons: string[] } | null {
  if (!prefs) return null;

  let score = 15; // base
  const reasons: string[] = [];
  const title = `${job.title} ${job.company}`.toLowerCase();
  const desc = (job.description_short ?? "").toLowerCase();

  // 1) Mots-clés métier (max 36 pts)
  const kws = prefs.keywords
    .split(/[,;]/).map((k) => k.trim().toLowerCase()).filter((k) => k.length > 2)
    .slice(0, 8);
  let kwPts = 0;
  const matched: string[] = [];
  for (const k of kws) {
    if (title.includes(k)) { kwPts += 12; matched.push(k); }
    else if (desc.includes(k)) { kwPts += 5; matched.push(k); }
  }
  if (kwPts > 0) { score += Math.min(kwPts, 36); reasons.push(`Mots-clés : ${matched.slice(0, 3).join(", ")}`); }

  // 2) Ville souhaitée (max 18 pts)
  const city = prefs.city.trim().toLowerCase();
  if (city) {
    if (job.city && job.city.toLowerCase().includes(city)) { score += 18; reasons.push(`Ville : ${job.city}`); }
    else if (job.remote) { score += 8; reasons.push("Télétravail possible"); }
  }

  // 3) Télétravail uniquement
  if (prefs.remote_only && job.remote) { score += 10; reasons.push("Télétravail"); }

  // 4) Allemand (max 15 pts)
  const needsGerman = /(deutsch|german|b1|b2|c1|c2)/i.test(`${job.title} ${desc}`);
  const dePts = LEVEL_POINTS[prefs.german_level] ?? 0;
  if (needsGerman) { score += dePts; if (dePts >= 9) reasons.push("Allemand requis — ton niveau passe"); }
  else if (dePts >= 9) { score += 4; }

  // 5) Anglais (max 8 pts)
  const needsEnglish = /(english|englisch)/i.test(`${job.title} ${desc}`);
  const enPts = Math.round((LEVEL_POINTS[prefs.english_level] ?? 0) * 0.5);
  if (needsEnglish) { score += enPts; if (enPts >= 4) reasons.push("Anglais requis — ton niveau passe"); }

  // 6) Type de contrat (max 10 pts)
  if (prefs.contract) {
    if (job.contract_type === prefs.contract) { score += 10; reasons.push(`Contrat : ${job.contract_type}`); }
  } else {
    score += 4;
  }

  // 7) Fraîcheur de l'offre (max 8 pts)
  if (job.published_at) {
    const age = Date.now() - new Date(job.published_at).getTime();
    if (age < 7 * 86400000) { score += 8; reasons.push("Publiée cette semaine"); }
    else if (age < 21 * 86400000) { score += 4; }
  }

  return { score: Math.max(3, Math.min(99, Math.round(score))), reasons };
}

// ============================================================
// Préférences emploi + candidatures
// ============================================================

export const DEFAULT_PREFS: JobPrefs = {
  keywords: "",
  city: "",
  remote_only: false,
  german_level: "none",
  english_level: "none",
  contract: "",
};

/** Préférences d'un joueur (RLS : propriétaire uniquement) */
export async function getJobPrefs(userId: string): Promise<JobPrefs | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prono_job_prefs").select("keywords, city, remote_only, german_level, english_level, contract")
      .eq("user_id", userId).maybeSingle();
    if (error || !data) return null;
    return data as JobPrefs;
  } catch {
    return null;
  }
}

/** Enregistre (ou met à jour) une candidature. Crée l'offre en base si besoin. */
export async function recordApplication(
  userId: string,
  job: InsertableJob
): Promise<{ ok: boolean; code?: string; alreadyApplied?: boolean }> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return { ok: false, code: "no_admin" };

  try {
    // 1) S'assurer que l'offre existe en base (upsert idempotent)
    const { data: row, error: e1 } = await admin
      .from("prono_jobs")
      .upsert(job, { onConflict: "source,source_id" })
      .select("id")
      .single();
    if (e1) return { ok: false, code: e1.message.includes("exist") ? "no_table" : "db_error" };

    // 2) Enregistrer la candidature (ignore si déjà postulée)
    const { error: e2 } = await admin
      .from("prono_applications")
      .upsert({ user_id: userId, job_id: row.id }, { onConflict: "user_id,job_id", ignoreDuplicates: true });
    if (e2) return { ok: false, code: e2.message.includes("exist") ? "no_table" : "db_error" };

    return { ok: true };
  } catch (e) {
    return { ok: false, code: "exception" };
  }
}

/** Candidatures d'un joueur (affichées dans son dashboard). */
export async function getUserApplications(userId: string, withJobs = true) {
  try {
    const supabase = createSupabaseServerClient();
    const select = withJobs
      ? "id, created_at, status, job:prono_jobs(id, source, source_id, title, company, city, country, contract_type, remote, description_short, url, salary_min, salary_max, published_at)"
      : "id, created_at, status, job_id";
    const { data, error } = await supabase
      .from("prono_applications").select(select)
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    if (error) return [];
    return (data ?? []).map((a: any) => ({
      ...a,
      job: a.job ? { ...a.job, description_short: recleanExcerpt(a.job.description_short) } : null,
    }));
  } catch {
    return [];
  }
}
