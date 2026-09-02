import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态 HTML 导出模式 (适配 Cloudflare Pages 静态托管，0 Worker 大小限制)
  output: "export",

  // 1. 开启 React 严格模式，提高代码健壮性
  reactStrictMode: true,

  // 2. 隐藏 x-powered-by: Next.js 响应头，提升安全性
  poweredByHeader: false,

  // 3. Gzip / Brotli 传输压缩
  compress: true,

  // 4. 图片加载与 CDN 优化策略
  images: {
    unoptimized: true,
    // 允许通过本地代理 / VPN（如 Clash/TUN 模式的 198.18.x.x 虚拟 IP）进行图片优化
    dangerouslyAllowLocalIP: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage 域名 (包含所有子域)
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kupsztclcilcygstbuya.supabase.co",
        port: "",
        pathname: "/**",
      },
      // Unsplash 图床
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
        port: "",
        pathname: "/**",
      },
      // WebP 代理 CDN
      {
        protocol: "https",
        hostname: "wsrv.nl",
        port: "",
        pathname: "/**",
      },
      // Discord CDN / Avatar
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/**",
      },
      // GitHub CDN / Avatar
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      // 网易云音乐封面
      {
        protocol: "https",
        hostname: "**.music.126.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**.music.126.net",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // 5. 全局安全响应标头 (提升安全评级与 Lighthouse Best Practices 分数)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;