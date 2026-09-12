# ⚽ PRONOFOOT

> **Pronostics football · Scores live · News · Musique · Assistant IA — 100% gratuit, réel et fonctionnel**
>
> Développé par **Leprince Matt** pour **MalihaprodBerlin**
> 📱 WhatsApp : [+49 152 1051 5347](https://wa.me/4915210515347) · ✉️ [marcsimo748@gmail.com](mailto:marcsimo748@gmail.com)
>
> **Comptes :** GitHub : `marcsimo748-hub` · Vercel : `marcsimo748-9753` · Supabase : `marcsimo748-hub`

---

## 🎯 Ce que fait le site

| Module | Description |
|---|---|
| ⚽ **Pronostics** | 629 matchs saison 2026-27 (Ligue des Champions + Premier League, LaLiga, Serie A, Ligue 1, Bundesliga) des **19 équipes vedettes**. Verrouillage automatique au coup d'envoi. |
| 🏆 **Points automatiques** | Score exact = **5 pts**, bon résultat = **3 pts**. Bonus de saison : champion = 50 pts, coupe = 30 pts, LDC = 75 pts, finaliste = 30 pts, buteur = 25 pts. **Calcul 100% automatique en SQL** dès qu'un résultat est connu. |
| 🔴 **Scores live** | API-FOOTBALL (api-sports.io) avec cache Supabase + temps réel. Le site ne demande JAMAIS l'API directement depuis le navigateur. |
| 📰 **News monde** | GNews API + fallback **Google News RSS (gratuit, sans clé, testé et fonctionnel)**. Cache 10 minutes. |
| 🎵 **Musique** | MP3 stockés dans Supabase Storage. Lecteur global : la musique **continue pendant la navigation** (shuffle, répétition, progression). |
| 🤖 **Assistant IA** | GROQ (llama-3.1-70b) → Gemini → réponses locales. Widget flottant, historique sauvegardé par joueur. |
| 👤 **Joueurs** | Comptes email + mot de passe (👁 visible/masquable), **mot de passe oublié par email**, espace personnel (stats, pronostics, historique), groupes d'amis à code d'invitation. |
| 🏆 **Classements** | Général · par championnat · mensuel · entre amis — mis à jour automatiquement. |
| ⚙️ **Admin — 11 outils** | Activation : **5 clics sur le logo PRONOFOOT** → « 🔓 PASS VIP ADMIN ACTIVÉ ! » |
| 🤖 **Automatique** | Matchs passés retirés tout seuls, nouveaux matchs importés tout seuls, quotas API surveillés avec mise en pause automatique. |

### Les 11 outils admin
1. ⚡ Synchro API-Sports · 2. 🔴 Mode Testeur LIVE · 3. ⚽ Saisie Manuelle (+ clôture bonus) · 4. 🖼️ Fonds d'Écran Globaux · 5. 🏟️ Bannières par Championnat · 6. 🖼️ Arrière-plans par Championnat · 7. 🎵 Playlist MP3 · 8. 🎨 Couleur du Thème · 9. 📢 Annonce Publique · 10. 📊 Statistiques Cloud · 11. 👥 Gestion des Joueurs

---

# 🚀 DÉPLOIEMENT RÉEL — GUIDE PAS À PAS

> Tout est **gratuit** : Supabase Free · Vercel Hobby · API-Sports Free · GNews Free ·
> Google News RSS illimité · Groq Free · Gemini Free · cron-job.org Free.
> Aucune donnée fictive : tu contrôles tout depuis tes vrais comptes.

---

## ÉTAPE 1 — Mettre le code sur GitHub (compte `marcsimo748-hub`)

### 1.1 Créer le dépôt sur GitHub
1. Ouvre **https://github.com/new** (connecté avec `marcsimo748-hub`).
2. **Repository name** : `pronofoot`
3. Visibilité : **Public** (obligatoire pour que Vercel Hobby le déploie gratuitement sans frais)
4. ⚠️ **NE coche AUCUNE case** (pas de README, pas de .gitignore, pas de licence — tout est déjà dans le code).
5. Clique **Create repository**.

### 1.2 Envoyer le code (deux options)

**Option A — depuis l'archive `pronofoot.zip`** (télécharge-la depuis l'espace de travail) :
```bash
# Décompresse pronofoot.zip où tu veux, puis dans le dossier décompressé :
cd pronofoot
git init -b main
git add .
git commit -m "PRONOFOOT v1.0"
git remote add origin https://github.com/marcsimo748-hub/pronofoot.git
git push -u origin main
```
*(Git te demandera de te connecter à GitHub — suis la fenêtre qui s'ouvre.)*

**Option B — interface web GitHub (sans installer git)** :
1. Sur la page du dépôt fraîchement créé, clique **« uploading an existing file »**.
2. Glisse-dépose **le contenu décompressé de pronofoot.zip** (dossiers `app`, `components`, `lib`, `supabase`, etc. — PAS `node_modules`).
3. Clique **Commit changes**.

✅ **Résultat :** https://github.com/marcsimo748-hub/pronofoot contient tout le code source.

---

## ÉTAPE 2 — Créer la base de données Supabase (compte `marcsimo748-hub`)

### 2.1 Créer le projet
1. Ouvre **https://supabase.com/dashboard** (connecté avec ton compte `marcsimo748-hub`).
2. Clique **New project**.
3. **Name** : `pronofoot` · **Database Password** : choisis un mot de passe **et note-le** (ex. dans ton téléphone).
4. **Region** : `Central EU (Frankfurt)` — le plus proche de Berlin.
5. Clique **Create new project** et attends ~2 minutes.

### 2.2 Récupérer tes 3 clés Supabase (OBLIGATOIRE)
Dans le dashboard du projet : **⚙️ Project Settings → API**. Copie les 3 valeurs :
| Clé | Nom exact dans Supabase | Où |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (ex. `https://abcdxyz.supabase.co`) | Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project API keys → `anon` `public`** | Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project API keys → `service_role`** (⚠️ secrète — clique sur Reveal) | Settings → API |

### 2.3 Créer les tables (3 scripts SQL à exécuter)
Dans Supabase : **SQL Editor → New query** → colle le contenu d'un fichier → **Run** → attends « Success » :
1. D'abord **`supabase/migrations/001_schema.sql`** → crée toutes les tables, la sécurité RLS, les fonctions de calcul de points, les buckets Storage `songs` et `media`.
2. Puis **`supabase/migrations/002_seed_matches.sql`** → insère les **629 matchs** de la saison.
3. Enfin **`supabase/migrations/003_seed_data.sql`** → crée la playlist par défaut (vide).

✅ **Vérification :** dans **Table Editor**, tu dois voir les tables `matches` (629 lignes), `profiles`, `predictions`, `live_scores`, `news`, `songs`, `chat_history`, `groups`, `site_settings`…

### 2.4 Configurer la connexion des joueurs
Dans **Authentication → Sign In / Up** :
- **Email** : activé (par défaut).
- 💡 Pour tester plus vite : désactive **« Confirm email »** (les comptes se connectent immédiatement). Tu pourras le réactiver plus tard.

Dans **Authentication → URL Configuration** :
- **Site URL** : `https://pronofoot.vercel.app` ← remplace par ton **vrai domaine final** donné par Vercel à l'étape 4 (ou ton domaine perso).
- **Redirect URLs** → Add URL :
  - `http://localhost:3000/api/auth/callback` (tests locaux)
  - `https://TON-DOMAINE.vercel.app/api/auth/callback` (production)

---

## ÉTAPE 3 — Créer les vraies clés API (toutes gratuites)

### 3.1 🔴 API-Sports / API-FOOTBALL — les scores live réels
1. Va sur **https://dashboard.api-football.com/register** et inscris-toi (plan **Free** : 100 requêtes/jour).
2. Une fois connecté, sur le **Dashboard**, ta clé est affichée dans la carte **« API KEY »** → copie-la.
3. Cette clé active : scores live réels, import automatique des matchs des 19 équipes, classements des championnats.
> ⚠️ Quota gratuit = 100 appels/jour → c'est pour ça qu'on mettra `SCORES_SYNC_INTERVAL=900` (synchro toutes les 15 min). Le **Mode Testeur LIVE** (admin) et la **saisie manuelle** restent illimités. Un garde-fou intégré met le site en pause si le quota du jour est presque épuisé.

### 3.2 📰 GNews — les actualités
1. Va sur **https://gnews.io/register** et crée un compte (plan gratuit : 100 requêtes/jour).
2. Dans ton **Dashboard gnews.io**, la clé **API Key** est affichée → copie-la.
> Même sans cette clé, **les news fonctionnent déjà** grâce au fallback Google News RSS (gratuit et illimité — déjà testé ✅). La clé GNews améliore juste la qualité.

### 3.3 🤖 Groq — l'assistant IA principal
1. Va sur **https://console.groq.com** → **Login with GitHub** (ton compte `marcsimo748-hub`).
2. Dans le menu de gauche : **API Keys → Create API Key**.
3. Nom : `pronofoot` → **Submit** → copie la clé (`gsk_...`).

### 3.4 ✨ Gemini — l'assistant IA de secours
1. Va sur **https://aistudio.google.com/apikey** (connecté avec ton compte Google).
2. Clique **Get API key → Create API key** → choisis un projet ou crées-en un → copie la clé.

### 3.5 🕐 cron-job.org — la synchronisation automatique 24h/24 (gratuit)
1. Va sur **https://cron-job.org** → **Create a free account**.
2. On l'utilisera à l'ÉTAPE 5 pour déclencher les synchros même quand personne n'est sur le site.

---

## ÉTAPE 4 — Déployer sur Vercel (compte `marcsimo748-9753`)

1. Ouvre **https://vercel.com** → **Login with GitHub** (autorise ton compte `marcsimo748-hub`).
2. Clique **Add New → Project**.
3. Dans la liste, **Import** le dépôt `marcsimo748-hub/pronofoot`.
   *(S'il n'apparaît pas : clique « Adjust GitHub App permissions » et autorise l'accès au dépôt.)*
4. Framework Preset : **Next.js** (détecté automatiquement — ne change rien).
5. **Avant de cliquer Deploy**, ouvre **Environment Variables** et ajoute TOUTES ces variables :

| Nom | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ton Project URL Supabase (étape 2.2) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ta clé anon (étape 2.2) |
| `SUPABASE_SERVICE_ROLE_KEY` | ta clé service_role (étape 2.2) |
| `NEXT_PUBLIC_SITE_URL` | `https://TON-DOMAINE.vercel.app` (tu le verras après le 1er déploiement — tu pourras revenir l'ajouter) |
| `ADMIN_EMAILS` | `marcsimo748@gmail.com` |
| `API_SPORTS_KEY` | ta clé API-FOOTBALL (étape 3.1) |
| `GNEWS_API_KEY` | ta clé GNews (étape 3.2) — *optionnel mais recommandé* |
| `GROQ_API_KEY` | ta clé Groq (étape 3.3) |
| `GEMINI_API_KEY` | ta clé Gemini (étape 3.4) |
| `CRON_SECRET` | un mot de passe inventé par toi (ex. `Pronofoot2026Secret!`) — le même que dans cron-job.org |
| `SCORES_SYNC_INTERVAL` | `900` *(15 min, recommandé pour le quota gratuit ; mets `90` si tu passes API-Sports en payant)* |

6. Clique **Deploy** → attends ~2 minutes → 🎉 ton site est en ligne sur `https://pronofoot-xxxx.vercel.app`.
7. Ajoute le domaine exact dans **Settings → Environment Variables → `NEXT_PUBLIC_SITE_URL`**, et mets ce même domaine dans **Supabase → Authentication → URL Configuration** (Site URL + Redirect URLs) puis **Redeploy** (Deployments → ⋯ → Redeploy).

> ⚠️ **Note Cron Jobs Vercel** : le plan **Hobby (gratuit)** limite les crons natifs Vercel à **1 exécution par jour maximum**. C'est pourquoi `vercel.json` ne contient que le **nettoyage quotidien des matchs passés** (tous les jours à 4h00 UTC). Les syncs fréquents (scores toutes les 15 min, news toutes les 10 min) sont assurés par **cron-job.org** — gratuit et illimité — voir l'ÉTAPE 5, et par le **SyncManager intégré** au site dès qu'un visiteur est connecté.

✅ **Le site est LIVE.** Chaque `git push` sur GitHub redéploie automatiquement le site.

---

## ÉTAPE 5 — Activer les synchros automatiques 24h/24 (cron-job.org)

Sur **https://cron-job.org → Create Cronjob**, crée ces 2 tâches :

**Tâche 1 — Scores (toutes les 15 minutes)**
- **URL** : `https://TON-DOMAINE.vercel.app/api/scores/sync`
- **Schedule** : `Every 15 minutes`
- **Advanced → Headers** : `Authorization` = `Bearer TON_CRON_SECRET`

**Tâche 2 — News (toutes les 10 minutes)**
- **URL** : `https://TON-DOMAINE.vercel.app/api/news/sync`
- **Schedule** : `Every 10 minutes`
- **Advanced → Headers** : `Authorization` = `Bearer TON_CRON_SECRET`

> 💡 En plus de ça, le site a un **SyncManager intégré** : dès qu'un visiteur est en ligne, les synchros se déclenchent toutes seules. Les crons cron-job.org garantissent la mise à jour même à 4h du matin, et gardent ton projet Supabase actif.

---

## ÉTAPE 6 — Deviens admin et prends le contrôle 👑

1. Sur ton site en ligne, clique **« Créer mon compte gratuit »** avec l'email **`marcsimo748@gmail.com`** (celui de `ADMIN_EMAILS`) et un pseudo.
2. Connecte-toi → les droits admin s'appliquent automatiquement.
3. **Clique 5 fois de suite sur le logo PRONOFOOT** (en haut à gauche) →
   « 🔓 **PASS VIP ADMIN ACTIVÉ !** » → l'onglet **⚙️ Admin** apparaît en haut et en bas.
4. Dans **⚙️ Admin**, tu peux :
   - ⚡ lancer une synchro et voir le **quota API restant**
   - 🔴 activer le **Mode Testeur LIVE** pour voir des scores défiler (sans toucher aux points)
   - ⚽ **saisir un résultat** (recherche un match) → les points des joueurs sont calculés automatiquement
   - 🎵 **uploader tes MP3** (directement dans Supabase Storage)
   - 🎨 changer la couleur du site, 🖼️ les fonds d'écran, 🏟️ les bannières par championnat
   - 📢 publier une annonce, 📊 voir les stats, 👥 gérer les joueurs

---

## 🌍 Faire tourner le site en local (optionnel)

```bash
# Prérequis : Node.js 18+ (https://nodejs.org)
npm install
cp .env.example .env.local    # puis remplis avec tes vraies clés (étapes 2 et 3)
npm run dev                   # → http://localhost:3000
```

---

## 📁 Structure du projet

```
app/            → pages Next.js 14 (App Router) + routes API
  (main)/       → landing, pronos, scores, news, music, classement, dashboard, admin
  (auth)/       → login (👁 mot de passe visible + oublié), signup, reset-password
  api/          → chat (IA), scores/sync, news/sync, matches/cleanup, auth/*, admin/*
components/     → ui (Shadcn), scores, news, music, ai, layout, pronos, classement,
                  dashboard, auth, landing, admin (+ les 11 outils)
lib/            → supabase (client/server/admin), services (football, news, music,
                  ai, predictions, settings), hooks, store (Zustand), constants, types
supabase/migrations/  → 001_schema.sql, 002_seed_matches.sql (629 matchs), 003_seed_data.sql
scripts/generate-seed.mjs  → régénère le calendrier des matchs si besoin
middleware.ts   → session + protection des routes
vercel.json     → crons
```

**Règles d'or respectées :** aucun composant n'appelle une API externe (tout passe par `/lib/services/`, côté serveur) · Zustand pour lecteur musique et IA · Server Components par défaut · les points sont calculés en SQL (impossible à falsifier côté client) · RLS sur toutes les tables.

---

## 🛠 Dépannage

| Problème | Solution |
|---|---|
| Vercel ne trouve pas le dépôt | Vercel → Settings → Git → Adjust GitHub App permissions → autoriser `pronofoot` |
| « Invalid login credentials » | Vérifie Authentication → URL Configuration (Site URL + redirects) ; ou désactive « Confirm email » |
| Pas de scores live | Vérifie `API_SPORTS_KEY` dans Vercel → Admin → ⚡ Synchro (regarde le quota) ; sinon utilise 🔴 Testeur LIVE ou ⚒ la saisie manuelle |
| Pas de news | Ça marche sans clé via Google RSS ; sinon vérifie `GNEWS_API_KEY` |
| L'IA répond en « mode local » | Ajoute `GROQ_API_KEY` (ou `GEMINI_API_KEY`) dans Vercel → Redeploy |
| Onglet Admin absent | Il faut être connecté avec un email de `ADMIN_EMAILS`, puis 5 clics sur le logo |
| Projet Supabase en pause | Les projets gratuits s'endorment après 1 semaine sans activité — les crons cron-job.org le maintiennent éveillé |
| Emails de reset lents | Supabase gratuit = 2 emails/heure ; patiente ou vérifie les spams |

---

## 📞 Contact & support

**Développeur : Leprince Matt — MalihaprodBerlin**
📱 WhatsApp : [+49 152 1051 5347](https://wa.me/4915210515347)
✉️ [marcsimo748@gmail.com](mailto:marcsimo748@gmail.com)

Bon jeu et bonne saison ! ⚽🏆

## 🆕 MODULE PRONOJOB — agrégateur d'offres d'emploi (`/prono-job`)

Recherche d'emploi Allemagne / Europe / télétravail, 100% légale (API officielles, aucun scraping).

### Sources
| Source | Couverture | Clé requise |
|---|---|---|
| **Arbeitnow** | Allemagne + Europe | ❌ Aucune |
| **Remotive** | Télétravail mondial | ❌ Aucune |
| **Adzuna** | Monde (de, fr…) | ✅ Gratuite sur [developer.adzuna.com](https://developer.adzuna.com) → `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` |
| **JSearch** (RapidAPI) | Indeed + LinkedIn | ✅ Gratuite sur [rapidapi.com](https://rapidapi.com) → `RAPIDAPI_KEY` (plan gratuit limité, optionnel) |

### Activation (2 minutes)
1. **Exécuter le SQL** `supabase/migrations/004_prono_jobs.sql` dans Supabase → SQL Editor
   (tables `prono_jobs`, `prono_job_prefs`, `prono_applications`).
   → Active le PronoScore personnalisé + le suivi des candidatures.
   ⚠️ Sans ce script, la page fonctionne quand même en **lecture directe des API**.
2. **Cron 6 h** sur [cron-job.org](https://cron-job.org) :
   - URL : `https://pronofoot-phi.vercel.app/api/cron/jobs`
   - Toutes les **6 heures** (0 */6 * * *)
   - (Optionnel) Header `Authorization: Bearer <CRON_SECRET>` si défini.
3. (Optionnel) Ajouter `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` dans Vercel → Settings → Environment Variables.

### Ce que fait le module
- 🔍 Filtres : recherche, ville, pays, contrat, télétravail, source.
- 🎯 **PronoScore** : % de compatibilité entre ton profil (mots-clés, ville, allemand, anglais, contrat) et chaque offre.
- 🚀 **Postuler depuis Pronofoot** : ouvre l'offre originale + enregistre la candidature dans ton dashboard.
- ⚖️ Légal : titre + extrait court + lien source uniquement, jamais la description complète.
- 🧹 Purge automatique des offres de plus de 30 jours.

## 🆕 MODULE 2 PRONOPROFIL & PRONOCV (`/prono-profil`)

Un seul compte, plusieurs profils selon ton besoin — et un générateur de CV gratuit.

### Fonctionnement
- **À l'inscription**, le joueur choisit son objectif : 💼 Emploi / 🏠 Logement / 🛂 Visa / ❤️ Rencontre.
- **Le formulaire s'adapte** : Emploi → CV + expériences + diplômes + langues ; Visa → pays, type de visa, niveau d'allemand ; Logement → ville, budget, type ; Rencontre → recherche, tranche d'âge.
- **1 profil par intention** (table `prono_profiles`, `unique(user_id, intention)`), modifiable à tout moment.
- **Créateur de CV automatique** : 3 templates professionnels (🚀 Moderne, 🎩 Classique, 🇩🇪 Allemand Ausbildung) — export PDF via `react-to-pdf`.
- **Pont automatique** : le profil Emploi alimente le PronoScore de PronoJob (`prono_job_prefs`).

### Activation (1 minute)
Exécuter le SQL `supabase/migrations/005_prono_profiles.sql` dans Supabase → SQL Editor.
Sans ce script, la page s'affiche mais l'enregistrement renvoie `no_table`.

## 🆕 MODULE 3 PRONOVISA (`/prono-visa`)

Calculateur de chances de visa Allemagne + guides complets. **Aucune promesse de visa** : disclaimer permanent « Ceci est une estimation, pas un conseil juridique ».

### Ce que fait le module
- 🧮 **« Calcule tes chances »** : wizard de 8 questions (âge, diplôme, allemand, anglais, projet, secteur, situation, financement) → score % + niveau + conseils personnalisés.
- 📋 **Checklist des documents** par type de visa (Ausbildung §16a, Studium §16b, Chancenkarte, travail §18, tourisme Schengen) avec priorités ⭐ selon tes réponses.
- 📚 **6 guides** : Ausbildung, Studium, Chancenkarte, tourisme/visite, étudier en Europe, étudiants africains → Europe (liens officiels : make-it-in-germany, DAAD, anabin, Campus France…).
- ⚡ **Pré-remplissage** automatique depuis ton profil Visa (module 2) + **historique** des simulations (table `prono_visa_checks`).
- 🔓 Page **publique** : le calcul marche sans compte ; la sauvegarde nécessite une connexion.
- 🧭 Bandeau de navigation rapide entre modules (mobile-first) sur toutes les pages /prono-*.

### Activation (30 secondes)
Exécuter le SQL `supabase/migrations/006_prono_visa.sql` dans Supabase → SQL Editor
(uniquement pour l'historique des simulations — le calculateur marche déjà sans).

## 🆕 MODULE 4 PRONO-HOUSING (`/prono-housing`)

Recherche de logement Allemagne — **100% légale** : aucune annonce copiée ni scrapée.

### Ce que fait le module
- 🔎 **Filtres** : ville allemande (13 grandes villes), loyer max, type (WG / appartement / studio).
- 🚀 **Lanceur de recherche multi-plateformes** : ouvre WG-Gesucht, ImmoScout24, Immowelt et Kleinanzeigen avec tes filtres pré-remplis (URLs canoniques officielles vérifiées — les IDs de villes WG-Gesucht ont été validés un par un).
- 📊 **Loyers de référence réels** par ville (chambres en coloc + loyer froid €/m², constats 2025-2026).
- ✍️ **« Postuler via Pronofoot »** : générateur d'**Anschreiben** (lettre de motivation logement) en allemand + français, pré-rempli depuis ton profil (module 2), éditable, avec copie / WhatsApp / e-mail / impression PDF + sauvegarde.
- 📚 **5 guides** : méthode de recherche, dossier de candidature parfait (SCHUFA…), comprendre les loyers (Kaltmiete/Warmmiete/Kaution), arnaques à éviter, WBS & alternatives.

### Pourquoi pas d'API d'annonces ?
WG-Gesucht, ImmoScout24 et Immowelt n'ont **pas d'API publique gratuite** (partenaires payants uniquement), et le scraping est interdit. Pronofoot respecte la loi : il construit des liens de recherche officiels vers les plateformes, où tu consultes et postules chez l'original.

### Activation (30 secondes)
Exécuter le SQL `supabase/migrations/007_prono_housing.sql` dans Supabase → SQL Editor
(uniquement pour la sauvegarde des lettres — la page fonctionne déjà sans).
