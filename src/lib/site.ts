// src/lib/site.ts

/**
 * 站点 Canonical 域名与 URL 规范化单一来源 (Single Source of Truth)
 *
 * 当前生产结构说明：
 * - Apex 品牌域：https://vinceou.site (通过 Cloudflare 边缘 301 永久重定向至 CDN 页面域)
 * - 实际页面响应与规范化 Canonical Host：https://cdn.vinceou.site
 * - 外部环境变量：NEXT_PUBLIC_SITE_URL (未配置时默认回退到 https://cdn.vinceou.site)
 *
 * 维护说明：
 * 未来若主域名或生产 Host 发生变动，仅需修改环境变量 NEXT_PUBLIC_SITE_URL 或下方的 DEFAULT_SITE_URL 即可全站自动生效。
 */

export const DEFAULT_SITE_URL = "https://cdn.vinceou.site";

function resolveBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    // 移除尾部斜杠，统一规范化
    return envUrl.replace(/\/+$/, "");
  }
  return DEFAULT_SITE_URL;
}

export const SITE_URL = resolveBaseUrl();

function getParsedUrl(): URL {
  try {
    return new URL(SITE_URL);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

const parsedUrl = getParsedUrl();
export const SITE_HOST = parsedUrl.host;
export const SITE_ORIGIN = parsedUrl.origin;

/**
 * 生成规范化的本站绝对 URL
 *
 * @param path 相对路径，如 "/", "/posts", "/posts/foo"
 * @returns 规范化的绝对 URL，如 "https://cdn.vinceou.site/posts"
 */
export function siteUrl(path = "/"): string {
  const cleanBase = SITE_URL.replace(/\/+$/, "");
  if (!path || path === "") {
    return cleanBase;
  }
  if (path === "/") {
    return `${cleanBase}/`;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * 验证当前 Site URL 配置的合法性（支持在测试、脚本或服务端初始化时调用）
 */
export function validateSiteUrl(): { valid: boolean; error?: string } {
  try {
    const url = new URL(SITE_URL);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { valid: false, error: `Invalid protocol: ${url.protocol}` };
    }
    if (process.env.NODE_ENV === "production" && url.hostname === "localhost") {
      return { valid: false, error: "Production site URL cannot be localhost" };
    }
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: e?.message || "Invalid SITE_URL" };
  }
}
