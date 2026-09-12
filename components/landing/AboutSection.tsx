"use client";

/**
 * AboutSection — présentation professionnelle de PRONOFOOT (landing).
 * Texte disponible en FR / EN / DE via le sélecteur de langue.
 */

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";

export function AboutSection() {
  const { t } = useT();

  return (
    <section id="apropos" className="container py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto max-w-3xl text-center"
      >
        <h2 className="text-3xl font-black md:text-4xl">
          {t("about.title")} <span className="text-gradient">PRONOFOOT</span>
        </h2>

        <div className="mt-8 space-y-5 text-left text-sm leading-relaxed text-muted-foreground md:text-base">
          <p className="text-foreground/90">{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
          <p>{t("about.p3")}</p>
          <p className="font-medium text-foreground/80">{t("about.p4")}</p>
        </div>
      </motion.div>
    </section>
  );
}
