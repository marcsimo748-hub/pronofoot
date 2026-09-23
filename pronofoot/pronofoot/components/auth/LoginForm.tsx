"use client";

/**
 * Formulaire de connexion : email + mot de passe (visible/masquable),
 * lien « Mot de passe oublié ? » avec réinitialisation par email.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
        return;
      }
      // Les comptes listés dans ADMIN_EMAILS reçoivent les droits admin automatiquement
      await fetch("/api/auth/ensure-admin", { method: "POST" }).catch(() => {});
      toast.success("Bon retour ! ⚽");
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      toast.error("Saisis ton email ci-dessus d'abord 😉");
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Email de réinitialisation envoyé ! 📬");
    } catch {
      toast.error("Impossible d'envoyer l'email. Vérifie l'adresse.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="toi@exemple.com"
            className="pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <button
            type="button"
            onClick={forgotPassword}
            className="text-xs text-primary hover:underline"
          >
            Mot de passe oublié ?
          </button>
        </div>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {resetSent && (
        <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
          📬 Un lien de réinitialisation t'a été envoyé par email. Ouvre-le puis définis ton nouveau mot de passe.
        </p>
      )}

      <Button type="submit" className="w-full" variant="glow" size="lg" disabled={loading}>
        <LogIn className="h-4 w-4" />
        {loading ? "Connexion…" : "Se connecter"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Jouer gratuitement
        </Link>
      </p>
    </form>
  );
}
