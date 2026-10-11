BEGIN;

CREATE TABLE IF NOT EXISTS public.site_visit_counts (
  id smallint PRIMARY KEY CHECK (id = 1),
  visits bigint NOT NULL DEFAULT 0 CHECK (visits >= 0)
);

INSERT INTO public.site_visit_counts (id, visits)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_visit_counts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_visit_counts
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.increment_site_visit_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  new_visits bigint;
BEGIN
  INSERT INTO public.site_visit_counts AS existing (id, visits)
  VALUES (1, 1)
  ON CONFLICT (id) DO UPDATE
    SET visits = existing.visits + 1
  RETURNING visits INTO new_visits;

  RETURN new_visits;
END;
$function$;

REVOKE ALL ON FUNCTION public.increment_site_visit_count()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_site_visit_count()
  TO anon, authenticated;

COMMIT;
