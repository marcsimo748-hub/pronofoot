import { NextResponse } from "next/server";
import { requireAdminUser, tryGetSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST   /api/admin/songs — enregistre un morceau (l'upload du fichier se fait
 *         directement vers Supabase Storage depuis le navigateur admin).
 * DELETE /api/admin/songs — supprime le morceau (ligne + fichier Storage).
 */
export async function POST(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const db = tryGetSupabaseAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

  try {
    const body = (await req.json()) as {
      title?: string;
      artist?: string | null;
      audio_url?: string;
      cover_url?: string | null;
      position?: number;
    };
    if (!body.title?.trim() || !body.audio_url) {
      return NextResponse.json({ ok: false, error: "Titre et audio_url requis" }, { status: 400 });
    }

    const { data, error } = await db
      .from("songs")
      .insert({
        title: body.title.trim().slice(0, 120),
        artist: body.artist?.trim().slice(0, 120) || null,
        audio_url: body.audio_url,
        cover_url: body.cover_url || null,
        position: body.position ?? 0,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const db = tryGetSupabaseAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Service role non configuré" }, { status: 500 });

  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) return NextResponse.json({ ok: false, error: "id requis" }, { status: 400 });

    // Récupère l'URL pour supprimer aussi le fichier Storage
    const { data: song } = await db.from("songs").select("audio_url").eq("id", body.id).single();

    const { error } = await db.from("songs").delete().eq("id", body.id);
    if (error) throw error;

    // Suppression du fichier (best effort)
    if (song?.audio_url?.includes("/storage/v1/object/public/songs/")) {
      const path = song.audio_url.split("/storage/v1/object/public/songs/")[1];
      if (path) await db.storage.from("songs").remove([decodeURIComponent(path)]).catch(() => {});
    }

    return NextResponse.json({ ok: true, data: { deleted: body.id } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
