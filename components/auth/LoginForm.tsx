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
import { TurnstileWidget, useCaptchaConfig } from "./TurnstileWidget";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { consumeRedirectAfterLogin } from "@/lib/auth-redirect";

export function LoginForm({
  onAuthed,
  onSwitchMode,
}: {
  /** Mode modale : appelé après connexion au lieu de naviguer */
  onAuthed?: () => void;
  /** Mode modale : basculer vers l'inscription */
  onSwitchMode?: () => void;
} = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaConf = useCaptchaConfig();
  const captchaRequired = captchaConf?.enabled ?? false;
  const [resetSent, setResetSent] = useState(false);
  const [forgotMode, setForgotMode] = useState(false); // captcha anti-robot avant l'envoi du lien

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        // captchaToken doit être dans options:{} — sinon la librairie l'ignore (type SignInWithPasswordCredentials)
        ...(captchaToken ? { options: { captchaToken } } : {}),
      });
      if (error) {
        toast.error(
          /captcha/i.test(error.message)
            ? "Attends la vérification anti-robot (✓), puis clique à nouveau."
            : error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : error.message
        );
        setCaptchaToken(""); // jeton a usage unique → nouveau jeton
        if (typeof window !== "undefined") window.dispatchEvent(new Event("turnstile:reset"));
        return;
      }
      // Les comptes listés dans ADMIN_EMAILS reçoivent les droits admin automatiquement
      await fetch("/api/auth/ensure-admin", { method: "POST" }).catch(() => {});
      toast.success("Bon retour ! ⚽");
      if (onAuthed) {
        onAuthed();
        return;
      }
      // Priorité : paramètre ?next=, puis l'offre exacte mémorisée (redirectAfterLogin)
      const next = params.get("next") || consumeRedirectAfterLogin();
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }

  function startForgot() {
    if (!email.trim()) {
      toast.error("Saisis ton email ci-dessus d'abord 😉");
      return;
    }
    if (captchaRequired && !captchaToken) {
      setForgotMode(true); // le robot-check s'affiche, puis le bouton d'envoi
      return;
    }
    void forgotPassword();
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
        ...(captchaToken ? { captchaToken } : {}),
      });
      if (error) throw error;
      setCaptchaToken("");
      setForgotMode(false);
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
            onClick={startForgot}
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

      {captchaRequired && (
        <TurnstileWidget onToken={setCaptchaToken} />
      )}

      {forgotMode && captchaRequired && (
        <div className="space-y-2 rounded-lg border border-white/10 bg-secondary/40 p-3">
          <p className="text-xs text-muted-foreground">Passe la vérification anti-robot, puis envoie le lien 🤖</p>
          <TurnstileWidget onToken={setCaptchaToken} />
          <Button type="button" variant="outline" className="w-full" disabled={!captchaToken} onClick={forgotPassword}>
            🔒 Envoyer le lien de réinitialisation
          </Button>
        </div>
      )}

      {resetSent && (
        <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
          📬 Un lien de réinitialisation t'a été envoyé par email. Ouvre-le puis définis ton nouveau mot de passe.
        </p>
      )}

      <Button type="submit" className="w-full" variant="glow" size="lg" disabled={loading || captchaConf === null || (captchaRequired && !captchaToken)}>
        <LogIn className="h-4 w-4" />
        {loading ? "Connexion…" : "Se connecter"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        {onSwitchMode ? (
          <button
            type="button"
            onClick={onSwitchMode}
            className="font-semibold text-primary hover:underline"
          >
            Créer un compte gratuit
          </button>
        ) : (
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Jouer gratuitement
          </Link>
        )}
      </p>
    </form>
  );
}
