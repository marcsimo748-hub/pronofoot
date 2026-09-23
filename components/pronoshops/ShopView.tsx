"use client";

/**
 * Vue d'une boutique membre : traduite (FR/EN/DE).
 * Reçoit les données du serveur ; bandeau aux couleurs du thème choisi.
 */

import Link from "next/link";
import Image from "next/image";
import { useT } from "@/lib/i18n";
import { shopTheme } from "./shop-themes";
import { ShopItemsGrid } from "./ShopItemsGrid";
import type { PronoShop } from "@/lib/services/pronoshops.service";
import type { PronoAnnonce } from "@/lib/types";

interface Props {
  shop: PronoShop;
  items: PronoAnnonce[];
  isOwner: boolean;
  loggedIn: boolean;
}

export function ShopView({ shop, items, isOwner, loggedIn }: Props) {
  const { t } = useT();
  const th = shopTheme(shop.theme);
  const waDigits = shop.whatsapp.replace(/[^\d]/g, "");
  const waIntl = shop.whatsapp.startsWith("+")
    ? waDigits
    : waDigits.startsWith("0")
      ? `49${waDigits.slice(1)}`
      : waDigits;

  return (
    <div className="space-y-8">
      {/* ===== Bandeau boutique (thème du propriétaire) ===== */}
      <header
        className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-10"
        style={{ background: `linear-gradient(135deg, ${th.from}, ${th.to})` }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-black/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl border-2 border-white/25 bg-black/30 text-5xl shadow-2xl backdrop-blur">
            {shop.logo_url ? (
              <Image src={shop.logo_url} alt={shop.name} width={96} height={96} className="h-full w-full object-cover" unoptimized />
            ) : (
              th.emoji
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-white/70">🛍️ PRONO</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{shop.name}</h1>
            {shop.tagline && (
              <p className="mt-1 text-sm font-bold" style={{ color: th.accent }}>{shop.tagline}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/80">
              {(shop.city || shop.quartier || shop.postal) && (
                <span className="rounded-full bg-black/30 px-3 py-1 backdrop-blur">
                  📍 {[shop.city, shop.quartier, shop.postal].filter(Boolean).join(" · ")}
                </span>
              )}
              <span className="rounded-full bg-black/30 px-3 py-1 backdrop-blur">
                👤 {shop.author?.username ?? "…"}
              </span>
              <span className="rounded-full bg-black/30 px-3 py-1 backdrop-blur">
                🎨 {t("shop.themeLabel")} {th.label}
              </span>
            </div>
          </div>

          {waIntl && (
            <a
              href={`https://wa.me/${waIntl}?text=${encodeURIComponent(`Bonjour ${shop.name} ! 🛍️ PRONO`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-black shadow-xl transition-transform duration-300 hover:scale-105"
            >
              {t("shop.contact")}
            </a>
          )}
        </div>

        {shop.description && (
          <p className="relative mt-5 max-w-3xl whitespace-pre-wrap rounded-xl bg-black/25 p-4 text-sm leading-relaxed text-white/90 backdrop-blur">
            {shop.description}
          </p>
        )}
      </header>

      {/* ===== Articles & services ===== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            {t("shop.items")} <span className="text-sm font-semibold text-muted-foreground">({items.length})</span>
          </h2>
          {isOwner && (
            <Link
              href="/prono-annonces?publier=1"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 hover:scale-105"
            >
              {t("shop.publishItem")}
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="glass rounded-2xl border-dashed p-14 text-center">
            <p className="text-5xl">{th.emoji}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {isOwner ? t("shop.emptyOwner") : t("shop.emptyVisitor")}
            </p>
            {isOwner && (
              <Link
                href="/prono-annonces?publier=1"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                {t("shop.firstItem")}
              </Link>
            )}
          </div>
        ) : (
          <ShopItemsGrid items={items} />
        )}
      </section>

      {/* Invitation visiteurs : eux aussi peuvent vendre leurs services */}
      {!isOwner && !loggedIn && (
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 text-center">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <p className="relative text-lg font-black">{t("shop.ctaTitle")}</p>
          <p className="relative mt-2 text-sm text-muted-foreground">{t("shop.ctaSub")}</p>
          <div className="relative mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 hover:scale-105"
            >
              {t("shop.ctaAccount")}
            </Link>
            <Link
              href="/boutiques"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-secondary px-5 py-2.5 text-sm font-bold transition-transform duration-300 hover:scale-105"
            >
              {t("shop.ctaCreateShop")}
            </Link>
          </div>
        </section>
      )}

      <div className="pb-4 text-center text-sm">
        <Link href="/boutiques" className="font-semibold text-muted-foreground hover:text-foreground">
          {t("shop.otherShops")}
        </Link>
      </div>
    </div>
  );
}
