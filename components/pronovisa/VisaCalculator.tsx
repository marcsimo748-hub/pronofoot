"use client";

/**
 * VisaCalculator — « Calcule tes chances de visa Allemagne » (MODULE 3).
 * Wizard 8 questions → score % + niveau + checklist personnalisée + conseils.
 * ⚖️ Toujours accompagné du disclaimer : estimation, pas un conseil juridique.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  VISA_QUESTIONS,
  DEFAULT_ANSWERS,
  computeVisaScore,
  VISA_CHECKLISTS,
  VISA_TYPE_LABELS,
  VISA_DISCLAIMER,
  type VisaAnswers,
} from "./visa-data";

export interface VisaCheck {
  id: string;
  visa_type: string;
  score: number;
  created_at: string;
}

export function VisaCalculator({
  loggedIn,
  prefill,
  history,
}: {
  loggedIn: boolean;
  prefill: Partial<VisaAnswers>;
  history: VisaCheck[];
}) {
  const [answers, setAnswers] = useState<VisaAnswers>({ ...DEFAULT_ANSWERS });
  const [step, setStep] = useState(0); // 0 = intro, 1..N questions, N+1 = résultat
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [checks, setChecks] = useState<VisaCheck[]>(history);

  const total = VISA_QUESTIONS.length;
  const done = useMemo(
    () => VISA_QUESTIONS.every((q) => answers[q.key]),
    [answers]
  );
  const result = useMemo(
    () => (done ? computeVisaScore(answers) : null),
    [done, answers]
  );

  function applyPrefill() {
    setAnswers((a) => ({ ...a, ...Object.fromEntries(Object.entries(prefill).filter(([, v]) => v)) }));
    setStep(1);
  }

  function choose(key: keyof VisaAnswers, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
    // petite pause pour voir la sélection, puis étape suivante
    setTimeout(() => setStep((s) => Math.min(s + 1, total + 1)), 220);
  }

  async function save() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/prono-visa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visa_type: answers.visaType, answers, score: result.score }),
      });
      const json = await res.json();
      if (json.ok) {
        setChecks((c) => [json.data, ...c].slice(0, 5));
        setSavedMsg("✅ Simulation enregistrée dans ton compte !");
      } else if (json.code === "no_table") {
        setSavedMsg("⚠️ Exécute 006_prono_visa.sql dans Supabase pour activer l'historique.");
      } else {
        setSavedMsg("⚠️ Impossible d'enregistrer — le résultat reste affiché.");
      }
    } catch {
      setSavedMsg("⚠️ Réseau indisponible — le résultat reste affiché.");
    } finally {
      setSaving(false);
    }
  }

  function restart() {
    setAnswers({ ...DEFAULT_ANSWERS });
    setStep(0);
    setSavedMsg(null);
  }

  const q = step >= 1 && step <= total ? VISA_QUESTIONS[step - 1] : null;
  const progress = Math.round((Math.min(step, total) / total) * 100);

  return (
    <div className="rounded-xl border border-white/5 bg-card/70 p-4 backdrop-blur-sm md:p-6">
      {/* ---------- Intro ---------- */}
      {step === 0 && (
        <div className="text-center">
          <p className="text-5xl">🧮</p>
          <h2 className="mt-3 text-2xl font-black">Calcule tes chances</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            8 questions rapides (âge, diplôme, allemand, projet, financement…) → un score
            d&apos;estimation, la checklist des documents et des conseils personnalisés pour ton
            dossier de visa Allemagne.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
            <Badge variant="secondary">⏱️ 2 minutes</Badge>
            <Badge variant="secondary">🔒 Réponses privées</Badge>
            <Badge variant="secondary">🇩🇪 Ausbildung · Studium · Chancenkarte</Badge>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => setStep(1)} size="lg" variant="glow">
              🚀 Commencer le calcul
            </Button>
            {Object.keys(prefill).length > 0 && (
              <Button onClick={applyPrefill} size="lg" variant="outline">
                ⚡ Utiliser mon profil visa
              </Button>
            )}
          </div>
          {!loggedIn && (
            <p className="mt-4 text-xs text-muted-foreground">
              💡{" "}
              <Link href="/login?next=/prono-visa" className="text-primary hover:underline">
                Connecte-toi
              </Link>{" "}
              pour sauvegarder tes simulations et comparer tes progrès.
            </p>
          )}
        </div>
      )}

      {/* ---------- Question en cours ---------- */}
      {q && (
        <div>
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Question {step}/{total}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={q.key}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
            >
              <h2 className="text-xl font-bold">
                {q.icon} {q.question}
              </h2>
              {q.hint && <p className="mt-1 text-sm text-muted-foreground">{q.hint}</p>}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {q.options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => choose(q.key, o.value)}
                    className={cn(
                      "rounded-xl border p-3.5 text-left transition-colors",
                      answers[q.key] === o.value
                        ? "border-primary/60 bg-primary/15"
                        : "border-white/10 bg-background/40 hover:border-primary/40"
                    )}
                  >
                    <span className="block text-sm font-semibold">{o.label}</span>
                    {o.sub && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">{o.sub}</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              ← Retour
            </Button>
            {answers[q.key] && (
              <Button variant="outline" onClick={() => setStep((s) => Math.min(total + 1, s + 1))}>
                Suivant →
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ---------- Résultat ---------- */}
      {step === total + 1 && result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <ScoreGauge score={result.score} />
            <h2 className="text-2xl font-black">{result.levelLabel}</h2>
            <p className="max-w-xl text-sm text-muted-foreground">{result.summary}</p>
            <Badge variant="outline">
              Projet : {VISA_TYPE_LABELS[answers.visaType] ?? answers.visaType}
            </Badge>
          </div>

          {/* Conseils personnalisés */}
          <div>
            <h3 className="mb-2 font-semibold">🧭 Tes conseils personnalisés</h3>
            <ul className="space-y-2">
              {result.advices.map((adv, i) => (
                <li key={i} className="rounded-lg border border-white/5 bg-background/40 p-3 text-sm">
                  {adv}
                </li>
              ))}
            </ul>
          </div>

          {/* Checklist */}
          <div>
            <h3 className="mb-2 font-semibold">
              {VISA_CHECKLISTS[answers.visaType]?.title ?? "📋 Checklist du dossier"}
            </h3>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {(VISA_CHECKLISTS[answers.visaType]?.items ?? []).map((item, i) => {
                const isCritical = result.critical.some((c) => item.toLowerCase().includes(c.toLowerCase().slice(0, 25)));
                return (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-2.5 text-sm",
                      isCritical
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-white/5 bg-background/40"
                    )}
                  >
                    <span className="mt-0.5">{isCritical ? "⭐" : "☐"}</span>
                    <span>
                      {item}
                      {isCritical && (
                        <span className="ml-1.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                          priorité
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sauvegarde / actions */}
          <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
            <Button variant="outline" onClick={restart}>
              🔄 Refaire le calcul
            </Button>
            {loggedIn ? (
              <Button onClick={save} disabled={saving}>
                {saving ? "Enregistrement…" : "💾 Sauvegarder ma simulation"}
              </Button>
            ) : (
              <Link
                href="/login?next=/prono-visa"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                🔐 Se connecter pour sauvegarder
              </Link>
            )}
            {savedMsg && <span className="text-sm text-muted-foreground">{savedMsg}</span>}
          </div>

          {/* Historique */}
          {checks.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">📈 Mes dernières simulations</h3>
              <div className="flex flex-wrap gap-2">
                {checks.slice(0, 5).map((c) => (
                  <Badge key={c.id} variant="secondary" className="gap-1">
                    {new Date(c.created_at).toLocaleDateString("fr-FR")} ·{" "}
                    {VISA_TYPE_LABELS[c.visa_type] ?? c.visa_type} · {c.score}%
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer — TOUJOURS visible */}
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            {VISA_DISCLAIMER}
          </p>
        </motion.div>
      )}
    </div>
  );
}

/** Jauge circulaire du score (SVG pur — aucune dépendance) */
function ScoreGauge({ score }: { score: number }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : score >= 25 ? "#f97316" : "#ef4444";
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-secondary" />
        <motion.circle
          cx="80" cy="80" r={r} fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - filled }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums" style={{ color }}>
          {score}%
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">estimation</span>
      </div>
    </div>
  );
}
