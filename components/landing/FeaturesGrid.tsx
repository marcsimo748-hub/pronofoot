"use client";

/**
 * Grille des fonctionnalités de la landing.
 */

import { motion } from "framer-motion";
import { Trophy, Radio, Newspaper, Music4, Bot, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Trophy,
    title: "Pronostics football",
    desc: "Score exact, vainqueur ou nul : pronostique les matchs de la Ligue des Champions et des 5 grands championnats. Verrouillage automatique au coup d'envoi.",
    tag: "5 pts score exact",
  },
  {
    icon: Radio,
    title: "Scores live instantanés",
    desc: "Résultats en direct rafraîchis toutes les 90 secondes. Le site lit son cache Supabase — jamais l'API directement.",
    tag: "maj 90 s",
  },
  {
    icon: Newspaper,
    title: "Actus monde en direct",
    desc: "Un bandeau défilant avec les dernières actualités internationales, mis à jour toutes les 10 minutes.",
    tag: "10 min",
  },
  {
    icon: Music4,
    title: "Lecteur de musique",
    desc: "Playlist intégrée avec lecture aléatoire, répétition et barre de progression. La musique continue pendant que tu navigues !",
    tag: "global",
  },
  {
    icon: Bot,
    title: "Assistant IA",
    desc: "Pose tes questions à l'assistant du site : prochains matchs, barème, scores, navigation. Groq Llama 3.1 + Gemini en secours.",
    tag: "24/7",
  },
  {
    icon: Users,
    title: "Classements & groupes",
    desc: "Classement général, par championnat, mensuel et entre amis avec des groupes privés à code d'invitation.",
    tag: "entre amis",
  },
];

export function FeaturesGrid() {
  return (
    <section id="ia" className="container py-16">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black md:text-4xl">
          Tout ce qu'il faut. <span className="text-gradient">Rien de superflu.</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Une plateforme complète pensée pour les passionnés de foot.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.06 }}
            className="card-hover group rounded-xl border bg-card/70 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                {f.tag}
              </span>
            </div>
            <h3 className="mb-2 font-bold">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
