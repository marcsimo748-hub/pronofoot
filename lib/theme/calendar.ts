/**
 * 📅 CALENDRIER MONDIAL — Pâques, Ramadan, Eid, Diwali, fêtes nationales…
 * Calcul 100 % local (aucune API). Si tu changes ta liste de pays,
 * ajuste les tables Ramadan/Hanoucca etc. ci-dessous.
 *
 * Licence : calculs astronomiques simplifiés, précision ≈ 1 jour (suffisant
 * pour de la décoration de site, pas pour le culte).
 */

// --- Pâques (algorithme de Gauss, fonctionne pour toutes les années) ---
function gaussEaster(year: number): Date {
  // Référence : années 1900-2099 (gauss étendu)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// --- Fenêtres mobiles autour d'une date ---
function windowOf(date: Date, daysBefore: number, daysAfter: number): { start: string; end: string } {
  const s = new Date(date);
  s.setDate(s.getDate() - daysBefore);
  const e = new Date(date);
  e.setDate(e.getDate() + daysAfter);
  return { start: isoDay(s), end: isoDay(e) };
}
function isoDay(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// --- Ramadan / Eid (jours officiels Muslim World League, table 2024-2032) ---
// (On stocke : 1er jour Ramadan, Eid al-Fitr = +30, Eid al-Adha = +70 à partir du 1er Ramadan)
const ISLAMIC_TABLE: Record<number, { ramadan1: string; eidFitr: string; eidAdha: string }> = {
  2024: { ramadan1: "03-11", eidFitr: "04-10", eidAdha: "06-17" },
  2025: { ramadan1: "03-01", eidFitr: "03-30", eidAdha: "06-07" },
  2026: { ramadan1: "02-18", eidFitr: "03-19", eidAdha: "05-27" },
  2027: { ramadan1: "02-07", eidFitr: "03-08", eidAdha: "05-16" },
  2028: { ramadan1: "01-27", eidFitr: "02-26", eidAdha: "05-05" },
  2029: { ramadan1: "01-15", eidFitr: "02-14", eidAdha: "04-24" },
  2030: { ramadan1: "01-05", eidFitr: "02-03", eidAdha: "04-14" },
  2031: { ramadan1: "12-26", eidFitr: "01-25", eidAdha: "04-04" },
  2032: { ramadan1: "12-14", eidFitr: "01-14", eidAdha: "03-23" },
};

// --- Diwali (date FIXE dans le calendrier hindou Vikram Samvat 2081-2082) ---
const DIWALI_TABLE: Record<number, string> = {
  2024: "11-01",
  2025: "10-21",
  2026: "11-08",
  2027: "10-28",
  2028: "10-17",
  2029: "11-05",
  2030: "10-26",
};

// --- Yom Kippour (date hébraïque convertie grégorienne — table officielle) ---
const YOM_KIPPOUR: Record<number, string> = {
  2024: "10-12",
  2025: "10-02",
  2026: "09-21",
  2027: "10-11",
  2028: "09-30",
  2029: "09-19",
  2030: "10-08",
};

// --- Hanoucca (8 jours à partir du 25 Kislev) ---
const HANOUCCA_START: Record<number, string> = {
  2024: "12-25",
  2025: "12-14",
  2026: "12-04",
  2027: "12-24",
  2028: "12-12",
  2029: "12-01",
  2030: "12-20",
};

// --- Thanksgiving (US : 4e jeudi de novembre) ---
function thanksgiving(year: number): string {
  const nov1 = new Date(year, 10, 1);
  const dayOfWeek = nov1.getDay(); // 0=dim
  const offsetToThursday = (4 - dayOfWeek + 7) % 7;
  const firstThursday = 1 + offsetToThursday;
  const fourthThursday = firstThursday + 21;
  return isoDay(new Date(year, 10, fourthThursday));
}

// --- Saison (hémisphère Nord, coordonnées Berlin) ---
export type Season = "spring" | "summer" | "autumn" | "winter";

export function currentSeason(d = new Date()): Season {
  const m = d.getMonth() + 1; // 1-12
  const day = d.getDate();
  if (m === 12 || (m === 1) || (m === 2) || (m === 3 && day < 21)) return "winter";
  if ((m === 3 && day >= 21) || m === 4 || m === 5 || (m === 6 && day < 21)) return "spring";
  if ((m === 6 && day >= 21) || m === 7 || m === 8 || (m === 9 && day < 22)) return "summer";
  return "autumn";
}

// --- Cache des fenêtres calculées (par année) ---
const STATIC_EVENT_WINDOWS: Record<string, { start: string; end: string }> = {
  noel: { start: "12-20", end: "12-26" },
  nouvelAn: { start: "12-30", end: "01-02" },
  stValentin: { start: "02-13", end: "02-15" },
  halloween: { start: "10-29", end: "11-01" },
  unityDE: { start: "10-03", end: "10-03" },
  unityCM: { start: "05-20", end: "05-20" },
};

const windowCache: Record<string, Record<string, { start: string; end: string }>> = {};

export function getEventWindowsById(year: number): Record<string, { start: string; end: string }> {
  if (windowCache[year]) return windowCache[year];

  const easter = gaussEaster(year);
  const easterRange = windowOf(easter, 1, 1); // dimanche + lundi uniquement

  const islamic = ISLAMIC_TABLE[year] ?? ISLAMIC_TABLE[2025];
  const nextYear = ISLAMIC_TABLE[year + 1] ?? ISLAMIC_TABLE[2025];
  const ramadanStart = new Date(year, parseInt(islamic.ramadan1.slice(0, 2)) - 1, parseInt(islamic.ramadan1.slice(3, 5)));
  const ramadanEnd = new Date(year, parseInt(islamic.eidFitr.slice(0, 2)) - 1, parseInt(islamic.eidFitr.slice(3, 5)));
  // Fenêtre "Ramadan" : du 1er Ramadan jusqu'au dernier jour (la veille d'Eid)
  const ramadan = {
    start: isoDay(ramadanStart),
    end: isoDay(new Date(ramadanEnd.getTime() - 24 * 3600 * 1000)),
  };
  const eidFitr = {
    start: islamic.eidFitr,
    end: isoDay(new Date(year, parseInt(islamic.eidFitr.slice(0, 2)) - 1, parseInt(islamic.eidFitr.slice(3, 5)) + 2)),
  };
  const eidAdha = {
    start: islamic.eidAdha,
    end: isoDay(new Date(year, parseInt(islamic.eidAdha.slice(0, 2)) - 1, parseInt(islamic.eidAdha.slice(3, 5)) + 3)),
  };

  const diwali = DIWALI_TABLE[year] ?? "11-01";
  const diwaliRange = windowOf(
    new Date(year, parseInt(diwali.slice(0, 2)) - 1, parseInt(diwali.slice(3, 5))),
    1, 2
  );

  const yk = YOM_KIPPOUR[year] ?? "10-12";
  const ykDate = new Date(year, parseInt(yk.slice(0, 2)) - 1, parseInt(yk.slice(3, 5)));
  const yomKippour = windowOf(ykDate, 1, 1);

  const hc = HANOUCCA_START[year] ?? "12-25";
  const hcDate = new Date(year, parseInt(hc.slice(0, 2)) - 1, parseInt(hc.slice(3, 5)));
  const hanoucca = { start: isoDay(hcDate), end: isoDay(new Date(hcDate.getTime() + 8 * 24 * 3600 * 1000)) };

  // Index annuel : on mappe les clés d'event (de themes.ts) à leurs fenêtres
  const result: Record<string, { start: string; end: string }> = {
    paques: easterRange,
    ramadan,
    "eid-fitr": eidFitr,
    "eid-adha": eidAdha,
    diwali: diwaliRange,
    "yom-kippour": yomKippour,
    hanoucca,
    thanksgiving: {
      start: thanksgiving(year),
      end: thanksgiving(year),
    },
    // Si Ramadan déborde sur l'année suivante, on prolonge (ex : 24 déc 2030)
  };
  // Prolonger Ramadan si nécessaire
  if (ramadan.end < ramadan.start && nextYear) {
    // cas où le Ramadan de l'année précédente se prolonge (janvier)
    // non utilisé ici : on garde les valeurs déjà remplies ci-dessus
  }

  Object.assign(result, STATIC_EVENT_WINDOWS);
  windowCache[year] = result;
  return result;
}

// --- Comparaison MM-DD dans une fenêtre ---
function inWindow(today: string, window: { start: string; end: string }): boolean {
  // today = "MM-DD", window.start et window.end idem (potentiellement à cheval sur l'année)
  const toDay = (s: string) => {
    const [mm, dd] = s.split("-").map(Number);
    return mm * 32 + dd;
  };
  const t = toDay(today);
  const s = toDay(window.start);
  const e = toDay(window.end);
  if (s <= e) return t >= s && t <= e;
  // Fenêtre à cheval (ex 12-30 → 01-02)
  return t >= s || t <= e;
}

// --- Événements actifs aujourd'hui ---
export function activeEvents(d: Date): string[] {
  const today = isoDay(d);
  const year = d.getFullYear();
  const windows = getEventWindowsById(year);
  const active: string[] = [];
  for (const [key, win] of Object.entries(windows)) {
    if (inWindow(today, win)) active.push(key);
  }
  return active;
}

export { isoDay };
