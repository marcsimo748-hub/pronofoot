import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="text-7xl font-black text-gradient">404</p>
        <p className="mt-4 text-lg font-semibold">Hors-jeu ! Cette page n'existe pas ⚽</p>
        <p className="mt-2 text-sm text-muted-foreground">Même le VAR ne peut rien y faire…</p>
        <Link href="/" className="mt-6 inline-block">
          <Button variant="glow">Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  );
}
