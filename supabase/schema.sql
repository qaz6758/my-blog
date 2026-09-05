-- ========================================================
-- 重新构建极简 photos 照片表 (仅包含图片与日期)
-- ========================================================

-- 1. 删除旧表（干净清理）
DROP TABLE IF EXISTS public.photos CASCADE;

-- 2. 创建极简 photos 表
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,                             -- 图片链接 (必填)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()  -- 日期时间 (默认当前时间，按此倒序排列)
);

-- 3. 创建时间倒序索引 (极速排序)
CREATE INDEX idx_photos_created_at ON public.photos (created_at DESC);

-- 4. 启用行级安全策略 (RLS)
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 5. 允许公开读取 (前台画廊游客访问)
CREATE POLICY "Allow public read access"
  ON public.photos
  FOR SELECT
  TO public
  USING (true);

-- 6. 允许后台全权操作 (Table Editor 自由增删改)
CREATE POLICY "Allow admin and authenticated full access"
  ON public.photos
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);
