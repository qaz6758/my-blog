import { supabase } from "@/lib/supabase";
import type { GalleryImage } from "@/types/gallery";
import { getProxyImageUrl } from "@/lib/image-proxy";
import { fetchGalleryFromNotion } from "@/lib/notion";

interface PhotoRow {
  id: string;
  url: string;
  created_at?: string | null;
  sort_order?: number | null;
  order?: number | null;
  title?: string | null;

  category?: string | null;
  location?: string | null;

  width?: number | null;
  height?: number | null;

  thumbnail_url?: string | null;

  camera_model?: string | null;
  lens?: string | null;
  focal_length?: string | null;
  aperture?: string | null;
  iso?: number | null;
  shutter_speed?: string | null;

  tags?: string[] | null;
}


/**
 * =========================================================
 * 缩略图 URL 解析器
 * =========================================================
 * 1. 若已有独立缩略图，优先使用缩略图
 * 2. 若无独立缩略图，返回原图 URL（由 Next.js <Image /> 服务端自动转码为 WebP/AVIF 并按需缩放）
 */
export function getOptimizedThumbnailUrl(
  url: string,
  rawThumbnailUrl?: string | null
): string {
  if (
    rawThumbnailUrl &&
    rawThumbnailUrl.trim() !== ""
  ) {
    return getProxyImageUrl(rawThumbnailUrl);
  }
  if (!url) return "";

  // 1. Unsplash 图片利用其原生参数压缩为 1200px WebP 缩略图并经由 Worker 优选节点永久缓存
  if (url.includes("images.unsplash.com")) {
    const base = url.split("?")[0];
    return getProxyImageUrl(`${base}?auto=format&fit=crop&w=1200&q=85`);
  }

  // 2. Supabase Storage 等海外超大原图（单张常达 5MB~10MB+）
  // 经由全球边缘 CDN 动态转码压缩为 1200px 高清 WebP 缩略图，加入 &we (Without Enlargement) 避免原本尺寸较小的图片被强行放大而模糊
  const wsrv = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1200&fit=cover&output=webp&q=85&we`;
  return getProxyImageUrl(wsrv);
}

/**
 * =========================================================
 * 高清大图预览 URL 解析器 (专供 Lightbox 弹窗秒显)
 * =========================================================
 * 原图经由全球边缘 CDN 转码为 2400px WebP，加 &we 避免小图强行放大导致像素化
 */
export function getOptimizedHDUrl(url: string): string {
  if (!url) return "";
  if (url.includes("images.unsplash.com")) {
    const base = url.split("?")[0];
    return getProxyImageUrl(`${base}?auto=format&fit=contain&w=2400&q=90`);
  }
  const wsrv = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=2400&fit=contain&output=webp&q=90&we`;
  return getProxyImageUrl(wsrv);
}

/**
 * =========================================================
 * 数据标准化 (纯函数，零网络阻塞)
 * =========================================================
 */
function normalizeGalleryImage(row: PhotoRow): GalleryImage {
  const width =
    row.width && row.width > 0 ? row.width : 1600;

  const height =
    row.height && row.height > 0 ? row.height : 1200;

  const thumbnailUrl = getOptimizedThumbnailUrl(
    row.url,
    row.thumbnail_url
  );

  const hdUrl = getOptimizedHDUrl(row.url);

  return {
    id: row.id,

    title: row.title ?? "",

    // 高清原图 (物理原始超大文件)
    url: row.url,

    // 智能优化缩略图 (800px WebP)
    thumbnailUrl,

    // 高清弹窗预览图 (2000px WebP，秒级加载)
    hdUrl,

    // 排序序号 (1, 2, 3...)
    sortOrder: row.sort_order ?? row.order ?? null,

    width,

    height,

    aspectRatio:
      width > 0 && height > 0 ? width / height : 4 / 3,

    // =====================================================
    // EXIF
    // =====================================================

    camera: row.camera_model ?? null,

    camera_model: row.camera_model ?? null,

    lens: row.lens ?? null,

    focalLength: row.focal_length ?? null,

    aperture: row.aperture ?? null,

    iso: row.iso ?? null,

    shutterSpeed: row.shutter_speed ?? null,

    shutter_speed: row.shutter_speed ?? null,

    takenAt: row.created_at ?? null,

    // =====================================================
    // 分类
    // =====================================================

    category: row.category ?? null,

    tags: row.tags ?? [],

    // =====================================================
    // 地点
    // =====================================================

    location: row.location ?? null,

    // =====================================================
    // 时间
    // =====================================================

    createdAt: row.created_at ?? null,
  };
}

/**
 * =========================================================
 * 获取 Gallery 图片 (Supabase 驱动，按 created_at 日期由新到旧排序)
 * =========================================================
 */
export async function getGalleryImages(
  options?: {
    category?: string;
    limit?: number;
  }
): Promise<GalleryImage[]> {
  try {
    // 1. 如果配置了 NOTION_GALLERY_DB_ID，优先使用 Notion 作为画廊数据源！
    if (process.env.NOTION_GALLERY_DB_ID) {
      const notionPhotos = await fetchGalleryFromNotion();
      if (notionPhotos && notionPhotos.length > 0) {
        let filtered = notionPhotos;
        if (options?.category && options.category !== "全部") {
          filtered = filtered.filter((p) => p.category === options.category);
        }
        if (options?.limit) {
          filtered = filtered.slice(0, options.limit);
        }

        const seenUrls = new Set<string>();
        const unique = filtered.filter((p) => {
          if (!p.url) return false;
          const cleanUrl = p.url.split("?")[0].trim();
          if (seenUrls.has(cleanUrl)) return false;
          seenUrls.add(cleanUrl);
          return true;
        });

        return unique.map((p) => normalizeGalleryImage(p));
      }
    }

    // 2. 否则 fallback 至 Supabase 数据源
    const limit = options?.limit ?? 100;
    let query = supabase
      .from("photos")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(limit);

    if (options?.category && options.category !== "全部") {
      query = query.eq("category", options.category);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return [];
    }

    const rows = (data as PhotoRow[]) ?? [];

    // 1. 严格按 URL 去重，杜绝数据库中偶发的重复记录导致前端重复渲染
    const seenUrls = new Set<string>();
    const uniqueRows = rows.filter((row) => {
      if (!row.url) return false;
      const cleanUrl = row.url.split("?")[0].trim();
      if (seenUrls.has(cleanUrl)) return false;
      seenUrls.add(cleanUrl);
      return true;
    });

    // 2. 优先按序号从小到大升序排序 (1, 2, 3...)，未指定序号的按上传时间由新到旧排列
    uniqueRows.sort((a, b) => {
      const orderA = a.sort_order ?? a.order ?? null;
      const orderB = b.sort_order ?? b.order ?? null;
      if (orderA !== null && orderB !== null) return orderA - orderB;
      if (orderA !== null) return -1;
      if (orderB !== null) return 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return uniqueRows.map((row) => normalizeGalleryImage(row));
  } catch (err) {
    console.error("[Gallery] 查询 Supabase photos 失败:", err);
    return [];
  }
}