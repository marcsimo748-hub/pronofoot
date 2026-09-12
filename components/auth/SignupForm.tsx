"use client";

/**
 * Inscription : pseudo + email + mot de passe (visible/masquable).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, AtSign, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { consumeRedirectAfterLogin } from "@/lib/auth-redirect";

export function SignupForm({
  onAuthed,
  onSwitchMode,
}: {
  /** Mode modale : appelé après inscription au lieu de naviguer */
  onAuthed?: () => void;
  /** Mode modale : basculer vers la connexion */
  onSwitchMode?: () => void;
} = {}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // 🧩 Module 2 : intention choisie à l'inscription (Emploi/Logement/Visa/Rencontre)
  const [intent, setIntent] = useState("");
  const INTENTS = [
    { v: "emploi", label: "💼 Emploi" },
    { v: "logement", label: "🏠 Logement" },
    { v: "visa", label: "🛂 Visa" },
    { v: "rencontre", label: "❤️ Rencontre" },
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // Pseudo déjà pris ?
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim())
        .maybeSingle();
      if (existing) {
        toast.error("Ce pseudo est déjà pris 😅 choisis-en un autre.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.trim() },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        toast.error(
          error.message === "User already registered"
            ? "Un compte existe déjà avec cet email."
            : error.message
        );
        return;
      }

      if (data.session) {
        // Confirmation email désactivée → directement connecté
        await fetch("/api/auth/ensure-admin", { method: "POST" }).catch(() => {});
        toast.success(`Bienvenue ${username} ! 🎉`);
        if (onAuthed) {
          onAuthed();
          return;
        }
        // Priorité : l'offre exacte mémorisée (redirectAfterLogin), puis l'intention
        const next = consumeRedirectAfterLogin();
        router.push(next && next.startsWith("/") ? next : intent ? "/prono-profil" : "/dashboard");
        router.refresh();
      } else {
        toast.success("Compte créé ! 🎉", {
          description: "Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.",
          duration: 8000,
        });
        router.push("/login");
      }
    } catch {
      toast.error("Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Pseudo</Label>
        <div className="relative">
          <User2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="username"
            placeholder="Ton pseudo de joueur"
            className="pl-9"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={24}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
        <Label htmlFor="password">Mot de passe</Label>
        <PasswordInput
          id="password"
          placeholder="6 caractères minimum"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label>Ton objectif principal ? <span className="text-muted-foreground">(optionnel)</span></Label>
        <div className="grid grid-cols-2 gap-2">
          {INTENTS.map((i) => (
            <button
              type="button"
              key={i.v}
              onClick={() => {
                setIntent(i.v);
                try { localStorage.setItem("pronofoot-intent", i.v); } catch {}
              }}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                intent === i.v
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-white/10 bg-background/50 text-muted-foreground hover:border-primary/30"
              }`}
            >
              {i.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Ton profil s&apos;adapte à ton objectif — CV, logement, visa ou rencontre.
        </p>
      </div>

      <Button type="submit" className="w-full" variant="glow" size="lg" disabled={loading}>
        <UserPlus className="h-4 w-4" />
        {loading ? "Création…" : "Créer mon compte gratuit"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        {onSwitchMode ? (
          <button
            type="button"
            onClick={onSwitchMode}
            className="font-semibold text-primary hover:underline"
          >
            Se connecter
          </button>
        ) : (
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        )}
      </p>
    </form>
  );
}
