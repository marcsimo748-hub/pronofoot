-- ============================================================
-- 020 — CLASSEMENT GÉNÉRAL : SEULEMENT LES VRAIS JOUEURS
-- Le classement général listait TOUS les inscrits (vendeurs,
-- boutiques, chercheurs d'emploi…). Désormais : uniquement les
-- membres ayant fait AU MOINS 1 pronostic. Idempotent.
-- ⚠️ À exécuter dans Supabase > SQL Editor (comme 001 à 019)
-- ============================================================

create or replace function public.get_general_standings(p_limit int default 50)
returns table (user_id uuid, username text, avatar_url text, points bigint, preds bigint)
language sql
stable
security definer
set search_path = public
as $$
  select pr.id, pr.username, pr.avatar_url,
         coalesce(pr.total_points, 0),
         count(pd.id)
    from public.profiles pr
    join public.predictions pd on pd.user_id = pr.id
   group by pr.id, pr.username, pr.avatar_url, coalesce(pr.total_points, 0)
   having count(pd.id) > 0
   order by coalesce(pr.total_points, 0) desc, pr.username asc
   limit greatest(coalesce(p_limit, 50), 1);
$$;
