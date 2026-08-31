// data/siteData.ts

// 1. 站点与作者全局基础配置（用于 Layout Metadata、页脚与个人介绍）
export const siteConfig = {
  blogName: "拾光小站",
  author: {
    name: "dede",
    title: "Anything is possible",
    bio: "破碎重组，再破碎的循环，让自己成为自己",
    avatar: "/avatar.png",
  },
  // 社交平台链接集中管理
  socialLinks: [
    { name: "GitHub", url: "https://github.com" },
    { name: "X", url: "https://x.com" },
    { name: "Bilibili", url: "https://bilibili.com" },
    { name: "Telegram", url: "https://t.me" },
    { name: "Email", url: "mailto:your-email@example.com" },
  ],
};

// 2. 统一的 Supabase 文章类型定义（供 posts 页面与详情页复用）
export interface Post {
  id: string | number;
  title: string;
  created_at: string;
  published_at?: string | null;
  content?: string | null;
  summary?: string | null;
}