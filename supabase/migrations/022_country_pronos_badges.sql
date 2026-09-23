-- ============================================================
-- PRONOFOOT — Migration 022 : Badges multi-pays africains
-- ============================================================
-- Vue v_user_country_pronos : pour chaque utilisateur et chaque pays
-- africain du catalogue AFRICA_FEATURED_TEAMS, compte le nombre de
-- pronos sur des matchs impliquant ce pays.
--
-- On ajoute 3 badges "fan de pays" supplémentaires par pays :
-- - supporter-{slug} (5+ pronos sur ce pays)
-- - fidele-{slug} (15+ pronos sur ce pays)
-- - ambassadeur-{slug} (50+ pronos sur ce pays)
--
-- Cette migration est idempotente.
-- ============================================================

-- ------------------------------------------------------------
-- Vue : comptage des pronos par pays africain
-- ------------------------------------------------------------
-- Approche : CTE latérale qui groupe par (country_key, pr.id) pour
-- produire une ligne par (utilisateur, pays) avec le compte exact.
-- Les pays sans prono matchant sont EXCLUS (via WHERE EXISTS).
-- (Si on voulait les inclure avec count=0, il faudrait LEFT JOIN sans
-- EXISTS — mais ça alourdit l'usage, donc on garde le comportement
-- "seulement les pays suivis".)
create or replace view public.v_user_country_pronos
with (security_invoker = on)
as
select
  pr.id as user_id,
  sub.country_key,
  sub.prono_count
from public.profiles pr
cross join lateral (
  with countries(country_key, name_patterns) as (
    values
      ('cameroun',            array['%cameroun%', '%cameroon%']::text[]),
      ('senegal',             array['%sénégal%', '%senegal%']::text[]),
      ('maroc',               array['%maroc%', '%morocco%']::text[]),
      ('nigeria',             array['%nigeria%']::text[]),
      ('cote_divoire',        array['%côte d''ivoire%', '%cote d''ivoire%', '%ivory coast%']::text[]),
      ('egypte',              array['%égypte%', '%egypte%', '%egypt%']::text[]),
      ('ghana',               array['%ghana%']::text[]),
      ('algerie',             array['%algérie%', '%algerie%', '%algeria%']::text[]),
      ('tunisie',             array['%tunisie%', '%tunisia%']::text[]),
      ('mali',                array['%mali%']::text[]),
      ('burkina_faso',        array['%burkina faso%', '%burkina%']::text[]),
      ('guinee',              array['%guinée%', '%guinee%', '%guinea%']::text[]),
      ('rdc',                 array['%rd congo%', '%congo dr%', '%rdc%']::text[]),
      ('gabon',               array['%gabon%']::text[]),
      ('cap_vert',            array['%cap-vert%', '%cap vert%', '%cape verde%']::text[]),
      ('tanzanie',            array['%tanzanie%', '%tanzania%']::text[]),
      ('kenya',               array['%kenya%']::text[]),
      ('ouganda',             array['%ouganda%', '%uganda%']::text[]),
      ('zambie',              array['%zambie%', '%zambia%']::text[]),
      ('zimbabwe',            array['%zimbabwe%']::text[]),
      ('togo',                array['%togo%']::text[]),
      ('benin',               array['%bénin%', '%benin%']::text[]),
      ('madagascar',          array['%madagascar%']::text[]),
      ('angola',              array['%angola%']::text[]),
      ('mozambique',          array['%mozambique%']::text[]),
      ('ethiopie',            array['%éthiopie%', '%ethiopie%', '%ethiopia%']::text[]),
      ('comores',             array['%comores%', '%comoros%']::text[]),
      ('mauritanie',          array['%mauritanie%', '%mauritania%']::text[]),
      ('libye',               array['%libye%', '%libya%']::text[]),
      ('soudan',              array['%soudan%', '%sudan%']::text[]),
      ('rca',                 array['%centrafrique%', '%central african%', '%rca%']::text[]),
      ('guinee_equatoriale',  array['%guinée équatoriale%', '%equatorial guinea%']::text[]),
      ('congo',               array['% congo%', '%congo%']::text[]),
      ('gambie',              array['%gambie%', '%gambia%']::text[]),
      ('botswana',            array['%botswana%']::text[]),
      ('namibie',             array['%namibie%', '%namibia%']::text[]),
      ('sierra_leone',        array['%sierra leone%']::text[]),
      ('liberia',             array['%libéria%', '%liberia%']::text[]),
      ('rwanda',              array['%rwanda%']::text[]),
      ('burundi',             array['%burundi%']::text[]),
      ('tchad',               array['%tchad%', '%chad%']::text[]),
      ('niger',               array['%niger%']::text[])
  )
  select
    c.country_key,
    count(pd.id)::int as prono_count
  from countries c
  left join public.predictions pd
    on pd.user_id = pr.id
  left join public.matches m
    on m.id = pd.match_id
  where exists (
    select 1
    from unnest(c.name_patterns) as p(pattern)
    where lower(m.home_team) like p.pattern
       or lower(m.away_team) like p.pattern
  )
  group by c.country_key, pr.id
) sub;

grant select on public.v_user_country_pronos to authenticated, anon;

-- ------------------------------------------------------------
-- RPC : award_country_badge — même logique que award_badge mais
-- avec un code badge dynamique (par pays).
-- ------------------------------------------------------------
create or replace function public.award_country_badge(
  p_user_id uuid,
  p_country_slug text,
  p_tier text default 'supporter'  -- 'supporter' (5+), 'fidele' (15+), 'ambassadeur' (50+)
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_inserted boolean := false;
begin
  v_code := p_tier || '-' || p_country_slug;
  insert into public.user_badges (user_id, badge_code)
  values (p_user_id, v_code)
  on conflict (user_id, badge_code) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted > 0;
end;
$$;

-- ------------------------------------------------------------
-- Trigger : après settlement d'un prono, recalcule les badges pays
-- (déclenche côté serveur lors de l'appel match-result).
-- ------------------------------------------------------------
-- Pas de trigger SQL ici pour éviter les boucles infinies — le calcul
-- se fait dans lib/services/country-badges.service.ts (checkAndAwardCountryBadges).
