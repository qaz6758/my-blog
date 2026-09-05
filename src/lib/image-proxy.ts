/**
 * 极速图片优选代理包装器
 * 统一将外链图片（网易云、wsrv.nl、Supabase等）通过自建优选 Worker 缓存分发
 */
export function getProxyImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  // 本地静态资源、base64 或已包装过的链接直接返回
  if (trimmed.startsWith('/') && !trimmed.startsWith('/img')) return trimmed;
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.includes('/img/?url=')) return trimmed;

  return `/img/?url=${encodeURIComponent(trimmed)}`;
}
