"use client";

/**
 * BannerRotator — bannière éditoriale du module.
 * Rotation automatique toutes les 8 s en fondu, image en noir et blanc
 * + voile noir 40 % (PAS de dégradé). Images LOCALES public/banners/.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BannerRotatorProps {
  images: string[];
  title: string;
  subtitle?: string;
  className?: string;
}

export function BannerRotator({ images, title, subtitle, className }: BannerRotatorProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className={cn("relative h-44 overflow-hidden rounded-xl border border-white/10 md:h-60", className)}>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- bannières locales en rotation, pas d'optimisation nécessaire
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 h-full w-full object-cover grayscale transition-opacity duration-1000",
            i === index ? "opacity-100" : "opacity-0"
          )}
        />
      ))}

      {/* Voile noir 40 % · plat, aucun dégradé */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Titre du service par-dessus */}
      <div className="absolute inset-0 flex flex-col items-start justify-end p-5 md:p-7">
        <h2 className="font-display text-3xl font-black uppercase tracking-wide text-white drop-shadow-md md:text-5xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 max-w-xl text-xs font-medium text-white/80 md:text-sm">{subtitle}</p>
        )}
      </div>

      {/* Points de position */}
      {images.length > 1 && (
        <div className="absolute right-3 top-3 flex gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-white/50 transition-colors",
                i === index && "bg-primary"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
