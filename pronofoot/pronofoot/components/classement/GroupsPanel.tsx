"use client";

/**
 * GroupsPanel — créer / rejoindre un groupe d'amis et voir son classement interne.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, UserPlus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LeaderboardTable } from "./LeaderboardTable";
import type { GroupInfo, StandingRow } from "@/lib/types";

export function GroupsPanel({ currentUserId }: { currentUserId?: string }) {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [selected, setSelected] = useState<GroupInfo | null>(null);
  const [rows, setRows] = useState<StandingRow[]>([]);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("group_members")
        .select("groups(*)")
        .eq("user_id", user.id);
      const list = ((data ?? []) as unknown as { groups: GroupInfo }[]).map((g) => g.groups).filter(Boolean);
      setGroups(list);
      if (selected) setSelected(list.find((g) => g.id === selected.id) ?? null);
    } catch {
      /* silencieux */
    }
  }

  async function createGroup() {
    if (!groupName.trim()) return;
    setBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("groups")
        .insert({ name: groupName.trim(), owner_id: user.id })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id });
      toast.success(`Groupe « ${data.name} » créé ! 🎉`, { description: `Code d'invitation : ${data.invite_code}` });
      setGroupName("");
      await loadGroups();
      setSelected(data);
    } catch {
      toast.error("Impossible de créer le groupe.");
    } finally {
      setBusy(false);
    }
  }

  async function joinGroup() {
    if (!joinCode.trim()) return;
    setBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("join_group", { p_code: joinCode.trim() });
      if (error) throw error;
      toast.success(`Bienvenue dans « ${data.name} » ! 👋`);
      setJoinCode("");
      await loadGroups();
      setSelected(data);
    } catch (e) {
      toast.error((e as Error).message.includes("invalide") ? "Code de groupe invalide." : "Impossible de rejoindre le groupe.");
    } finally {
      setBusy(false);
    }
  }

  // Classement du groupe sélectionné
  useEffect(() => {
    if (!selected) return setRows([]);
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: members } = await supabase
          .from("group_members")
          .select("profiles(id, username, avatar_url, total_points)")
          .eq("group_id", selected.id);
        setRows(
          ((members ?? []) as unknown as {
            profiles: { id: string; username: string; avatar_url: string | null; total_points: number };
          }[])
            .map((m) => ({
              user_id: m.profiles.id,
              username: m.profiles.username,
              avatar_url: m.profiles.avatar_url,
              points: m.profiles.total_points,
              preds: 0,
            }))
            .sort((a, b) => b.points - a.points)
        );
      } catch {
        /* silencieux */
      }
    })();
  }, [selected]);

  return (
    <div className="space-y-6">
      {/* Créer / rejoindre */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card/70 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> Créer un groupe</p>
          <div className="flex gap-2">
            <Input placeholder="Nom du groupe…" value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={40} />
            <Button onClick={createGroup} disabled={busy || !groupName.trim()}>Créer</Button>
          </div>
        </div>
        <div className="rounded-xl border bg-card/70 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4 text-primary" /> Rejoindre un groupe</p>
          <div className="flex gap-2">
            <Input placeholder="Code d'invitation…" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} className="uppercase" />
            <Button onClick={joinGroup} disabled={busy || !joinCode.trim()}>Rejoindre</Button>
          </div>
        </div>
      </div>

      {/* Mes groupes */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelected(g)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected?.id === g.id ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              👥 {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Détail du groupe sélectionné */}
      {selected && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div>
              <p className="font-bold">{selected.name}</p>
              <p className="text-xs text-muted-foreground">Partage ce code avec tes amis :</p>
            </div>
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(selected.invite_code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
                toast.success("Code copié ! 📋");
              }}
              className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 font-mono text-lg font-bold tracking-widest"
            >
              {selected.invite_code}
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
          <LeaderboardTable rows={rows} currentUserId={currentUserId} />
        </div>
      )}

      {groups.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Tu n'es dans aucun groupe. Crée le tien et invite tes amis avec le code ! 🔑
        </p>
      )}
    </div>
  );
}
