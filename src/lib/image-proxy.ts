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

  // 网易云音乐的 CDN 在国内非常快，并且只要加了 referrerPolicy="no-referrer" 就不会防盗链。
  // 如果通过 Cloudflare Worker 反代，反而会绕路到国外节点，导致移动端 WiFi 加载出黑块甚至彻底失败。
  if (trimmed.includes('126.net') || trimmed.includes('163.com')) {
    return trimmed;
  }

  return `https://cdn.vinceou.site/img/?url=${encodeURIComponent(trimmed)}`;
}
