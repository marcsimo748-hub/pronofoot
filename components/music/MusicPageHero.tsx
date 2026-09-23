"use client";

/** Hero de la page Musique */

import { motion } from "framer-motion";
import { Music4, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicStore } from "@/lib/store/musicStore";

export function MusicPageHero({ count }: { count: number }) {
  const playSong = useMusicStore((s) => s.playSong);
  const songs = useMusicStore((s) => s.songs);
  const currentSong = useMusicStore((s) => s.currentSong);

  return (
    <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/20 via-card to-card p-8">
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 80% 20%, hsl(var(--primary) / 0.15), transparent)",
        }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black md:text-4xl">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/20 text-primary">
              <Music4 className="h-6 w-6" />
            </span>
            Musique
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            {count > 0
              ? `${count} titre${count > 1 ? "s" : ""} dans la playlist du site.`
              : "La playlist du site apparaîtra ici dès que des titres seront ajoutés."}
          </p>
        </div>
        {songs.length > 0 && (
          <Button
            size="lg"
            variant="glow"
            className="gap-2"
            onClick={() => playSong(0)}
            disabled={Boolean(currentSong)}
          >
            <Play className="h-5 w-5" /> {currentSong ? "En lecture…" : "Tout écouter"}
          </Button>
        )}
      </div>
    </header>
  );
}
