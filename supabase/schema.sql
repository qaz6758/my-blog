-- Bootstrap schema for the public gallery. Safe to re-run: existing photo data is preserved.
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photos_created_at
  ON public.photos (created_at DESC);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.photos;
CREATE POLICY "Allow public read access"
  ON public.photos
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow admin and authenticated full access" ON public.photos;
DROP POLICY IF EXISTS "Allow admin full access" ON public.photos;
CREATE POLICY "Allow admin full access"
  ON public.photos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.photos FROM anon, authenticated;
GRANT SELECT ON public.photos TO anon, authenticated;
