import { headers } from "next/headers";
import { Home, MapPin, Plus } from "lucide-react";
import { listAnnonces } from "@/lib/services/pronoannonces.service";
import { useServerT } from "@/lib/i18n-server";

/**
 * 🏠 Offres de logement de la communauté — section de /prono-housing.
 * Les offres sont des petites annonces (catégorie « logement ») publiées
 * par les joueurs : aucune API externe (légale et gratuite n'existe pas en
 * Allemagne), 100 % communautaire, modérée comme les autres annonces.
 */
export async function HousingOffers() {
  const t = await useServerT(headers());
  const offers = await listAnnonces({ category: "logement" });
  const locale = t("__locale__");

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Home className="h-5 w-5 text-primary" /> {t("hou.offersTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("hou.offersIntro")}</p>
        </div>
        <a
          href="/prono-annonces?cat=logement&publier=1"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> {t("hou.offersPublish")}
        </a>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Home className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-semibold">{t("hou.offersEmpty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("hou.offersEmptyHelp")}</p>
          <a
            href="/prono-annonces?cat=logement&publier=1"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> {t("hou.offersFirst")}
          </a>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((a) => (
            <a
              key={a.id}
              href={`/prono-annonces?annonce=${a.id}`}
              className="group overflow-hidden rounded-xl border border-white/10 bg-secondary/40 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              {a.photos?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.photos[0]}
                  alt={a.title}
                  className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-36 w-full place-items-center bg-primary/10 text-4xl">🏠</div>
              )}
              <div className="space-y-1.5 p-3.5">
                <p className="line-clamp-1 font-bold">{a.title}</p>
                {a.city && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {a.city}
                  </p>
                )}
                <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                <p className="pt-1 text-[11px] text-muted-foreground/70">
                  {a.author?.username ? `${t("hou.offersBy", { user: a.author.username })} · ` : ""}
                  {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "Europe/Berlin" }).format(
                    new Date(a.created_at)
                  )}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
