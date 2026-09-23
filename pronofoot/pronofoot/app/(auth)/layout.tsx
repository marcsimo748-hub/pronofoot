import Link from "next/link";
import { getSettings } from "@/lib/services/settings.service";
import { SITE_NAME } from "@/lib/constants";

/**
 * Layout des pages d'authentification — plein écran avec fond d'écran configurable
 * (Admin > 🖼️ Fonds d'Écran Globaux > Connexion).
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const bg = settings.wallpapers.login;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden p-4">
      {bg && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        </>
      )}

      <Link href="/" className="relative mb-8 flex select-none items-center gap-2.5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-2xl shadow-glow-sm">⚽</span>
        <span className="text-2xl font-black tracking-tight text-gradient">{SITE_NAME}</span>
      </Link>

      <div className="relative w-full max-w-md">{children}</div>

      <p className="relative mt-8 text-center text-xs text-muted-foreground">
        Pronostics · Scores live · News · Musique · IA — 100% gratuit
      </p>
    </div>
  );
}
