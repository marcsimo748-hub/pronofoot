# 🔍 Audit — 17 objectifs vs état réel du site (19/09/2026)

Prod : https://pronofoot-phi.vercel.app · Next.js 14.2.15 + TypeScript · 26 tables Supabase · migrations 001→015 · 112 statements RLS/policies · FR/EN/DE

| # | Objectif demandé | État | Détail |
|---|---|---|---|
| — | Next.js + TypeScript | ✅ Fait | Next 14.2.15, TS strict |
| — | shadcn/ui | ✅ Fait | Button, Input, Badge, Dialog, Tabs, Skeleton, Sonner… |
| — | Vercel | ✅ Fait | Déploiement auto via GitHub |
| 1 | Interface moderne, responsive, rapide | ✅ Fait | Thème football, mobile-first, force-dynamic |
| 2 | Page d'accueil claire | ✅ Fait | Hero, ServicesGrid, FeaturesGrid, HowItWorks, prochains matchs |
| 3 | Pronostics + filtres date/championnat/statut | 🟡 Partiel | Onglets championnats ✓ + groupement par jour ✓ — **filtres date & statut à ajouter** |
| 4 | Tableau de bord utilisateur | 🟡 Partiel | Points, rang, historique ✓ — **graphiques Recharts à ajouter** |
| 5 | Plans gratuit + premium | ❌ À faire | Page /tarifs à créer (sans paiement) |
| 6 | Vente d'abonnements sans exposer de clés | ⏳ Préparé | Aucune clé dans le frontend ✓ ; Stripe = phase future (aucune clé stockée avant activation) |
| 7 | Supabase Auth + RLS correcte | ✅ Fait | Auth email+mot de passe, RLS sur toutes les tables, prono_secrets durci (3 couches) |
| 8 | Clés API uniquement en variables d'env | ✅ Fait | Vercel env + prono_secrets (Admin), jamais dans le repo |
| 9 | Cache pour économiser API-Football | ✅ Fait | Bascule auto multi-fournisseurs, throttle, standings_cache, quota suivi, skipApiFootball <10 |
| 10 | Erreurs, limites API, chargements | ✅ Fait | try/catch par fournisseur, skeletons, toasts, throttles |
| 11 | Cloudflare Turnstile sur formulaires sensibles | ❌ À faire | Nécessite un compte Cloudflare (gratuit) → site key + secret |
| 12 | Mobile, SEO, vitesse, accessibilité | 🟡 Bon | sitemap+robots ✓, lang fr ✓ — manifeste PWA manquant (héritage audit) |
| 13 | Jamais de clé/token dans le frontend | ✅ Fait | Vérifié : seules les anon keys (publiques) sont exposées |
| 14 | Jamais désactiver RLS | ✅ Fait | RLS activée partout, aucune désactivation |
| 15 | Ne pas promettre de gains garantis | ✅ Fait | Grep complet : aucune promesse de gain. Jeu à points entre joueurs |
| 16 | Migrations SQL + policies RLS fournies | ✅ Fait | supabase/migrations/001→015 dans le repo |
| 17 | Confirmation avant modif risquée | ✅ Procédure | Rien de cassé ; les ajouts ci-dessous sont purement additifs |

## Variables d'environnement actuelles
Vercel : SUPABASE_URL/ANON/SERVICE_ROLE, API_SPORTS_KEY, FOOTBALL_DATA_KEY (via Admin), RAPIDAPI_KEY (via Admin), GROQ/GEMINI (via Admin), GNEWS, ADZUNA, CRON_SECRET…
À ajouter plus tard : `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`.

## Plan en 3 phases (additif, zéro destruction)
**Phase 1 — sans aucun compte externe (aujourd'hui)**
1. Filtres date + statut sur /pronos (les onglets championnats existent déjà)
2. Graphiques Recharts dans le dashboard (points cumulés + réussite par championnat)
3. Page /tarifs : Gratuit vs Premium, « paiement bientôt disponible », zéro promesse de gain
4. Manifeste PWA (icône, couleurs) — améliore mobile + SEO

**Phase 2 — nécessite TES comptes gratuits (prochain tour)**
5. Cloudflare Turnstile (signup/annonces) — tu crées le compte, je branche tout
6. Resend (e-mails transactionnels) — tu crées le compte, clé gérable dans l'Admin

**Phase 3 — quand tu décides de vendre**
7. Stripe Checkout (webhook serveur uniquement, clé secrète en env Vercel, jamais dans le code)

## Règles de sécurité conservées
Clés jamais sur GitHub · jamais dans le frontend · RLS jamais désactivée · pas de promesse de gains · paiements uniquement côté serveur.
