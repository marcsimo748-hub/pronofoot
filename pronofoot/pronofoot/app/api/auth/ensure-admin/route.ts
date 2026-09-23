import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/ensure-admin — accorde le rôle admin aux comptes listés
 * dans ADMIN_EMAILS (appelé après connexion/inscription/callback).
 */
export async function POST() {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!emails.length) return NextResponse.json({ ok: true, data: { promoted: false } });

  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ ok: true, data: { promoted: false } });

    if (emails.includes(user.email.toLowerCase())) {
      const admin = tryGetSupabaseAdminClient();
      if (!admin) return NextResponse.json({ ok: true, data: { promoted: false } });

      const { data: profile } = await admin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        await admin.from("profiles").update({ is_admin: true }).eq("id", user.id);
        return NextResponse.json({ ok: true, data: { promoted: true } });
      }
    }

    return NextResponse.json({ ok: true, data: { promoted: false } });
  } catch {
    return NextResponse.json({ ok: true, data: { promoted: false } });
  }
}
