"use client";

/**
 * Grille des fonctionnalités de la landing — FR / EN / DE via useT().
 */

import { motion } from "framer-motion";
import { Trophy, Radio, Newspaper, Music4, Bot, Users } from "lucide-react";
import { useT, type Dict } from "@/lib/i18n";

const FEATURES = [
  { icon: Trophy, k: "f1" },
  { icon: Radio, k: "f2" },
  { icon: Newspaper, k: "f3" },
  { icon: Music4, k: "f4" },
  { icon: Bot, k: "f5" },
  { icon: Users, k: "f6" },
] as const;

export function FeaturesGrid() {
  const { t } = useT();

  return (
    <section id="ia" className="container py-16">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black md:text-4xl">
          {t("features.titleA")} <span className="text-gradient">{t("features.titleB")}</span>
        </h2>
        <p className="mt-3 text-muted-foreground">{t("features.sub")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.k}
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
                {t(`features.${f.k}g` as keyof Dict)}
              </span>
            </div>
            <h3 className="mb-2 font-bold">{t(`features.${f.k}t` as keyof Dict)}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t(`features.${f.k}d` as keyof Dict)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
