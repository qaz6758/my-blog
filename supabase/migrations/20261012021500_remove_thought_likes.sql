BEGIN;

-- 1. 彻底删除随想录点赞 RPC 函数及其调用权限
DROP FUNCTION IF EXISTS public.increment_thought_like(uuid, integer);

-- 2. 移除 thoughts 表中的 likes 点赞列
ALTER TABLE IF EXISTS public.thoughts DROP COLUMN IF EXISTS likes;

-- 3. 重新规范 thoughts 表的列级访问权限（仅允许读取基础发布校验字段）
REVOKE ALL PRIVILEGES ON TABLE public.thoughts FROM anon, authenticated;
GRANT SELECT (id, is_published) ON public.thoughts TO anon, authenticated;

COMMIT;
