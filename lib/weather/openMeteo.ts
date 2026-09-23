/**
 * 🌦 Open-Meteo — météo actuelle de Berlin.
 * Endpoint gratuit, aucune clé, ~ 50 ms, 30 min de cache côté client.
 */

export interface WeatherNow {
  tempC: number;
  code: number;          // code WMO
  isDay: boolean;
  windKph: number;
  label: string;         // libellé FR/EN/DE
}

export function wmoLabel(code: number, lang: "fr" | "en" | "de" = "fr"): string {
  // Extraits de la table WMO (https://open-meteo.com/en/docs)
  const T: Record<number, Record<string, string>> = {
    0: { fr: "Ciel dégagé", en: "Clear sky", de: "Klarer Himmel" },
    1: { fr: "Peu nuageux", en: "Mostly clear", de: "Heiter" },
    2: { fr: "Partiellement nuageux", en: "Partly cloudy", de: "Teilweise bewölkt" },
    3: { fr: "Couvert", en: "Overcast", de: "Bedeckt" },
    45: { fr: "Brouillard", en: "Fog", de: "Nebel" },
    48: { fr: "Brouillard givrant", en: "Freezing fog", de: "Reifnebel" },
    51: { fr: "Bruine légère", en: "Light drizzle", de: "Leichter Niesel" },
    53: { fr: "Bruine", en: "Drizzle", de: "Niesel" },
    55: { fr: "Bruine forte", en: "Heavy drizzle", de: "Starker Niesel" },
    61: { fr: "Pluie légère", en: "Light rain", de: "Leichter Regen" },
    63: { fr: "Pluie", en: "Rain", de: "Regen" },
    65: { fr: "Pluie forte", en: "Heavy rain", de: "Starkregen" },
    66: { fr: "Pluie verglaçante", en: "Freezing rain", de: "Eisregen" },
    67: { fr: "Pluie verglaçante forte", en: "Heavy freezing rain", de: "Starker Eisregen" },
    71: { fr: "Neige légère", en: "Light snow", de: "Leichter Schnee" },
    73: { fr: "Neige", en: "Snow", de: "Schnee" },
    75: { fr: "Neige forte", en: "Heavy snow", de: "Starker Schnee" },
    77: { fr: "Grains de neige", en: "Snow grains", de: "Schneegriesel" },
    80: { fr: "Averses légères", en: "Light showers", de: "Leichte Schauer" },
    81: { fr: "Averses", en: "Showers", de: "Schauer" },
    82: { fr: "Averses violentes", en: "Violent showers", de: "Starke Schauer" },
    85: { fr: "Averses de neige", en: "Snow showers", de: "Schneeschauer" },
    86: { fr: "Fortes averses de neige", en: "Heavy snow showers", de: "Starke Schneeschauer" },
    95: { fr: "Orage", en: "Thunderstorm", de: "Gewitter" },
    96: { fr: "Orage avec grêle", en: "Thunderstorm + hail", de: "Gewitter mit Hagel" },
    99: { fr: "Orage violent", en: "Severe thunderstorm", de: "Schweres Gewitter" },
  };
  return T[code]?.[lang] ?? T[code]?.fr ?? "—";
}

/** Code simplifié : "rainy" | "snowy" | "clear" | "cloudy" | "storm" pour adapter décor. */
export function weatherKind(code: number, tempC: number): "snowy" | "rainy" | "stormy" | "clear" | "cloudy" {
  if (code >= 95) return "stormy";
  if ((code >= 71 && code <= 86) || tempC < 0) return "snowy";
  if (code >= 51 && code <= 82) return "rainy";
  if (code === 0 || code === 1) return "clear";
  return "cloudy";
}

const TTL = 30 * 60 * 1000; // 30 min
let _cache: { at: number; data: WeatherNow } | null = null;

export async function getWeatherBerlin(lang: "fr" | "en" | "de" = "fr"): Promise<WeatherNow> {
  if (_cache && Date.now() - _cache.at < TTL) return _cache.data;
  try {
    // Berlin ≈ 52.52°N, 13.40°E
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=52.52&longitude=13.41&current=temperature_2m,weather_code,is_day,wind_speed_10m" +
      "&timezone=Europe%2FBerlin";
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const json = await res.json();
    const cur = json.current ?? {};
    const data: WeatherNow = {
      tempC: Math.round(cur.temperature_2m ?? 0),
      code: cur.weather_code ?? 0,
      isDay: Boolean(cur.is_day),
      windKph: Math.round(cur.wind_speed_10m ?? 0),
      label: wmoLabel(cur.weather_code ?? 0, lang),
    };
    _cache = { at: Date.now(), data };
    return data;
  } catch {
    // Fallback : ciel couvert (silencieux, jamais bloquant)
    return { tempC: 12, code: 3, isDay: true, windKph: 8, label: wmoLabel(3, lang) };
  }
}
