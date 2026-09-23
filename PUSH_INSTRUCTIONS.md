# Push & vérification après fix migration 022

## 1) Push (depuis ton poste local)

```bash
git pull origin main          # récupère les commits distants éventuels
git push origin main          # pousse les commits :
                              #   - cf8f0ba : fix SQL GROUP BY (migration 022)
                              #   - 9f78f56 : route diagnose-country-pronos
                              #   - 59bdc28 : BILAN + PUSH_INSTRUCTIONS
                              #   - 3c1c4b2 : correction hash docs
                              #   - 0c91172 : sync auto matchs africains (ESPN)
```

## 2) Attendre 3 min (build Vercel)

Le temps que Vercel redéploie complètement (next build, prisma, migrations non appliquées ici).

## 3) Migration SQL (Supabase)

Ouvre https://supabase.com/dashboard → SQL Editor → colle le contenu de
`supabase/migrations/022_country_pronos_badges.sql` → Run.

Si tout est OK tu verras :
- `Success. No rows returned` (DDL)
- `select * from v_user_country_pronos limit 5` ne plantera plus avec
  `42803 column "pr.id" must appear in the GROUP BY clause`.

## 4) Vérification route de diagnostic

Une fois déployé (3 min après le push), appelle :

```
GET https://pronofoot-phi.vercel.app/api/admin/diagnose-country-pronos?user_id=<UUID>
Cookie: <ta-session-admin>
```

Réponse attendue (exemple) :
```json
{
  "ok": true,
  "user_id": "<UUID>",
  "diag": {
    "vue_ok": true,
    "vue_error": null,
    "vue_row_count": 3,
    "service_ok": true,
    "service_error": null
  },
  "totals": {
    "countries_catalog_size": 42,
    "countries_with_pronos": 2,
    "total_pronos_in_view": 7,
    "badges_awarded": 0
  },
  "countries_with_pronos": [
    { "slug": "cameroun", "flag": "🇨🇲", "prono_count": 4, "tier": 0, ... },
    { "slug": "senegal",  "flag": "🇸🇳", "prono_count": 3, "tier": 0, ... }
  ],
  "badges": []
}
```

## 5) Vérif visuelle rapide (optionnelle)

Ouvre https://pronofoot-phi.vercel.app/prono-afrique?pays=cameroun
→ la bannière 🌍 + Globe2 + sélecteur pays doivent s'afficher.
Ouvre la page joueur d'un compte qui a pronostiqué des matchs africains
→ la section "Fierté africaine — pays pronostiqués" doit lister les pays.

## 6) Rollback (si le fix pose problème)

Le commit `cf8f0ba` ne modifie que la migration (non appliquée par
Vercel : c'est toi qui l'as collée dans Supabase). Si la vue est KO :

```sql
DROP VIEW IF EXISTS public.v_user_country_pronos CASCADE;
```

puis reviens au commit précédent via :
```bash
git revert cf8f0ba
git push origin main
```

Aucun service TS n'est impacté (le fallback `?? 0` dans
`getUserCountryPronos` reste fonctionnel même si la vue est vide).
