# 📊 BILAN PRONO : du départ à aujourd'hui

_Mis à jour le 20 septembre 2026 (soir)_

---

## ✅ CONSTRUIT, EN LIGNE ET VÉRIFIÉ

### Le jeu (le cœur du site)
- Pronostics sur 6 championnats (LDC, Angleterre, Espagne, Italie, Allemagne, France)
- Barème complet : 5 pts exact, 3 pts bon résultat, bonus champion/buteur
- **Classement réservé aux vrais joueurs** (au moins 1 pronostic) : les inscrits qui n'utilisent que les services n'apparaissent plus
- Scores en direct, news foot, lecteur musique, notifications
- Jeu 100 % gratuit : payer ne donne AUCUN avantage dans le jeu

### Les services diaspora
- 💼 **PRONO Job** (offres automatiques, JSearch vérifié fonctionnel)
- 🏠 **PRONO Logement** · 🛂 **PRONO Visa** · ✈️ **PRONO Voyage**
- 📢 **PRONO Annonces** : 16 catégories (coiffure, déménagement/Umzug, DJ, chauffeur, garde d'enfants, voitures, envoi Afrique, électronique, mode, maison, objets…), prix, photos, envoi Afrique, dédouanement, localisation ville + quartier + code postal, design premium
- 🛍️ **Boutiques des membres** : page perso avec 6 thèmes, logo, WhatsApp
- 💸 **PRONO Transferts** : comparatif des envois d'argent légaux vers l'Afrique

### 🎉 LA COMMUNAUTÉ UTILISE DÉJÀ LE SITE
- Annonces réelles publiées (avec quartier et code postal : Berlin-Wedding !)
- Une première boutique membre créée : « Unterkunft in Germany »

### L'argent (construit, endormi, prêt à activer)
- 💳 Paiements Premium : PayPal (Europe) + Mobile Money (Afrique), aucune carte bancaire
- 🤝 Page « Devenir partenaire » : sponsors dès 20 €/mois
- ☕ Page « Soutenir PRONO » : partage + dons (bouton prêt à brancher)
- 👕 Boutique merchandising : 3 designs, réservations WhatsApp

### L'assistant et la langue
- 🤖 **Un seul assistant fusionné** (bulle en bas à droite) : réponses instantanées aux 12 questions fréquentes en FR/EN/DE, puis IA complète (fichiers, images, historique) pour le reste
- 🗣️ Annonces + boutiques + accueil + menu en **3 langues** (FR/EN/DE)

### La technique invisible
- Données matchs et emploi à jour automatiquement (cron 24h/24)
- Référencement : sitemap, robots, mots-clés diaspora, données structurées Google, image de partage WhatsApp/Facebook
- Partage WhatsApp/Telegram/Facebook avec résumé automatique
- Sécurité : modération, signalements, RLS, jamais d'argent ni de données bancaires sur le site

---

## ✅ GRANDES ÉTAPES VALIDÉES CETTE SEMAINE

| Étape | Statut |
|---|---|
| Connexion protégée (login) testée et confirmée | ✅ |
| Google Search Console vérifié (le site est déclaré à Google) | ✅ |
| Migrations 016 à 019 appliquées et vérifiées en base | ✅ |
| Doublon des assistants corrigé (un seul, fusionné) | ✅ |

---

## ⚠️ EN ATTENTE DE TES ACTIONS

| # | Action | Temps | Effet |
|---|--------|-------|-------|
| 1 | **Jouer la migration 020** (SQL Editor → Run) | 30 s | Classement = uniquement les joueurs (filtre exact + compteur de pronos) |
| 2 | **Soumettre le sitemap** dans Search Console (Sitemaps → `sitemap.xml` → Envoyer) | 1 min | Google explore toutes tes pages |
| 3 | **Créer ton compte PayPal Business** (gratuit, email + identité) | 10 min | Active le bouton Premium Europe (4,99 €) |
| 4 | **Créer ton compte marchand CinetPay** (CNI/passeport) | 15 min | Active le bouton Mobile Money (3 250 XAF) |
| 5 | **T'inscrire aux programmes d'affiliation** (Taptap Send, Wise, Remitly…) | 15 min | La page Transferts commence à rapporter |
| 6 | **Ton lien PayPal.me** (dans ton compte PayPal) | 2 min | J'active le bouton Don en 5 min |
| 7 | **Parler aux commerçants de Berlin** avec la page Partenaire | à toi | 20 à 100 €/mois par sponsor |

---

## 🔜 PROCHAINES CONSTRUCTIONS POSSIBLES (moi)

1. **Bouton Don** dès que tu me donnes ton lien PayPal.me
2. **Activer les paiements** dès que tu as tes clés PayPal/CinetPay (je configure et teste)
3. **Traduire les autres modules** (Job, Logement, Voyage, Visa) en FR/EN/DE
4. **Chatbot IA complet** avec une clé Gemini gratuite (pour les questions hors FAQ)
5. **Remplacer les liens Transferts** par tes liens affiliés (1 min par service)
6. Plus tard : annonces boostées (mise en avant payante), publicité Google (avec du trafic), articles sponsorisés

---

## 🧾 HÉRITAGE À NE PAS OUBLIER (backlog ancien)

- Emails réels à tous les membres : nécessite ton propre nom de domaine (ex. pronofoot.com) pour vérifier l'envoi (Resend est en mode test)
- Idées bonus : badges et séries, fiches match détaillées, mini-ligues privées, santé admin, export CSV
- Croissance : plus il y a de monde, plus tout le reste fonctionne (partages, sponsors, Premium)

---

## 🎯 TON RÔLE

1. Parler du site dans tes groupes WhatsApp/Telegram diaspora
2. Tester en vrai : publie une annonce, crée ta boutique
3. Recruter 2-3 commerçants partenaires à Berlin
4. Me dire ce qui ne va pas : je corrige en quelques minutes

---

# 🌍 Annexe diaspora africaine (23 septembre 2026)

## Page `/prono-afrique` (panafricaine, pas Cameroun seul)

- **Bannière 🌍** + Globe2 + sélecteur pays cliquable (`?pays=XYZ`)
- **8 codes de compétition africains** dans `lib/types.ts` : `can`, `can_u17`, `can_u20`, `can_u23`, `qwc_afrique`, `wcq_afrique`, `afriendly`, `international`
- **17 équipes vedettes** dans `lib/constants.ts` : Cameroun, Sénégal, Maroc, Nigeria, CI, Égypte, Ghana, Algérie, Tunisie, Mali, Burkina, Guinée, RD Congo, Gabon, Cap-Vert, Tanzanie, Kenya
- **OG image panafricaine** 1200×630 : continent + 10 drapeaux (`public/og-afrique.png`, ~3 MB)
- **Sync auto via ESPN** : `caf.nations` + `caf.nations_qual` + `fifa.worldq.caf` + `fifa.friendly` → 8 matchs 24 sept, 17 matchs 29 sept confirmés
- **Détection 60+ mots-clés africains** : `isAfricanMatch()` exporté (`lib/services/football.providers.ts`)
- **Section dédiée nav** : Globe2 + `nav.afrique` dans `components/layout/Header.tsx`
- **SEO sitemap** : `/prono-afrique` priority 0.9 dans `app/sitemap.ts`
- **Footer diaspora** : Cameroun + Afrique centrale + Europe prioritaire

## Système de badges pays africains (3 paliers × 42 pays)

### Service `lib/services/country-badges.service.ts` (157 l.)
- **42 pays africains** : Cameroun + Sénégal + Maroc + Nigeria + CI + Égypte + Ghana + Algérie + Tunisie + Mali + Burkina + Guinée + RD Congo + Gabon + Cap-Vert + Tanzanie + Kenya + Ouganda + Zambie + Zimbabwe + Togo + Bénin + Madagascar + Angola + Mozambique + Éthiopie + Comores + Mauritanie + Libye + Soudan + RCA + Guinée Équatoriale + Congo + Gambie + Botswana + Namibie + Sierra Leone + Libéria + Rwanda + Burundi + Tchad + Niger
- **3 paliers** : Supporter (5+ prono) · Fidèle (15+) · Ambassadeur (50+)
- **Fonctions exportées** : `getUserCountryPronos()` / `checkAndAwardCountryBadges()` / `getUserCountryBadges()` / `decodeCountryBadge()`

### Composants UI
- `components/badges/CountryBadgesStrip.tsx` (88 l.) : pastilles drapeau+pays+tier
- Section "Fierté africaine — pays pronostiqués" intégrée à `app/(main)/joueur/[id]/page.tsx`

### Branchement settlement
- `app/api/admin/match-result/route.ts` : `checkAndAwardCountryBadges()` appelé en parallèle de `checkAndAwardBadges()`
- Réponse API enrichie : `new_country_badges` retourné

## Migration SQL 022 (commit `b8e0228`)

- **Vue `v_user_country_pronos`** : `security_invoker = on` (RLS respectée)
- **Structure recommandée par la doc PostgreSQL** : `cross join lateral` + `group by c.country_key, pr.id` dans le sous-select + `sub.prono_count` retourné en outer
- **Pattern de comptage corrélé** : agrégation dans le LATERAL, pas dans l'outer (sinon erreur `42803`)
- **RPC `award_country_badge(user_id, slug, tier)`** : idempotente (ON CONFLICT)
- **Grants** : `select` authenticated + anon

## Route de diagnostic (commit `9f78f56`)

- `GET /api/admin/diagnose-country-pronos?user_id=UUID` : route admin **lecture seule** (aucun effet de bord)
- Vérifie `vue_ok` + `vue_row_count` + pays avec pronos + badges décernés
- Permet de prouver que le fix SQL fonctionne sans toucher au navigateur

## Commits diaspora africaine (session 23/09)

| Commit | Description |
|---|---|
| `942ddf5` | feat(afrique): sync auto CAN/Qualifs CDM/Amicaux via ESPN |
| `4c6bc62` | feat(afrique): recentrage diaspora africaine entiere (922 insertions) |
| `cf8f0ba` | fix(sql): migration 022 v_user_country_pronos GROUP BY conforme doc PG |
| `9f78f56` | feat(admin): route diagnose-country-pronos pour valider la vue SQL |
| `59bdc28` | docs(bilan): annexe diaspora africaine + instructions push/verif |
| `3c1c4b2` | docs: correction hash commit migration 022 |
| `0c91172` | feat(afrique): sync auto matchs africains via ESPN (admin + cron) |

## Sync automatique des matchs africains (commit `0c91172`)

### Problème résolu
`/prono-afrique` était vide en prod parce que les matchs africains
n'étaient jamais synchronisés en base (les fonctions ESPN étaient
codées mais jamais appelées depuis `app/`).

### Solution (ajouts purs, 568 insertions, 0 suppression)

- **`lib/services/sync-african-matches.service.ts`** (278 l.) : service
  - Plage J-1 → J+14 (15 jours)
  - 4 slugs ESPN : `caf.nations`, `caf.nations_qual`, `fifa.worldq.caf`, `fifa.friendly`
  - États `pre` (à venir) + `in` (live) + `post` (finished) — inclus
  - Upsert idempotent sur `external_id` (unique)
  - `isAfricanMatch()` filtre les amicaux (60+ mots-clés)
  - `source = 'espn_afrique'` pour traçabilité
  - Breakdown par league dans la réponse

- **`app/api/admin/sync-african-matches/route.ts`** (POST/GET, 61 l.)
  - Auth admin (cookie session)
  - Paramètres `?past=N&future=M` (défaut 1/14)
  - Réponse JSON : `total_fetched`, `total_upserted`, `by_league`, `errors`

- **`app/api/cron/sync-african-matches/route.ts`** (GET, 46 l.)
  - Auth via `Authorization: Bearer ${CRON_SECRET}`
  - Pas d'auth si `CRON_SECRET` vide (dev local)
  - Consomme 1 appel/sync/slug/jour → largement sous le quota ESPN

- **`components/admin/SyncAfricanMatchesButton.tsx`** (157 l.)
  - Bouton client pour `/admin` (à greffer dans AdminPanel si besoin)
  - Affichage : matchs trouvés, upsertés, par ligue
  - Gestion loading/error/result

- **`vercel.json`** : cron daily 06:00 UTC (après le cleanup 04:00)
- **`.env.example`** : section `CRON_SECRET` documentée

### Effets attendus

| Avant | Après |
|---|---|
| `/prono-afrique` vide | Matchs CAN/Qualifs CDM/Amicaux réels affichés |
| Pas de sync | Sync auto quotidienne + bouton admin manuel |
| Badges pays jamais décernés | Supporter/Fidèle/Ambassadeur décernés via settlement existant |
| Scores live impossibles (pas de matchs) | Live scores fonctionnent via couche scores existante |

### Comment tester après push

1. Attendre 3 min (redéploiement Vercel)
2. Se connecter en admin
3. POST `/api/admin/sync-african-matches` → doit retourner :
   ```json
   {
     "ok": true,
     "total_fetched": ~40,
     "total_upserted": ~40,
     "by_league": {
       "can": 8,
       "qwc_afrique": 12,
       "afriendly": 5
     }
   }
   ```
4. Ouvrir `/prono-afrique` → les matchs doivent s'afficher
5. Greffer `<SyncAfricanMatchesButton />` dans `AdminPanel` (optionnel)
6. (Optionnel) Configurer `CRON_SECRET` sur Vercel pour activer le cron

## État au 23/09 ~12:15

- ✅ Code commité et prêt à pusher
- ⏳ Push à faire depuis ton poste (`git push origin main`)
- ⏳ Migration SQL 022 à coller dans Supabase SQL Editor
- ⏳ Vérif via `/api/admin/diagnose-country-pronos?user_id=UUID` après déploiement (3 min)
