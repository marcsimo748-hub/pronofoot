import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { ChatList } from "@/components/chat/ChatList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes messages privés",
  description:
    "Discute avec les membres de la communauté PRONO sans divulguer ton numéro : le chat est lié à ton compte et aux annonces, les coordonnées ne sont partagées qu'après ton accord.",
};

/**
 * Page /messages — MESSAGERIE INTERNE (MODULE 7).
 * Privée (middleware) : liste des discussions de l'utilisateur connecté.
 */
export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/messages");

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">💬 Mes messages</h1>
        <p className="text-sm text-muted-foreground">
          Discussions privées liées à ton compte. Les coordonnées ne sont
          jamais visibles avant l&apos;accord des deux parties 🔒
        </p>
      </header>

      <ChatList />
    </div>
  );
}
