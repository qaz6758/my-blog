// lib/utils.ts
// 全站高内聚、零依赖公共工具函数库

/**
 * 将日期字符串格式化为可读形式。
 *
 * @param dateString - ISO 日期字符串
 * @param showYear   - 是否显示年份（默认 true）
 * @returns 例：`Sep 1, 2025` (showYear=true) 或 `Sep 1` (showYear=false)
 */
export function formatDate(
  dateString?: string | null,
  showYear = true
): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: showYear ? "numeric" : undefined,
    month: "short",
    day: "numeric",
  });
}

/**
 * 友好相对时间转换（带异常安全处理）
 *
 * @param dateString - ISO 日期字符串
 * @returns 例：`刚刚`、`5 分钟前`、`2 小时前`、`3 天前`
 */
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "";
  try {
    const timestamp = new Date(dateString).getTime();
    if (Number.isNaN(timestamp)) return "";

    const diff = (Date.now() - timestamp) / 1000;
    if (diff < 60) return "刚刚";
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;

    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * 安全校验网址链接，防止 javascript: 伪协议 XSS
 */
export function sanitizeWebsiteUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) return `https://${trimmed}`;
  return null;
}

/**
 * 将标题文本转为 URL 友好的 slug ID。
 * 支持中文、英文、数字，多余符号统一替换为连字符。
 *
 * @param text - 原始标题文本
 * @returns slug 字符串，保证非空（兜底 "heading"）
 */
export function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5\d-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "heading"
  );
}

/**
 * 解码 HTML 实体字符为普通 Unicode 字符。
 *
 * @param str - 包含 HTML 实体的字符串
 * @returns 解码后的普通字符串
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&rsquo;/gi, "\u2019")
    .replace(/&lsquo;/gi, "\u2018")
    .replace(/&rdquo;/gi, "\u201d")
    .replace(/&ldquo;/gi, "\u201c")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

/**
 * 规范化标签字段为字符串数组，处理逗号/空格/中文顿号分隔。
 *
 * @param tags - 原始标签值（字符串、数组或 null）
 * @returns 去重后的标签数组
 */
export function normalizeTags(tags?: string[] | string | null): string[] {
  if (!tags) return [];
  const items = Array.isArray(tags) ? tags : [tags];
  const rawList: string[] = [];
  for (const item of items) {
    if (typeof item === "string") {
      rawList.push(
        ...item
          .split(/[,，、\s]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }
  return Array.from(new Set(rawList));
}

/**
 * 根据文章内容字符数估算阅读时长（分钟）。
 * 优化单次复合正则匹配，减少大文本中间垃圾回收分配开销。
 *
 * @param content - 原始 HTML 或 Markdown 内容
 * @returns 最少 1 分钟的阅读时长
 */
export function calculateReadTime(content?: string | null): number {
  if (!content) return 1;
  const plainLength = content
    .replace(/<[^>]*>|[#>*_`~()[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim().length;
  if (!plainLength) return 1;
  return Math.max(1, Math.ceil(plainLength / 350));
}
