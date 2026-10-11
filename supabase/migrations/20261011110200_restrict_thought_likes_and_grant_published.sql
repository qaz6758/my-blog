BEGIN;

-- 1. 约束随想录点赞 RPC：仅允许更新已存在且已发布的记录，彻底移除随意插入新记录的逻辑
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

  UPDATE public.thoughts
  SET likes = GREATEST(0, COALESCE(likes, 0) + delta)
  WHERE id = target_id AND is_published IS TRUE
  RETURNING likes INTO new_likes;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Thought not found or not published'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN new_likes;
END;
$function$;

REVOKE ALL ON FUNCTION public.increment_thought_like(uuid, integer)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_thought_like(uuid, integer)
  TO anon, authenticated;

-- 2. 补全列级 SELECT 权限，确保只暴露必要公开字段 (id, likes, is_published)
-- 允许客户端在行级安全策略 (is_published IS TRUE) 下安全读取已发布条目的点赞数据
GRANT SELECT (id, likes, is_published)
  ON public.thoughts TO anon, authenticated;

COMMIT;
