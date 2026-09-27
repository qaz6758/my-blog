BEGIN;

CREATE SCHEMA IF NOT EXISTS blog_private;
REVOKE ALL ON SCHEMA blog_private FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS blog_private.comment_contacts (
  comment_table text NOT NULL
    CHECK (comment_table IN ('comments', 'thought_comments')),
  comment_id text NOT NULL,
  email text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR user_id IS NOT NULL),
  PRIMARY KEY (comment_table, comment_id)
);

ALTER TABLE blog_private.comment_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE blog_private.comment_contacts
  FROM PUBLIC, anon, authenticated, service_role;

INSERT INTO blog_private.comment_contacts (comment_table, comment_id, email, user_id)
SELECT 'comments', id::text, email, user_id
FROM public.comments
WHERE (email IS NOT NULL AND btrim(email) <> '') OR user_id IS NOT NULL
ON CONFLICT (comment_table, comment_id)
DO UPDATE SET
  email = EXCLUDED.email,
  user_id = EXCLUDED.user_id;

INSERT INTO blog_private.comment_contacts (comment_table, comment_id, email, user_id)
SELECT 'thought_comments', id::text, email, user_id
FROM public.thought_comments
WHERE (email IS NOT NULL AND btrim(email) <> '') OR user_id IS NOT NULL
ON CONFLICT (comment_table, comment_id)
DO UPDATE SET
  email = EXCLUDED.email,
  user_id = EXCLUDED.user_id;

UPDATE public.comments SET email = NULL WHERE email IS NOT NULL;
UPDATE public.comments SET user_id = NULL WHERE user_id IS NOT NULL;
UPDATE public.thought_comments SET email = NULL WHERE email IS NOT NULL;
UPDATE public.thought_comments SET user_id = NULL WHERE user_id IS NOT NULL;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_no_public_contact
  CHECK (email IS NULL AND user_id IS NULL);
ALTER TABLE public.thought_comments
  ADD CONSTRAINT thought_comments_no_public_contact
  CHECK (email IS NULL AND user_id IS NULL);

CREATE OR REPLACE FUNCTION blog_private.store_comment_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  supplied_email text;
BEGIN
  supplied_email := nullif(btrim(NEW.email), '');

  IF NEW.user_id IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'user_id must match the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  IF supplied_email IS NOT NULL OR NEW.user_id IS NOT NULL THEN
    INSERT INTO blog_private.comment_contacts (comment_table, comment_id, email, user_id)
    VALUES (TG_ARGV[0], NEW.id::text, supplied_email, NEW.user_id)
    ON CONFLICT (comment_table, comment_id)
    DO UPDATE SET
      email = COALESCE(EXCLUDED.email, blog_private.comment_contacts.email),
      user_id = COALESCE(EXCLUDED.user_id, blog_private.comment_contacts.user_id);
  END IF;

  NEW.email := NULL;
  NEW.user_id := NULL;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION blog_private.store_comment_contact() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER store_comments_contact
BEFORE INSERT OR UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION blog_private.store_comment_contact('comments');

CREATE TRIGGER store_thought_comments_contact
BEFORE INSERT OR UPDATE ON public.thought_comments
FOR EACH ROW EXECUTE FUNCTION blog_private.store_comment_contact('thought_comments');

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thought_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow checked insert comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public read comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public insert thought_comments" ON public.thought_comments;
DROP POLICY IF EXISTS "Allow public read thought_comments" ON public.thought_comments;
DROP POLICY IF EXISTS "所有人可读" ON public.thought_comments;
DROP POLICY IF EXISTS "登录用户可发" ON public.thought_comments;
DROP POLICY IF EXISTS "Allow admin all for thoughts" ON public.thoughts;
DROP POLICY IF EXISTS "Allow all operations for thoughts" ON public.thoughts;
DROP POLICY IF EXISTS "Allow public reaction update" ON public.thoughts;
DROP POLICY IF EXISTS "Allow public read thoughts" ON public.thoughts;
DROP POLICY IF EXISTS "Allow public select for thoughts" ON public.thoughts;
DROP POLICY IF EXISTS "Public read thoughts" ON public.thoughts;

CREATE POLICY comments_public_read
  ON public.comments
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY comments_checked_insert
  ON public.comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(btrim(content)) BETWEEN 1 AND 5000
    AND char_length(btrim(author)) BETWEEN 1 AND 100
    AND char_length(post_id) BETWEEN 1 AND 200
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
    AND (email IS NULL OR char_length(email) <= 320)
    AND (website IS NULL OR char_length(website) <= 2048)
    AND (user_avatar IS NULL OR char_length(user_avatar) <= 2048)
  );

CREATE POLICY thought_comments_public_read
  ON public.thought_comments
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY thought_comments_checked_insert
  ON public.thought_comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(btrim(content)) BETWEEN 1 AND 5000
    AND char_length(btrim(author)) BETWEEN 1 AND 100
    AND char_length(thought_id) BETWEEN 1 AND 200
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
    AND (email IS NULL OR char_length(email) <= 320)
    AND (website IS NULL OR char_length(website) <= 2048)
    AND (user_name IS NULL OR char_length(user_name) <= 100)
    AND (user_avatar IS NULL OR char_length(user_avatar) <= 2048)
  );

CREATE POLICY thoughts_public_read_published
  ON public.thoughts
  FOR SELECT TO anon, authenticated
  USING (is_published IS TRUE);

REVOKE ALL PRIVILEGES ON TABLE public.comments, public.thought_comments, public.thoughts
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.comments, public.thought_comments TO anon, authenticated;
GRANT INSERT (post_id, author, content, email, website, user_id, user_avatar)
  ON public.comments TO anon, authenticated;

GRANT INSERT (thought_id, user_id, user_name, user_avatar, content, author, email, website)
  ON public.thought_comments TO anon, authenticated;

GRANT SELECT (id, likes)
  ON public.thoughts TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_thought_like(target_id uuid, delta integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  new_likes integer;
BEGIN
  IF target_id IS NULL OR delta IS NULL OR delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'target_id and a delta of -1 or 1 are required'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.thoughts AS existing (id, likes, is_published)
  VALUES (target_id, GREATEST(0, delta), true)
  ON CONFLICT (id) DO UPDATE
    SET likes = GREATEST(0, COALESCE(existing.likes, 0) + delta)
  RETURNING likes INTO new_likes;

  RETURN new_likes;
END;
$function$;

REVOKE ALL ON FUNCTION public.increment_thought_like(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_thought_like(uuid, integer)
  TO anon, authenticated;

COMMIT;
