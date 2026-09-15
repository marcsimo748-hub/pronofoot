"use client";

/**
 * Section "Comment ça marche" + barème des points (landing).
 */

import { motion } from "framer-motion";
import { UserPlus, Trophy, Medal, Target, Star } from "lucide-react";

const STEPS = [
  { icon: UserPlus, title: "1. Crée ton compte", desc: "Email + mot de passe, 30 secondes chrono. Gratuit à vie." },
  { icon: Target, title: "2. Pronostique", desc: "Saisis tes scores sur les matchs des 19 équipes vedettes avant le coup d'envoi." },
  { icon: Medal, title: "3. Grimpe le classement", desc: "Les points tombent automatiquement au coup de sifflet final. Compare-toi à tes amis !" },
];

export function HowItWorks() {
  return (
    <section className="container py-16">
      <div className="grid items-start gap-10 lg:grid-cols-2">
        {/* Étapes */}
        <div>
          <h2 className="mb-8 text-3xl font-black">Comment ça marche ?</h2>
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 rounded-xl border bg-card/70 p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Barème */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 to-transparent p-7"
        >
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <Trophy className="h-6 w-6 text-primary" /> Barème des points
          </h2>
          <ul className="mt-6 space-y-3">
            {[
              { label: "Score exact", pts: 5, icon: "🎯" },
              { label: "Bon vainqueur (score faux)", pts: 3, icon: "✅" },
              { label: "Bon match nul", pts: 3, icon: "🤝" },
              { label: "Champion pronostiqué", pts: 50, icon: "🏆" },
              { label: "Vainqueur de coupe nationale", pts: 30, icon: "🏴" },
              { label: "Vainqueur de la Ligue des Champions", pts: 75, icon: "⭐" },
              { label: "Finaliste de la LDC", pts: 30, icon: "🥈" },
              { label: "Meilleur buteur", pts: 25, icon: "👟" },
            ].map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-3 rounded-lg bg-card/70 px-4 py-3">
                <span className="flex items-center gap-2.5 text-sm">
                  <span>{r.icon}</span> {r.label}
                </span>
                <span className="font-black text-primary">+{r.pts}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
            <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Le calcul est 100% automatique : dès le coup de sifflet final, les points de chaque
            pronostic sont crédités instantanément.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
