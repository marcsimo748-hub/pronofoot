import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function ResetPasswordPage() {
  return (
    <Card className="glass shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Nouveau mot de passe 🔑</CardTitle>
        <CardDescription>Choisis un mot de passe solide</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
