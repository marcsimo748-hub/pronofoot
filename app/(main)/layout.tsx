import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { getSessionUser } from "@/lib/supabase/server";
import { getSettings } from "@/lib/services/settings.service";

/**
 * Layout des pages principales : Header + annonce + contenu + Footer + nav mobile.
 */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getSessionUser(), getSettings()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header user={user} />
      <AnnouncementBanner settings={settings} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav user={user} />
    </div>
  );
}
