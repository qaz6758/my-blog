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

  const normalized = trimmed.replace(/&amp;/g, '&');

  // 网易云音乐直连常常会因客户端防盗链或网络 TLS 握手重置导致 net::ERR_CONNECTION_CLOSED
  // 通过全球 CDN wsrv.nl (Cloudflare 边缘缓存节点) 自动剥离 Referer 并分发，彻底消除连接被关闭报错
  if (normalized.includes('126.net') || normalized.includes('163.com')) {
    if (normalized.includes('wsrv.nl') || normalized.includes('weserv.nl')) return normalized;
    return `https://wsrv.nl/?url=${encodeURIComponent(normalized)}&af`;
  }

  return `https://cdn.vinceou.site/img/?url=${encodeURIComponent(normalized)}`;
}
