"use client";

/**
 * Page /reset-password — définition du nouveau mot de passe
 * après avoir cliqué sur le lien reçu par email.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Le lien email a dû établir une session (PKCE) via /api/auth/callback
  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      setReady(Boolean(data.session));
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("6 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe modifié ! 🔐");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Impossible de changer le mot de passe. Ouvre à nouveau le lien de l'email.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        <p className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" /> Lien requis</p>
        <p className="mt-1 text-xs">
          Pour définir un nouveau mot de passe, ouvre le lien reçu par email
          (page « Mot de passe oublié ? » depuis la connexion). Si tu l'as fermé, redemande-le.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
        <ShieldCheck className="h-4 w-4" /> Identité vérifiée — choisis ton nouveau mot de passe.
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <PasswordInput
          id="new-password"
          placeholder="6 caractères minimum"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmer</Label>
        <PasswordInput
          id="confirm-password"
          placeholder="Répète le mot de passe"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" variant="glow" size="lg" disabled={loading}>
        {loading ? "Enregistrement…" : "Définir mon nouveau mot de passe"}
      </Button>
    </form>
  );
}
