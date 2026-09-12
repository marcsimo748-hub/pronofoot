"use client";

/**
 * ADMIN — 🤖 Assistant IA (outil 14).
 * Branche les clés API Groq / Gemini : l'assistant passe en IA complète
 * (tous les sujets, réponses en streaming). Sans clé : mode local limité.
 * Les clés sont stockées dans la table PRIVÉE prono_secrets (migration 012) :
 * jamais lisibles publiquement, jamais renvoyées en clair par l'API.
 */

import { useEffect, useState } from "react";
import { adminFetch } from "../adminShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type KeyStatus = { groq: boolean; gemini: boolean; env_groq: boolean; env_gemini: boolean };

export function AiKeysTool() {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [groqKey, setGroqKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = async () => {
    try {
      const data = await adminFetch<KeyStatus>("/api/admin/ai-keys", undefined, "GET");
      setStatus(data);
    } catch {
      toast.error("Impossible de lire le statut des clés.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (groqKey.trim()) body.groq_api_key = groqKey.trim();
      if (geminiKey.trim()) body.gemini_api_key = geminiKey.trim();
      if (!Object.keys(body).length) {
        toast.info("Rien à enregistrer : colle au moins une clé.");
        return;
      }
      const data = await adminFetch<KeyStatus>("/api/admin/ai-keys", body);
      setStatus(data);
      setGroqKey("");
      setGeminiKey("");
      toast.success("Clés enregistrées 🎉", { description: "L'assistant IA est désormais actif sur tout le site." });
    } catch {
      toast.error("Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (key: "groq_api_key" | "gemini_api_key") => {
    try {
      const data = await adminFetch<KeyStatus>("/api/admin/ai-keys", { [key]: "" });
      setStatus(data);
      toast.success("Clé supprimée.");
    } catch {
      toast.error("Échec de la suppression.");
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const data = await adminFetch<{ reply: string; provider: string }>("/api/admin/ai-keys", { test: true });
      toast.success(`Réponse du provider ${data.provider}`, { description: data.reply.slice(0, 120) });
    } catch {
      toast.error("Test impossible.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-sm">
        <p className="font-bold">🧠 Active l'IA complète de l'assistant</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sans clé, l'assistant répond en mode local limité (questions basiques sur le site uniquement).
          Avec une clé Groq ou Gemini, il devient une vraie IA : il répond à tous les sujets, réfléchit,
          et écrit ses réponses en direct mot à mot.
        </p>
      </div>

      {/* Statut */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Statut :</span>
        <Badge variant={status?.groq ? "default" : "secondary"} className={status?.groq ? "bg-emerald-500/20 text-emerald-400" : ""}>
          Groq {status?.groq ? "actif ✓" : "inactif"}
        </Badge>
        <Badge variant={status?.gemini ? "default" : "secondary"} className={status?.gemini ? "bg-emerald-500/20 text-emerald-400" : ""}>
          Gemini {status?.gemini ? "actif ✓" : "inactif"}
        </Badge>
        {(status?.env_groq || status?.env_gemini) && (
          <span className="text-[11px] text-muted-foreground">(une clé vient aussi des variables d&apos;environnement)</span>
        )}
      </div>

      {/* Clé Groq (recommandée) */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">Clé Groq (recommandée, gratuite et ultra rapide)</p>
        <div className="flex gap-2">
          <Input
            type="password"
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            placeholder={status?.groq ? "•••••••••• (remplacer la clé actuelle)" : "gsk_..."}
          />
          {status?.groq && (
            <Button variant="ghost" onClick={() => void remove("groq_api_key")} className="shrink-0 text-destructive">
              Supprimer
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Crée un compte gratuit sur console.groq.com puis API Keys → Create API Key. Plan gratuit, sans carte bancaire.
        </p>
      </div>

      {/* Clé Gemini */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">Clé Gemini (secours, facultatif)</p>
        <div className="flex gap-2">
          <Input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder={status?.gemini ? "•••••••••• (remplacer la clé actuelle)" : "AIza..."}
          />
          {status?.gemini && (
            <Button variant="ghost" onClick={() => void remove("gemini_api_key")} className="shrink-0 text-destructive">
              Supprimer
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          aistudio.google.com → Get API Key. Utilisée automatiquement si Groq tombe en panne.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="glow" onClick={() => void save()} disabled={saving || (!groqKey.trim() && !geminiKey.trim())}>
          {saving ? "Enregistrement…" : "💾 Enregistrer les clés"}
        </Button>
        <Button variant="outline" onClick={() => void test()} disabled={testing}>
          {testing ? "Test en cours…" : "🧪 Tester l'assistant"}
        </Button>
      </div>

      <p className="rounded-lg bg-secondary/40 p-3 text-[11px] text-muted-foreground">
        🔒 Sécurité : les clés sont stockées dans une table privée (prono_secrets), invisible
        pour les visiteurs et les membres. Seul le serveur du site les lit. Après enregistrement,
        l&apos;assistant bascule en IA complète en moins d&apos;une minute.
      </p>
    </div>
  );
}
