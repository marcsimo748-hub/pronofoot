"use client";

/**
 * Grille des articles d'une boutique : animation en cascade.
 * Clic sur une carte → fiche détaillée sur /prono-annonces (deep link),
 * qui gère déjà galerie, contact, chat et signalement.
 */

import { motion } from "framer-motion";
import { AnnonceCard } from "@/components/pronoannonces/AnnonceCard";
import type { PronoAnnonce } from "@/lib/types";

export function ShopItemsGrid({ items }: { items: PronoAnnonce[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: Math.min(i, 8) * 0.05, ease: [0.21, 0.6, 0.35, 1] }}
        >
          <AnnonceCard
            annonce={a}
            isOwner={false}
            onOpen={() => {
              window.location.href = `/prono-annonces?annonce=${a.id}`;
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
