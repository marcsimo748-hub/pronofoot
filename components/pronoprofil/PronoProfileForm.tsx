"use client";

/**
 * PronoProfileForm — formulaire de profil DYNAMIQUE.
 * Les champs changent selon l'intention :
 *  • Emploi    → poste, compétences, expériences, diplômes, langues
 *  • Logement  → ville, type, budget max
 *  • Visa      → pays visé, type de visa, niveau d'allemand, diplômes
 *  • Rencontre → recherche, tranche d'âge, présentation
 */

import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PronoProfile, PronoIntention, ProfileExperience, ProfileEducation } from "@/lib/types";

const LEVELS = [
  { v: "none", label: "Aucun" },
  { v: "A1", label: "A1 — Débutant" },
  { v: "A2", label: "A2 — Élémentaire" },
  { v: "B1", label: "B1 — Intermédiaire" },
  { v: "B2", label: "B2 — Avancé" },
  { v: "C1", label: "C1 — Autonome" },
  { v: "C2", label: "C2 — Maîtrise" },
];

const INTENT_META: Record<PronoIntention, { title: string; desc: string; icon: string; bioLabel: string }> = {
  emploi: {
    title: "Profil Emploi",
    desc: "CV, expériences, diplômes, langues — alimente le PronoScore de PronoJob et ton CV.",
    icon: "💼",
    bioLabel: "Ton accroche professionnelle (2-3 phrases)",
  },
  logement: {
    title: "Profil Logement",
    desc: "Ta recherche de logement en Allemagne / Europe — utile pour les lettres de motivation.",
    icon: "🏠",
    bioLabel: "Ta présentation pour les propriétaires (professionnel, non-fumeur, garanties…)",
  },
  visa: {
    title: "Profil Visa",
    desc: "Ton projet de visa Allemagne / Europe (Ausbildung, Studium, Chancenkarte…).",
    icon: "🛂",
    bioLabel: "Ton projet en quelques phrases",
  },
  rencontre: {
    title: "Profil Rencontre",
    desc: "Ton profil pour rencontrer des gens : amitié, partenaire, sorties.",
    icon: "❤️",
    bioLabel: "Ta présentation",
  },
};

const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

interface FormState {
  full_name: string;
  phone: string;
  city: string;
  country: string;
  birth_year: string;
  bio: string;
  job_title: string;
  skills: string;
  experiences: ProfileExperience[];
  educations: ProfileEducation[];
  german_level: string;
  english_level: string;
  other_languages: string;
  linkedin_url: string;
  target_country: string;
  visa_type: string;
  blocked_note: string;
  housing_city: string;
  housing_type: string;
  budget_max: string;
  age_range: string;
  looking_for: string;
}

export function PronoProfileForm({
  intention,
  profile,
  onSaved,
}: {
  intention: PronoIntention;
  profile: PronoProfile | null;
  onSaved: (p: PronoProfile) => void;
}) {
  const meta = INTENT_META[intention];
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    country: profile?.country ?? "",
    birth_year: profile?.birth_year ? String(profile.birth_year) : "",
    bio: profile?.bio ?? "",
    job_title: profile?.job_title ?? "",
    skills: profile?.skills ?? "",
    experiences: profile?.experiences ?? [],
    educations: profile?.educations ?? [],
    german_level: profile?.german_level ?? "none",
    english_level: profile?.english_level ?? "none",
    other_languages: profile?.other_languages ?? "",
    linkedin_url: profile?.linkedin_url ?? "",
    target_country: profile?.target_country ?? "",
    visa_type: profile?.visa_type ?? "",
    blocked_note: profile?.blocked_note ?? "",
    housing_city: profile?.housing_city ?? "",
    housing_type: profile?.housing_type ?? "",
    budget_max: profile?.budget_max ? String(profile.budget_max) : "",
    age_range: profile?.age_range ?? "",
    looking_for: profile?.looking_for ?? "",
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ----- Listes dynamiques (expériences / diplômes) -----
  const addExperience = () =>
    set("experiences", [...form.experiences, { role: "", company: "", period: "", description: "" }]);
  const removeExperience = (i: number) =>
    set("experiences", form.experiences.filter((_, idx) => idx !== i));
  const setExperience = (i: number, field: keyof ProfileExperience, value: string) =>
    set(
      "experiences",
      form.experiences.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    );

  const addEducation = () =>
    set("educations", [...form.educations, { degree: "", school: "", year: "" }]);
  const removeEducation = (i: number) =>
    set("educations", form.educations.filter((_, idx) => idx !== i));
  const setEducation = (i: number, field: keyof ProfileEducation, value: string) =>
    set(
      "educations",
      form.educations.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    );

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/prono-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intention, ...form }),
      });
      const json = await res.json();
      if (json.ok) {
        onSaved(json.profile);
        setMessage("✅ Enregistré !");
      } else if (json.code === "no_table") {
        setMessage("⚠️ Sauvegarde momentanément indisponible, réessaie dans un instant.");
      } else {
        setMessage("❌ Erreur — réessaie.");
      }
    } catch {
      setMessage("❌ Connexion impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm md:p-6">
      <div>
        <h2 className="text-xl font-bold">
          {meta.icon} {meta.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta.desc}</p>
      </div>

      {/* ===== Champs communs ===== */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nom complet</Label>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Prénom Nom" />
        </div>
        <div className="space-y-1.5">
          <Label>Téléphone / WhatsApp</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+49…" />
        </div>
        <div className="space-y-1.5">
          <Label>Ville</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex : Berlin" />
        </div>
        <div className="space-y-1.5">
          <Label>Pays</Label>
          <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Ex : Allemagne" />
        </div>
        <div className="space-y-1.5">
          <Label>Année de naissance</Label>
          <Input
            type="number"
            value={form.birth_year}
            onChange={(e) => set("birth_year", e.target.value)}
            placeholder="Ex : 1998"
            min={1900}
            max={new Date().getFullYear() - 14}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>{meta.bioLabel}</Label>
          <textarea
            className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Quelques phrases sincères et précises…"
            maxLength={1500}
          />
        </div>
      </div>

      {/* ===== Champs EMPLOI ===== */}
      {intention === "emploi" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Poste / métier visé</Label>
              <Input value={form.job_title} onChange={(e) => set("job_title", e.target.value)} placeholder="Ex : Chauffeur, Cuisinier, Développeur…" />
            </div>
            <div className="space-y-1.5">
              <Label>Compétences (séparées par des virgules)</Label>
              <Input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Ex : permis B, cuisine, logistique, Excel…" />
            </div>
            <div className="space-y-1.5">
              <Label>Niveau d&apos;allemand</Label>
              <select className={inputCls} value={form.german_level} onChange={(e) => set("german_level", e.target.value)}>
                {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Niveau d&apos;anglais</Label>
              <select className={inputCls} value={form.english_level} onChange={(e) => set("english_level", e.target.value)}>
                {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Autres langues</Label>
              <Input value={form.other_languages} onChange={(e) => set("other_languages", e.target.value)} placeholder="Ex : Français (natif), Lingala…" />
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn / site web</Label>
              <Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://…" />
            </div>
          </div>

          {/* Expériences */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">💼 Expériences professionnelles</h3>
              <Button type="button" variant="outline" size="sm" onClick={addExperience} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            {form.experiences.map((exp, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-white/5 bg-background/40 p-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <Input value={exp.role} onChange={(e) => setExperience(i, "role", e.target.value)} placeholder="Poste" />
                  <Input value={exp.company} onChange={(e) => setExperience(i, "company", e.target.value)} placeholder="Entreprise" />
                  <Input value={exp.period} onChange={(e) => setExperience(i, "period", e.target.value)} placeholder="2022 – 2024" />
                </div>
                <div className="flex gap-2">
                  <Input value={exp.description ?? ""} onChange={(e) => setExperience(i, "description", e.target.value)} placeholder="Missions principales…" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeExperience(i)} className="shrink-0 text-red-400" aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Diplômes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">🎓 Diplômes & formations</h3>
              <Button type="button" variant="outline" size="sm" onClick={addEducation} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            {form.educations.map((edu, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-white/5 bg-background/40 p-3 md:grid-cols-[1fr_1fr_120px_44px]">
                <Input value={edu.degree} onChange={(e) => setEducation(i, "degree", e.target.value)} placeholder="Diplôme (ex : Baccalauréat, CAP cuisine)" />
                <Input value={edu.school} onChange={(e) => setEducation(i, "school", e.target.value)} placeholder="Établissement" />
                <Input value={edu.year} onChange={(e) => setEducation(i, "year", e.target.value)} placeholder="Année" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeEducation(i)} className="text-red-400" aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== Champs VISA ===== */}
      {intention === "visa" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Pays visé</Label>
              <select className={inputCls} value={form.target_country} onChange={(e) => set("target_country", e.target.value)}>
                <option value="">Choisir…</option>
                {["Allemagne", "France", "Autriche", "Suisse", "Belgique", "Pays-Bas", "Luxembourg", "Autre pays UE", "Canada", "Autre"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Type de visa / projet</Label>
              <select className={inputCls} value={form.visa_type} onChange={(e) => set("visa_type", e.target.value)}>
                <option value="">Choisir…</option>
                {["Ausbildung (formation pro)", "Studium (études)", "Chancenkarte (carte opportunité)", "Visa de travail", "Visa touriste / visite", "Regroupement familial", "Autre"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Niveau d&apos;allemand</Label>
              <select className={inputCls} value={form.german_level} onChange={(e) => set("german_level", e.target.value)}>
                {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Niveau d&apos;anglais</Label>
              <select className={inputCls} value={form.english_level} onChange={(e) => set("english_level", e.target.value)}>
                {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Ta situation / questions (dossier bloqué, refus, réunions…)</Label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.blocked_note}
                onChange={(e) => set("blocked_note", e.target.value)}
                placeholder="Ex : mon dossier est bloqué depuis 3 mois à l'ambassade…"
                maxLength={1000}
              />
            </div>
          </div>

          {/* Diplômes (utiles pour le visa) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">🎓 Tes diplômes (utiles pour le dossier)</h3>
              <Button type="button" variant="outline" size="sm" onClick={addEducation} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            {form.educations.map((edu, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-white/5 bg-background/40 p-3 md:grid-cols-[1fr_1fr_120px_44px]">
                <Input value={edu.degree} onChange={(e) => setEducation(i, "degree", e.target.value)} placeholder="Diplôme" />
                <Input value={edu.school} onChange={(e) => setEducation(i, "school", e.target.value)} placeholder="Établissement" />
                <Input value={edu.year} onChange={(e) => setEducation(i, "year", e.target.value)} placeholder="Année" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeEducation(i)} className="text-red-400" aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== Champs LOGEMENT ===== */}
      {intention === "logement" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Ville recherchée</Label>
            <Input value={form.housing_city} onChange={(e) => set("housing_city", e.target.value)} placeholder="Ex : Berlin" />
          </div>
          <div className="space-y-1.5">
            <Label>Type de logement</Label>
            <select className={inputCls} value={form.housing_type} onChange={(e) => set("housing_type", e.target.value)}>
              <option value="">Choisir…</option>
              {["WG / Colocation", "Appartement", "Studio", "Chambre"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Budget max (€ / mois)</Label>
            <Input type="number" value={form.budget_max} onChange={(e) => set("budget_max", e.target.value)} placeholder="Ex : 600" min={0} />
          </div>
        </div>
      )}

      {/* ===== Champs RENCONTRE ===== */}
      {intention === "rencontre" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tu cherches</Label>
            <select className={inputCls} value={form.looking_for} onChange={(e) => set("looking_for", e.target.value)}>
              <option value="">Choisir…</option>
              {["Ami(e)", "Partenaire", "Relation sérieuse", "Sorties & activités"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Tranche d&apos;âge</Label>
            <select className={inputCls} value={form.age_range} onChange={(e) => set("age_range", e.target.value)}>
              <option value="">Choisir…</option>
              {["18 – 25 ans", "25 – 35 ans", "35 – 45 ans", "45 ans et +", "Ouvert à tous"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ===== Sauvegarde ===== */}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
        <Button onClick={save} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement…" : profile ? "💾 Mettre à jour" : "💾 Créer mon profil"}
        </Button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </div>
  );
}
