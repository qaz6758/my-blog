/**
 * Gallery 图片统一数据模型
 *
 * Supabase photos
 *       ↓
 * lib/gallery.ts
 *       ↓
 * GalleryImage
 *       ↓
 * Gallery / Lightbox
 */

export interface GalleryImage {
  // =========================================================
  // 基础信息
  // =========================================================

  id: string

  title: string

  url: string

  thumbnailUrl: string

  // =========================================================
  // 图片尺寸
  // =========================================================

  width: number

  height: number

  /**
   * 图片宽高比
   *
   * width / height
   */
  aspectRatio: number

  // =========================================================
  // EXIF - 新架构字段
  // =========================================================

  camera?: string | null

  lens?: string | null

  focalLength?: string | null

  aperture?: string | null

  iso?: number | null

  shutterSpeed?: string | null

  takenAt?: string | null

  // =========================================================
  // EXIF - 旧 Lightbox 兼容字段
  //
  // 暂时保留。
  // 后面重构 Lightbox 时可以统一删除。
  // =========================================================

  camera_model?: string | null

  shutter_speed?: string | null

  // =========================================================
  // 分类
  // =========================================================

  category?: string | null

  tags?: string[]

  // =========================================================
  // 地点
  // =========================================================

  location?: string | null

  // =========================================================
  // 时间
  // =========================================================

  createdAt?: string | null
}

/**
 * 旧 Lightbox 类型兼容
 *
 * 当前：
 *
 * LightboxPhoto === GalleryImage
 *
 * 后面 Lightbox 重构完成以后可以删除。
 */
export type LightboxPhoto = GalleryImage

/**
 * Gallery 页面状态
 */
export interface GalleryState {
  /**
   * 当前 Lightbox 选中的图片索引
   *
   * null = 没有选中
   */
  activeImageIndex: number | null

  /**
   * Lightbox 是否打开
   */
  isLightboxOpen: boolean
}