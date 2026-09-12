import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationsCount,
} from "@/lib/services/prononotifications.service";

export const dynamic = "force-dynamic";

/**
 * NOTIFICATIONS IN-APP (Mission 10).
 * GET  : dernières notifications + nombre de non-lues.
 * PATCH : { id } marque une notification lue, { all: true } tout marque lu.
 * Table créée par la migration 011 — si absente, réponse vide propre.
 */
export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [notifications, unread] = await Promise.all([
    listNotifications(user.id),
    unreadNotificationsCount(user.id),
  ]);
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: string; all?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body_invalide" }, { status: 400 });
  }

  const ok = body.all
    ? await markAllNotificationsRead(user.id)
    : body.id
      ? await markNotificationRead(user.id, body.id)
      : false;

  const unread = await unreadNotificationsCount(user.id);
  return NextResponse.json({ ok, unread });
}
