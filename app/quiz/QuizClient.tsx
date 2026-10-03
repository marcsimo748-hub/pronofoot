"use client";
// app/quiz/QuizClient.tsx
// =====================================================================
// Composant client du quiz "Quel club africain es-tu ?"
// - 7 questions, 4 choix chacune
// - Score cumulé par pays africain
// - Résultat avec partage WhatsApp / Facebook / Twitter
// - URL partageable (?r=cameroun) qui pré-remplit le résultat
// - Design moderne : glassmorphism, gradient, animations
// =====================================================================

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, RotateCcw, Share2, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  QUIZ_QUESTIONS,
  QUIZ_RESULTS,
  computeQuizScores,
  getTopResult,
  getTopThree,
  type QuizResult,
} from "@/lib/quiz-clubs";

type Phase = "intro" | "playing" | "result";

export function QuizClient({ initialResult }: { initialResult?: string }) {
  const [phase, setPhase] = useState<Phase>(
    initialResult && QUIZ_RESULTS.some((r) => r.slug === initialResult) ? "result" : "intro"
  );
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const scores = useMemo(() => computeQuizScores(answers), [answers]);
  const result: QuizResult = useMemo(() => {
    if (initialResult) {
      const r = QUIZ_RESULTS.find((x) => x.slug === initialResult);
      if (r) return r;
    }
    return getTopResult(scores);
  }, [scores, initialResult]);
  const topThree = useMemo(() => getTopThree(scores), [scores]);

  const handleAnswer = (idx: number) => {
    const next = [...answers, String(idx)];
    setAnswers(next);
    if (step + 1 < QUIZ_QUESTIONS.length) {
      setStep(step + 1);
    } else {
      setPhase("result");
    }
  };

  const restart = () => {
    setAnswers([]);
    setStep(0);
    setPhase("intro");
  };

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/quiz?r=${result.slug}`
    : `https://pronofoot-phi.vercel.app/quiz?r=${result.slug}`;
  const shareText = `${result.flag} ${result.signature} ! Je suis ${result.name} dans le quiz PRONO. Et toi ?`;

  // ============= INTRO =============
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="overflow-hidden border-none bg-gradient-to-br from-emerald-500/20 via-amber-500/15 to-red-500/20 shadow-2xl backdrop-blur-md">
          <CardContent className="space-y-5 p-8 sm:p-12 text-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              className="text-7xl"
            >
              ⚽🇦🇺
            </motion.div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              Quel club africain
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 bg-clip-text text-transparent">
                es-tu vraiment ?
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              7 questions · 17 pays · 1 résultat viral. Découvre si tu es un
              Lions Indomptables, une Pharaons ou un Super Eagles.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs sm:text-sm text-muted-foreground">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                🦁 Cameroun · 🦁🇸🇳 Sénégal · 🦁🇲🇦 Maroc · 🦅 Nigeria
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
                👑 Égypte · ⭐ Ghana · 🦊 Algérie · 🐘 CIV
              </span>
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1">
                + 9 autres surprises…
              </span>
            </div>
            <Button
              size="lg"
              className="h-14 w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-amber-500 text-lg font-black text-black shadow-lg hover:from-emerald-400 hover:to-amber-400"
              onClick={() => setPhase("playing")}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Commencer le quiz
            </Button>
            <p className="text-xs text-muted-foreground">
              ⏱️ Moins de 2 minutes · 🔥 Partage WhatsApp
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============= RESULT =============
  if (phase === "result") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            className="overflow-hidden border-none shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${result.color}30 0%, ${result.color}10 100%)`,
              backdropFilter: "blur(12px)",
            }}
          >
            <CardContent className="space-y-5 p-8 sm:p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.6, type: "spring" }}
                className="text-8xl"
              >
                {result.flag}
              </motion.div>
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                🏆 Ton résultat
              </p>
              <h2
                className="text-4xl sm:text-5xl font-black"
                style={{ color: result.color }}
              >
                {result.signature}
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-foreground/90">
                {result.description}
              </p>

              {/* Podium */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  🏆 Top 3 de ton profil
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {topThree.map((r, i) => (
                    <div
                      key={r.slug}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold ${
                        r.slug === result.slug
                          ? "border-yellow-400 bg-yellow-400/20 text-yellow-300"
                          : "border-white/10 bg-white/5 text-muted-foreground"
                      }`}
                    >
                      <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                      <span>{r.flag}</span>
                      <span>{r.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  📲 Tague tes potes
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    asChild
                    className="bg-emerald-500 text-black hover:bg-emerald-400"
                  >
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      💬 WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📘 Facebook
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🐦 X / Twitter
                    </a>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(shareUrl);
                    }
                  }}
                >
                  <Share2 className="mr-1.5 h-4 w-4" /> Copier le lien
                </Button>
              </div>

              <div className="border-t border-white/10 pt-5">
                <Button variant="outline" onClick={restart}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Refaire le quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ============= PLAYING =============
  const question = QUIZ_QUESTIONS[step];
  const progress = ((step + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between text-sm">
        <p className="font-bold text-muted-foreground">
          Question {step + 1} / {QUIZ_QUESTIONS.length}
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.round(progress)}% ✓
        </p>
      </div>
      <div className="mb-8 h-2 rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="border-white/10 bg-card/60 backdrop-blur-md">
            <CardContent className="p-6 sm:p-8">
              <h2 className="mb-6 text-xl sm:text-2xl font-black leading-tight">
                {question.q}
              </h2>
              <div className="space-y-3">
                {question.answers.map((ans, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(idx)}
                    className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-card/80 p-4 text-left transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
                  >
                    <div className="flex items-center gap-3">
                      {ans.emoji && (
                        <span className="text-2xl">{ans.emoji}</span>
                      )}
                      <span className="font-semibold">{ans.label}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-emerald-400" />
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Trophy className="mr-1 inline h-3 w-3" /> Plus que {QUIZ_QUESTIONS.length - step} question
        {QUIZ_QUESTIONS.length - step > 1 ? "s" : ""}…
      </p>
    </div>
  );
}