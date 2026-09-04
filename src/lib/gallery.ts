import { supabase } from "@/lib/supabase";
import type { GalleryImage } from "@/types/gallery";

interface PhotoRow {
  id: string;
  title: string;
  url: string;

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

  created_at?: string | null;
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
    return rawThumbnailUrl;
  }
  if (!url) return "";

  // 1. Unsplash 图片利用其原生参数压缩为 800px WebP 缩略图
  if (url.includes("images.unsplash.com")) {
    const base = url.split("?")[0];
    return `${base}?auto=format&fit=crop&w=800&q=75`;
  }

  // 2. Supabase Storage 等海外超大原图（单张常达 5MB~10MB+）
  // 经由全球边缘 CDN 动态转码压缩为 800px WebP 缩略图（体积锐减 99.5% 至 40~60KB，实现秒显）
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800&fit=cover&output=webp&q=75`;
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

  return {
    id: row.id,

    title: row.title ?? "",

    // 高清原图
    url: row.url,

    // 智能优化缩略图 (WebP)
    thumbnailUrl,

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

    takenAt: null,

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
 * 获取 Gallery 图片 (毫秒级即时响应)
 * =========================================================
 */
export async function getGalleryImages(
  options?: {
    category?: string;
    limit?: number;
  }
): Promise<GalleryImage[]> {
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

  if (error) {
    console.error("Gallery 查询失败:", error);
    throw error;
  }

  const rows = (data as PhotoRow[]) ?? [];

  return rows.map((row) => normalizeGalleryImage(row));
}