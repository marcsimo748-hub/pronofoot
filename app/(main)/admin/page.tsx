import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { getSettings } from "@/lib/services/settings.service";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin" };

/**
 * Page /admin — réservée aux comptes admin (is_admin).
 * Le middleware bloque déjà les non-connectés ; ici on vérifie le rôle.
 */
export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.is_admin) redirect("/");

  const settings = await getSettings();

  return (
    <div className="container py-8">
      <AdminPanel settings={settings} />
    </div>
  );
}
