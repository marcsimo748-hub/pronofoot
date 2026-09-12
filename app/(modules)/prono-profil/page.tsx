import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";
import { getProfiles } from "@/lib/services/pronoprofile.service";
import { PronoProfileClient } from "@/components/pronoprofil/PronoProfileClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PronoProfil — Mes profils & mon CV",
  description:
    "Un compte, plusieurs profils : Emploi, Logement, Visa, Rencontre. Générateur de CV avec 3 modèles professionnels exportables en PDF. Gratuit, par Pronofoot.",
};

/**
 * Page /prono-profil — MODULE 2 « PronoCV & Prono-Profil ».
 * Protégée par le middleware (redirection /login si non connecté) ;
 * garde-fou supplémentaire si le middleware est en mode dégradé.
 */
export default async function PronoProfilPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="container flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-12 text-center">
        <span className="text-5xl">🧩</span>
        <h1 className="mt-4 text-2xl font-black">Mes profils Pronofoot</h1>
        <p className="mt-2 text-muted-foreground">
          Emploi, Logement, Visa, Rencontre — un seul compte, un profil adapté à chaque besoin,
          et un générateur de CV gratuit.
        </p>
        <Link
          href="/login?next=/prono-profil"
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const profiles = await getProfiles(user.id);

  return (
    <PronoProfileClient
      initialProfiles={profiles}
      username={user.username}
      email={user.email ?? ""}
    />
  );
}
