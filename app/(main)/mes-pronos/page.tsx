// Page mes-pronos minimaliste (build-safe)
import { getSessionUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MesPronosPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/mes-pronos");
  return (
    <div className="container py-12 text-center">
      <h1 className="text-3xl font-black">📲 Mes derniers pronos</h1>
      <p className="mt-3 text-muted-foreground">
        Fonctionnalité en cours de finalisation. Reviens bientôt !
      </p>
    </div>
  );
}