import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Widgets PRONO · Intègre les scores et pronos sur ton site",
  description:
    "Widgets gratuits PRONO à intégrer sur ton site : prochains matchs d'un championnat, classement, scores live. Une ligne de code HTML, zéro tracking.",
  path: "/widgets",
  noindex: true, // page utilitaire, pas pour Google
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pronofoot-phi.vercel.app";

interface WidgetExample {
  id: string;
  title: string;
  description: string;
  iframe: string;
  htmlCode: string;
}

const widgets: WidgetExample[] = [
  {
    id: "pronos",
    title: "Pronostics d'un championnat",
    description:
      "Affiche les 5 prochains matchs de Bundesliga, Premier League, Ligue 1, La Liga ou Serie A avec un bouton « Pronostiquer » vers PRONO. Backlink garanti, iframe léger (~2 ko).",
    iframe: `${SITE_URL}/embed/pronos?league=BUNDESLIGA&limit=5&theme=dark`,
    htmlCode: `<iframe src="${SITE_URL}/embed/pronos?league=BUNDESLIGA&limit=5&theme=dark" width="100%" height="480" frameborder="0" style="border:0;border-radius:12px;overflow:hidden"></iframe>`,
  },
];

export default function WidgetsPage() {
  return (
    <div className="container space-y-10 py-10">
      <header className="space-y-3">
        <h1 className="text-4xl font-black">🧩 Widgets PRONO</h1>
        <p className="max-w-2xl text-muted-foreground">
          Intègre gratuitement les prochains matchs et pronos PRONO sur ton site,
          blog ou page communautaire. <strong>Une ligne de HTML</strong>, aucun
          tracker, aucun cookie déposé. Le bouton "Pronostiquer" renvoie vers
          PRONO (backlink dofollow).
        </p>
      </header>

      {widgets.map((w) => (
        <section key={w.id} className="space-y-4">
          <h2 className="text-2xl font-bold">{w.title}</h2>
          <p className="text-muted-foreground">{w.description}</p>

          {/* Aperçu live */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-card/60 p-2">
            <iframe
              src={w.iframe}
              width="100%"
              height={480}
              frameBorder={0}
              title={w.title}
              className="rounded-lg"
            />
          </div>

          {/* Code à copier */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">📋 Code HTML à coller :</p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 text-xs">
              <code>{w.htmlCode}</code>
            </pre>
          </div>

          {/* Paramètres */}
          <div className="rounded-lg border border-white/10 bg-card/40 p-4 text-sm">
            <p className="font-semibold">Paramètres disponibles :</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                <code className="text-primary">?league=BUNDESLIGA</code> — Bundesliga (défaut), PREMIER_LEAGUE, LIGUE_1, LIGA, SERIE_A, ALL
              </li>
              <li>
                <code className="text-primary">?limit=5</code> — Nombre de matchs (1 à 10, défaut 5)
              </li>
              <li>
                <code className="text-primary">?theme=dark</code> — Thème sombre (défaut) ou <code>light</code>
              </li>
            </ul>
          </div>
        </section>
      ))}

      <footer className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-sm">
        <p className="font-semibold">💡 Besoin d'un widget sur mesure ?</p>
        <p className="mt-1 text-muted-foreground">
          Contacte-nous sur WhatsApp/Telegram <strong>+49 1575 4169524</strong> pour
          discuter d'un widget personnalisé (ton club, ta ligue amateur, ton blog
          communautaire).
        </p>
      </footer>
    </div>
  );
}
