"use client";

/**
 * global-error.tsx — boundary d'erreur du ROOT layout.
 * Ce fichier se substitue au root layout en cas de crash catastrophique
 * (police, hydration, providers). Doit inclure <html><body> car il les remplace.
 *
 * Volontairement minimaliste, sans dépendance UI (ni Tailwind ni providers).
 */

import { useEffect } from "react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[PRONO] root error", error?.digest ?? error?.message ?? error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a0a0f",
          color: "#f5f5f5",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <p style={{ fontSize: 64, fontWeight: 900, margin: 0, color: "#ef4444" }}>500</p>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginTop: 12 }}>
            PRONO est temporairement indisponible
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, marginTop: 8 }}>
            Le site a redémarré automatiquement suite à une erreur critique.
            Recharge la page dans quelques secondes.
          </p>
          {error?.digest && (
            <p style={{ fontSize: 11, opacity: 0.5, marginTop: 12, fontFamily: "monospace" }}>
              Réf. : {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Recharger la page
          </button>
        </div>
      </body>
    </html>
  );
}
