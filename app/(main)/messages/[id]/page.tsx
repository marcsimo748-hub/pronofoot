import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getThread } from "@/lib/services/pronochat.service";
import { ChatThread } from "@/components/chat/ChatThread";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Discussion privée" };

/**
 * Page /messages/[id] — fil de discussion privé (MODULE 7).
 * Privée : seul un participant peut lire (RLS + service).
 */
export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/messages/${params.id}`);

  const thread = await getThread(user.id, params.id);
  if (!thread) notFound();

  return (
    <div className="container py-6">
      <ChatThread initial={thread} myId={user.id} />
    </div>
  );
}
