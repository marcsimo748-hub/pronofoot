"use client";

/**
 * Les 3 templates de CV PRONOCV — format A4 exact (794 × 1123 px @ 96 dpi).
 * Styles 100% en ligne (inline) avec couleurs hex : rendu identique à l'écran
 * et dans le PDF (html2canvas). Fond blanc, texte sombre : prêt à imprimer.
 */

import type { PronoProfile } from "@/lib/types";

export interface CvData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  birthYear: string;
  bio: string;
  skills: string[];
  experiences: { role: string; company: string; period: string; description?: string }[];
  educations: { degree: string; school: string; year: string }[];
  germanLevel: string;
  englishLevel: string;
  otherLanguages: string;
  linkedin: string;
}

const ACCENT = "#2563eb";      // bleu roi PRONO, pro
const DARK = "#0f172a";        // bleu nuit
const MUTED = "#64748b";

const A4: React.CSSProperties = {
  width: 794,
  minHeight: 1123,
  background: "#ffffff",
  color: "#1e293b",
  fontFamily: "Arial, Helvetica, sans-serif",
  display: "flex",
  fontSize: 12.5,
  lineHeight: 1.5,
  boxSizing: "border-box",
};

const LEVEL_DOTS: Record<string, number> = { none: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 5 };
const dots = (level: string) => "●".repeat(LEVEL_DOTS[level] ?? 0) + "○".repeat(5 - (LEVEL_DOTS[level] ?? 0));

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "CV";
}

/** Transforme un profil Pronofoot en données CV */
export function profileToCvData(profile: PronoProfile, username: string, email: string): CvData {
  return {
    fullName: profile.full_name || username,
    jobTitle: profile.job_title || "Profil professionnel",
    email,
    phone: profile.phone,
    city: profile.city,
    country: profile.country,
    birthYear: profile.birth_year ? String(profile.birth_year) : "",
    bio: profile.bio,
    skills: profile.skills.split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 12),
    experiences: (profile.experiences ?? []).slice(0, 4),
    educations: (profile.educations ?? []).slice(0, 4),
    germanLevel: profile.german_level,
    englishLevel: profile.english_level,
    otherLanguages: profile.other_languages,
    linkedin: profile.linkedin_url,
  };
}

// ============================================================
// TEMPLATE 1 — MODERNE (sidebar sombre + accents verts)
// ============================================================
export function ModernCv({ data }: { data: CvData }) {
  const SideTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "22px 0 8px" }}>
      {children}
    </div>
  );
  const MainTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ color: DARK, fontSize: 15, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", margin: "22px 0 10px", borderBottom: "2px solid #e2e8f0", paddingBottom: 6 }}>
      {children}
    </div>
  );
  return (
    <div style={{ ...A4, minHeight: 1123 }}>
      {/* Sidebar */}
      <aside style={{ width: 262, background: DARK, color: "#cbd5e1", padding: "36px 26px", boxSizing: "border-box", flexShrink: 0 }}>
        <div style={{
          width: 92, height: 92, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
          border: `3px solid ${ACCENT}`, color: "#fff", fontSize: 32, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px",
        }}>
          {initials(data.fullName)}
        </div>
        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
          {data.city}{data.city && data.country ? ", " : ""}{data.country}
        </div>

        <SideTitle>Contact</SideTitle>
        <div style={{ fontSize: 11.5, lineHeight: 1.9, wordBreak: "break-word" }}>
          {data.phone && <div>📞 {data.phone}</div>}
          {data.email && <div>✉️ {data.email}</div>}
          {data.linkedin && <div>🔗 {data.linkedin.replace(/^https?:\/\//, "")}</div>}
        </div>

        {data.skills.length > 0 && (
          <>
            <SideTitle>Compétences</SideTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.skills.map((s, i) => (
                <span key={i} style={{ fontSize: 10.5, border: `1px solid ${ACCENT}55`, borderRadius: 999, padding: "3px 9px", color: "#e2e8f0" }}>
                  {s}
                </span>
              ))}
            </div>
          </>
        )}

        <SideTitle>Langues</SideTitle>
        <div style={{ fontSize: 11.5, lineHeight: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Deutsch</span><span style={{ color: ACCENT }}>{dots(data.germanLevel)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>English</span><span style={{ color: ACCENT }}>{dots(data.englishLevel)}</span>
          </div>
          {data.otherLanguages && <div style={{ color: "#94a3b8", fontSize: 10.5 }}>+ {data.otherLanguages}</div>}
        </div>
      </aside>

      {/* Contenu principal */}
      <main style={{ flex: 1, padding: "40px 34px", boxSizing: "border-box" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: DARK, letterSpacing: 0.5 }}>
          {data.fullName}
        </h1>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14.5, marginTop: 4, letterSpacing: 1 }}>
          {data.jobTitle}
        </div>

        {data.bio && (
          <>
            <MainTitle>Profil</MainTitle>
            <p style={{ margin: 0, color: "#334155" }}>{data.bio}</p>
          </>
        )}

        {data.experiences.length > 0 && (
          <>
            <MainTitle>Expérience professionnelle</MainTitle>
            {data.experiences.map((e, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: DARK }}>{e.role}</div>
                <div style={{ fontSize: 11.5, color: MUTED, fontStyle: "italic" }}>
                  {e.company}{e.company && e.period ? " · " : ""}{e.period}
                </div>
                {e.description && <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2 }}>{e.description}</div>}
              </div>
            ))}
          </>
        )}

        {data.educations.length > 0 && (
          <>
            <MainTitle>Formation</MainTitle>
            {data.educations.map((e, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: DARK }}>{e.degree}</div>
                <div style={{ fontSize: 11.5, color: MUTED }}>{e.school}{e.school && e.year ? " · " : ""}{e.year}</div>
              </div>
            ))}
          </>
        )}

        <div style={{ marginTop: 26, fontSize: 9.5, color: "#94a3b8", textAlign: "center" }}>
          CV généré gratuitement avec PRONO · pronofoot-phi.vercel.app
        </div>
      </main>
    </div>
  );
}

// ============================================================
// TEMPLATE 2 — CLASSIQUE (sobre, serif, élégant)
// ============================================================
export function ClassicCv({ data }: { data: CvData }) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#111", borderBottom: "1px solid #c8cdd4", paddingBottom: 4, margin: "0 0 10px" }}>
        {title}
      </h2>
      {children}
    </section>
  );
  return (
    <div style={{ ...A4, display: "block", padding: "46px 56px", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* En-tête centré */}
      <header style={{ textAlign: "center", borderBottom: "3px double #333", paddingBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, color: "#111" }}>
          {data.fullName}
        </h1>
        <div style={{ fontStyle: "italic", fontSize: 14, color: "#444", marginTop: 6 }}>{data.jobTitle}</div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>
          {[data.city, data.country, data.phone, data.email].filter(Boolean).join("  ·  ")}
        </div>
        {data.linkedin && (
          <div style={{ fontSize: 10.5, color: "#666", marginTop: 2 }}>{data.linkedin}</div>
        )}
      </header>

      {data.bio && (
        <Section title="Profil">
          <p style={{ margin: 0, color: "#333" }}>{data.bio}</p>
        </Section>
      )}

      {data.experiences.length > 0 && (
        <Section title="Expériences">
          {data.experiences.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#111" }}>
                <span>{e.role}</span>
                <span style={{ fontWeight: 400, fontSize: 11, color: "#666" }}>{e.period}</span>
              </div>
              <div style={{ fontSize: 12, color: "#555", fontStyle: "italic" }}>{e.company}</div>
              {e.description && <div style={{ fontSize: 11.5, color: "#444", marginTop: 2 }}>{e.description}</div>}
            </div>
          ))}
        </Section>
      )}

      {data.educations.length > 0 && (
        <Section title="Formation">
          {data.educations.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: "#111" }}>
                {e.degree}
                {e.school ? <span style={{ fontWeight: 400, color: "#555" }}> · {e.school}</span> : null}
              </span>
              <span style={{ fontSize: 11, color: "#666" }}>{e.year}</span>
            </div>
          ))}
        </Section>
      )}

      {(data.skills.length > 0 || data.germanLevel !== "none" || data.englishLevel !== "none") && (
        <Section title="Compétences & Langues">
          <div style={{ display: "flex", gap: 40 }}>
            {data.skills.length > 0 && (
              <div style={{ flex: 1 }}>
                <strong style={{ color: "#111" }}>Compétences :</strong>
                <div style={{ color: "#444" }}>{data.skills.join(", ")}</div>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <strong style={{ color: "#111" }}>Langues :</strong>
              <div style={{ color: "#444" }}>
                {data.germanLevel !== "none" && <div>Allemand · {data.germanLevel}</div>}
                {data.englishLevel !== "none" && <div>Anglais · {data.englishLevel}</div>}
                {data.otherLanguages && <div>{data.otherLanguages}</div>}
                {data.germanLevel === "none" && data.englishLevel === "none" && !data.otherLanguages && <div>-</div>}
              </div>
            </div>
          </div>
        </Section>
      )}

      <div style={{ marginTop: 40, textAlign: "center", fontSize: 9, color: "#999" }}>
        CV généré gratuitement avec PRONO
      </div>
    </div>
  );
}

// ============================================================
// TEMPLATE 3 — ALLEMAND / AUSBILDUNG (Lebenslauf structuré)
// ============================================================
export function GermanCv({ data }: { data: CvData }) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 13.5, fontWeight: 800, color: DARK, margin: "0 0 10px", paddingLeft: 10, borderLeft: `4px solid ${ACCENT}`, letterSpacing: 1 }}>
        {title}
      </h2>
      {children}
    </section>
  );
  const row = (label: string, value: string) =>
    value ? (
      <div key={label} style={{ display: "flex", gap: 10, fontSize: 12, padding: "3px 0" }}>
        <span style={{ width: 130, color: MUTED, flexShrink: 0 }}>{label}</span>
        <span style={{ color: "#1e293b", fontWeight: 600 }}>{value}</span>
      </div>
    ) : null;

  return (
    <div style={{ ...A4, display: "block", padding: "44px 52px" }}>
      {/* En-tête Lebenslauf */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2.5px solid ${DARK}`, paddingBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: DARK }}>Lebenslauf</h1>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginTop: 4 }}>
            {data.fullName} {data.jobTitle ? `- ${data.jobTitle}` : ""}
          </div>
        </div>
        <div style={{
          width: 84, height: 84, background: DARK, color: "#fff", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800,
        }}>
          {initials(data.fullName)}
        </div>
      </header>

      {/* Persönliche Daten */}
      <Section title="Persönliche Daten / Données personnelles">
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
          {row("Name", data.fullName)}
          {row("Anschrift / Adresse", [data.city, data.country].filter(Boolean).join(", "))}
          {row("Telefon", data.phone)}
          {row("E-Mail", data.email)}
          {row("Geburtsjahr", data.birthYear ? `${data.birthYear}` : "")}
          {row("Geburtsjahr", "") /* jamais rendu si vide */}
        </div>
      </Section>

      {data.bio && (
        <Section title="Profil">
          <p style={{ margin: 0, color: "#334155" }}>{data.bio}</p>
        </Section>
      )}

      {data.experiences.length > 0 && (
        <Section title="Berufserfahrung / Expérience">
          {data.experiences.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: DARK }}>{e.role} {e.company ? <span style={{ fontWeight: 400, color: MUTED }}>· {e.company}</span> : null}</span>
                <span style={{ fontSize: 11, color: MUTED }}>{e.period}</span>
              </div>
              {e.description && <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2 }}>{e.description}</div>}
            </div>
          ))}
        </Section>
      )}

      {data.educations.length > 0 && (
        <Section title="Ausbildung / Formation">
          {data.educations.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: DARK }}>
                {e.degree}
                {e.school ? <span style={{ fontWeight: 400, color: MUTED }}> · {e.school}</span> : null}
              </span>
              <span style={{ fontSize: 11, color: MUTED }}>{e.year}</span>
            </div>
          ))}
        </Section>
      )}

      <Section title="Sprachkenntnisse / Langues">
        <div style={{ display: "flex", gap: 26, fontSize: 12 }}>
          <span>🇩🇪 Deutsch · <strong>{data.germanLevel === "none" ? "–" : data.germanLevel}</strong></span>
          <span>🇬🇧 Englisch · <strong>{data.englishLevel === "none" ? "–" : data.englishLevel}</strong></span>
          {data.otherLanguages && <span>🌍 {data.otherLanguages}</span>}
        </div>
      </Section>

      {data.skills.length > 0 && (
        <Section title="Kenntnisse / Compétences">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{ fontSize: 11, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 9px", color: "#334155" }}>
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      <div style={{ marginTop: 30, fontSize: 9.5, color: "#94a3b8", textAlign: "center" }}>
        Kostenlos erstellt mit PRONO · pronofoot-phi.vercel.app
      </div>
    </div>
  );
}
