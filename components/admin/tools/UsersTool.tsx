"use client";

/** 👥 Outil 11 : Gestion des joueurs — voir les comptes, promouvoir/retirer des admins */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { adminFetch } from "../adminShared";
import type { Profile } from "@/lib/types";

export function UsersTool() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => { void loadUsers(); }, []);

  async function loadUsers() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(200);
      setUsers((data ?? []) as Profile[]);
    } catch {
      /* silencieux */
    }
  }

  async function toggleAdmin(user: Profile) {
    try {
      await adminFetch("/api/admin/users", { user_id: user.id, is_admin: !user.is_admin });
      toast.success(!user.is_admin ? `${user.username} est maintenant admin 👑` : `${user.username} n'est plus admin.`);
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  const filtered = users.filter((u) => u.username.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un joueur…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {filtered.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarFallback className="text-xs">{u.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-medium">
                {u.username}
                {u.is_admin && <Badge variant="warning">👑 admin</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">
                {u.total_points} pts · inscrit le {new Date(u.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <Button
              size="sm"
              variant={u.is_admin ? "destructive" : "secondary"}
              onClick={() => toggleAdmin(u)}
              className="gap-1.5"
            >
              {u.is_admin ? <><ShieldOff className="h-3.5 w-3.5" /> Retirer</> : <><ShieldCheck className="h-3.5 w-3.5" /> Promouvoir</>}
            </Button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Aucun joueur trouvé.</p>
        )}
      </div>
    </div>
  );
}
