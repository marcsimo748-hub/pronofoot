"use client";

/**
 * 🔐 Outil Admin : Sécurité & E-mails.
 * - Cloudflare Turnstile : protection anti-robot (inscription, mot de passe oublié).
 *   Les clés sont testées puis stockées dans prono_secrets (privé).
 *   ⚠️ La clé SECRÈTE doit AUSSI être collée dans Supabase :
 *   Authentication → Captcha → Cloudflare Turnstile (c'est Supabase qui vérifie le jeton).
 * - Resend : envoi d'e-mails transactionnels + bouton d'e-mail de test.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminFetch } from "../adminShared";

type ProviderId = "turnstile_site" | "turnstile_secret" | "resend";

type ProviderStatus = {
  id: ProviderId;
  label: string;
  needsKey: boolean;
  dbKey?: string | null;
  envKey?: string | null;
  source: "admin" | "vercel" | "none" | "always";
};

type KeyTest = {
  httpStatus: number;
  ok: boolean;
  liveFixturesFound: number;
  errors: Record<string, string> | null;
  quotaRemaining: string | null;
  message?: string;
};

const CARDS: { id: ProviderId; desc: string; hint: string }[] = [
  {
    id: "turnstile_site",
    desc: "Clé PUBLIQUE affichée dans le widget anti-robot des formulaires (inscription, mot de passe oublié).",
    hint: "dash.cloudflare.com → Turnstile → ton site → Site Key (0x…)",
  },
  {
    id: "turnstile_secret",
    desc: "Clé SECRÈTE vérifiée par Cloudflare · reste sur le serveur, jamais dans le navigateur. Testée ici avec un jeton factice.",
    hint: "dash.cloudflare.com → Turnstile → ton site → Secret Key (0x…)",
  },
  {
    id: "resend",
    desc: "Envoi des e-mails du site (tests, futures notifications). Test sans consommation : simple lecture de ton compte.",
    hint: "resend.com → API Keys (re_…)",
  },
];

export function SecurityEmailTool() {
  const [statuses, setStatuses] = useState<ProviderStatus[] | null>(null);
  const [keyInput, setKeyInput] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, KeyTest | null>>({});
  const [emailBusy, setEmailBusy] = useState(false);

  const loadStatuses = async () => {
    try {
      const data = await adminFetch<{ providers: ProviderStatus[] }>("/api/admin/provider-keys", undefined, "GET");
      setStatuses(data.providers);
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => {
    void loadStatuses();
  }, []);

  async function saveKey(provider: ProviderId) {
    const k = (keyInput[provider] ?? "").trim();
    if (!k) {
      toast.error("Colle d'abord la clé.");
      return;
    }
    setSaving(provider);
    setTests((t) => ({ ...t, [provider]: null }));
    try {
      const data = await adminFetch<{ saved: boolean; test: KeyTest | null }>("/api/admin/provider-keys", {
        provider,
        key: k,
      });
      setTests((t) => ({ ...t, [provider]: data.test }));
      if (data.test?.ok) {
        toast.success("Clé enregistrée et validée ✅", { description: data.test.message });
      } else {
        toast.error("Clé refusée ❌", {
          description: data.test?.errors ? Object.values(data.test.errors).join(" ") : "Format ou clé invalide",
        });
      }
      setKeyInput((i) => ({ ...i, [provider]: "" }));
      await loadStatuses();
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'enregistrement.");
    } finally {
      setSaving(null);
    }
  }

  async function testProvider(provider: ProviderId) {
    setSaving(provider);
    setTests((t) => ({ ...t, [provider]: null }));
    try {
      const data = await adminFetch<{ hasKey: boolean; test: KeyTest | null }>("/api/admin/provider-keys", {
        provider,
        test: true,
      });
      setTests((t) => ({ ...t, [provider]: data.test }));
      if (data.test?.ok) toast.success("Validé ✅", { description: data.test.message });
      else
        toast.error("Problème ❌", {
          description: data.test?.errors ? Object.values(data.test.errors).join(" ") : "Clé absente ou refusée.",
        });
    } catch {
      toast.error("Échec du test.");
    } finally {
      setSaving(null);
    }
  }

  async function sendTestEmail() {
    setEmailBusy(true);
    try {
      const res = await fetch("/api/admin/test-email", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        toast.success(`E-mail envoyé à ${json.to} 📬`, { description: json.detail });
      } else {
        toast.error("Échec de l'envoi", { description: json.detail ?? json.error });
      }
    } catch {
      toast.error("Échec de l'envoi.");
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Protection anti-robot des formulaires (Turnstile) et envoi d&apos;e-mails (Resend). Les clés vivent dans la
        table privée <strong>prono_secrets</strong> · jamais sur GitHub, jamais dans le navigateur.
      </p>

      <div className="space-y-3">
        {CARDS.map((c) => {
          const st = statuses?.find((s) => s.id === c.id);
          const test = tests[c.id];
          return (
            <div key={c.id} className="space-y-2 rounded-xl border border-white/10 bg-secondary/30 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold">{st?.label ?? c.id}</h4>
                <Badge variant={st?.source === "admin" ? "default" : st?.source === "vercel" ? "secondary" : "destructive"}>
                  {st?.source === "admin"
                    ? `Clé Admin (${st.dbKey})`
                    : st?.source === "vercel"
                    ? `Clé Vercel (${st.envKey})`
                    : "Aucune clé"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
              <p className="text-[11px] text-muted-foreground/70">Créer la clé : {c.hint}</p>
              <div className="flex flex-wrap gap-2">
                <Input
                  type="password"
                  placeholder="Coller la clé…"
                  value={keyInput[c.id] ?? ""}
                  onChange={(e) => setKeyInput((i) => ({ ...i, [c.id]: e.target.value }))}
                  className="min-w-[200px] flex-1"
                />
                <Button size="sm" onClick={() => saveKey(c.id)} disabled={saving === c.id}>
                  <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                  {saving === c.id ? "Test…" : "💾 Enregistrer + tester"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => testProvider(c.id)} disabled={saving === c.id}>
                  🧪 Tester
                </Button>
              </div>
              {test && (
                <div
                  className={`rounded-lg border p-2.5 text-xs ${
                    test.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"
                  }`}
                >
                  <p className="font-bold">{test.ok ? "✅ Validé" : "❌ Problème"}</p>
                  {test.message && <p className="mt-0.5">{test.message}</p>}
                  {test.errors && <p className="mt-1 font-mono text-[11px] opacity-80">{JSON.stringify(test.errors)}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 📧 E-mail de test */}
      <div className="space-y-2 rounded-xl border border-white/10 bg-secondary/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold">
              <Mail className="h-4 w-4 text-primary" /> E-mail de test
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Envoie un e-mail à ton adresse admin pour valider la clé Resend. Sans domaine vérifié, Resend
              n&apos;envoie qu&apos;à l&apos;adresse de ton compte Resend (mode test).
            </p>
          </div>
          <Button onClick={sendTestEmail} disabled={emailBusy} className="gap-2">
            <Mail className="h-4 w-4" />
            {emailBusy ? "Envoi…" : "📨 Envoyer le test"}
          </Button>
        </div>
      </div>

      {/* ⚠️ Etape Supabase pour activer le anti-robot */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
        <p className="font-bold text-amber-300">⚠️ Dernière étape pour activer l&apos;anti-robot</p>
        <p className="mt-1.5 text-muted-foreground">
          La clé secrète Turnstile doit AUSSI être collée dans Supabase : ouvre{" "}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            supabase.com/dashboard <ExternalLink className="h-3 w-3" />
          </a>{" "}
          → ton projet → <strong>Authentication</strong> → <strong>Captcha</strong> → choisis{" "}
          <strong>Cloudflare Turnstile</strong> → colle la Site Key + la Secret Key → <strong>Save</strong>.
          C&apos;est Supabase qui vérifie le jeton côté serveur : sans jeton valide, aucune inscription possible.
        </p>
      </div>
    </div>
  );
}
