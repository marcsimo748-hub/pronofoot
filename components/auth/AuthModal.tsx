"use client";

/**
 * AuthModal — modale de connexion / inscription (CONNEXION REQUISE).
 * S'ouvre quand un visiteur non connecté clique sur Postuler, Contacter,
 * Publier ou Sauvegarder. Après authentification, redirection automatique
 * vers l'offre exacte cliquée (localStorage "redirectAfterLogin").
 */

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { consumeRedirectAfterLogin } from "@/lib/auth-redirect";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "signup";
  title?: string;
  message?: string;
}

export function AuthModal({ open, onOpenChange, defaultTab = "login", title, message }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);

  /** Après connexion / inscription : retour à l'offre exacte cliquée */
  const handleAuthed = () => {
    onOpenChange(false);
    const target = consumeRedirectAfterLogin();
    if (target && target.startsWith("/")) {
      router.push(target);
    }
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? "🔐 Connexion requise"}</DialogTitle>
          <DialogDescription>
            {message ??
              "Connecte-toi ou crée ton compte gratuit en 30 secondes, tu reviendras directement où tu étais."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Connexion
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Inscription
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Suspense fallback={<Skeleton className="h-72 w-full" />}>
              <LoginForm onAuthed={handleAuthed} onSwitchMode={() => setTab("signup")} />
            </Suspense>
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm onAuthed={handleAuthed} onSwitchMode={() => setTab("login")} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
