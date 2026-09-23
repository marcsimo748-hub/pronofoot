"use client";

/**
 * Bouton « Passer Premium » — Phase 3 (paiements).
 * Propose le moyen adapté au joueur : PayPal (Europe) ou Mobile Money (Afrique).
 * Aucune carte bancaire — choix du propriétaire du site.
 * Affiché UNIQUEMENT quand un moyen de paiement est configuré côté serveur ;
 * sinon /tarifs continue d'afficher le bouton « bientôt » d'origine.
 */

import { useState } from "react";
import { Sparkles, Loader2, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

type Method = "paypal" | "mobile_money";

export default function PremiumCheckoutButton({ paypalReady, mobileMoneyReady }: { paypalReady: boolean; mobileMoneyReady: boolean }) {
  const [busy, setBusy] = useState<Method | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function startCheckout(method: Method) {
    setBusy(method);
    setMessage(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const json = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (json.ok && json.url) {
        window.location.href = json.url; // → page de paiement PayPal ou Mobile Money
        return;
      }
      setMessage(json.error ?? "Paiement indisponible pour le moment.");
    } catch {
      setMessage("Connexion impossible · réessaie dans un instant.");
    }
    setBusy(null);
  }

  return (
    <div className="mt-6 w-full space-y-2.5">
      {paypalReady && (
        <Button onClick={() => startCheckout("paypal")} disabled={busy !== null} className="w-full">
          {busy === "paypal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          {busy === "paypal" ? "Redirection sécurisée…" : "Payer par PayPal"}
        </Button>
      )}
      {mobileMoneyReady && (
        <Button onClick={() => startCheckout("mobile_money")} disabled={busy !== null} variant="outline" className="w-full">
          {busy === "mobile_money" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
          {busy === "mobile_money" ? "Redirection sécurisée…" : "Payer par Mobile Money (MTN, Orange…)"}
        </Button>
      )}
      {message && <p className="mt-1 text-center text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
