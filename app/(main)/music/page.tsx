import type { Metadata } from "next";
import { Playlist } from "@/components/music/Playlist";
import { MusicPageHero } from "@/components/music/MusicPageHero";
import { getSongs } from "@/lib/services/music.service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Musique" };

/**
 * Page /music — playlist complète + lecteur.
 * Les MP3 sont servis depuis le bucket Supabase Storage `songs`.
 * La liste est portée par le store global (rempli par le MusicPlayer racine).
 */
export default async function MusicPage() {
  const songs = await getSongs();

  return (
    <div className="container space-y-8 py-8">
      <MusicPageHero count={songs.length} />
      <Playlist />
      <p className="text-center text-xs text-muted-foreground">
        💡 Astuce : lance un titre puis navigue partout sur le site · la musique continue dans la barre du bas !
      </p>
    </div>
  );
}
