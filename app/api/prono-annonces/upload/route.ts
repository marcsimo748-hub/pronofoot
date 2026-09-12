/**
 * POST /api/prono-annonces/upload — upload d'une photo d'annonce (MODULE 5).
 * Sécurité renforcée : la photo passe par le serveur (jamais le bucket direct
 * depuis le navigateur), validation type + taille, quota par utilisateur,
 * et création automatique du bucket "prono-annonces" s'il manque.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // 4 Mo brut (le navigateur compresse avant)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "prono-annonces";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Quota : 10 uploads / minute / utilisateur
  const rl = rateLimit(`upload:${user.id}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "trop_de_demandes", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "form_invalide" }, { status: 400 });
  }
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "fichier_manquant" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "type_non_autorise" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "trop_lourd" }, { status: 400 });
  }

  const admin = tryGetSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "stockage_indisponible" }, { status: 503 });
  }

  try {
    // Auto-réparation : crée le bucket public s'il n'existe pas encore
    const { data: existing } = await admin.storage.getBucket(BUCKET);
    if (!existing) {
      const { error: createErr } = await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 4 * 1024 * 1024,
        allowedMimeTypes: ALLOWED_TYPES,
      });
      if (createErr) {
        console.error("[upload] création bucket :", createErr.message);
        return NextResponse.json({ error: "stockage_indisponible" }, { status: 503 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (upErr) {
      console.error("[upload] upload :", upErr.message);
      return NextResponse.json({ error: "echec_upload" }, { status: 500 });
    }

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ ok: true, url: data.publicUrl }, { status: 201 });
  } catch (e) {
    console.error("[upload]", e);
    return NextResponse.json({ error: "erreur_interne" }, { status: 500 });
  }
}
