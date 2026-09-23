import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "Inscription" };

export default function SignupPage() {
  return (
    <Card className="glass shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Rejoins l'arène 🏟️</CardTitle>
        <CardDescription>Compte gratuit · pseudo, email, mot de passe. C'est tout.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
