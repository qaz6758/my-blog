// components/post/lazy.ts
// 统一管理所有重型客户端组件的动态懒加载入口
// 通过 next/dynamic 确保这些组件不进入首屏主 Bundle

import dynamic from "next/dynamic";

// ─── 文章正文渲染器 ─────────────────────────────────────────
// Prism.js (13 种语言语法 Grammar) + ReactMarkdown = 最重型组件
// 服务端不会渲染任何代码高亮，避免 SSR-client 不一致
export const PostContentWrapper = dynamic(
  () =>
    import("@/components/post/PostContentWrapper").then(
      (m) => m.PostContentWrapper
    ),
  { ssr: false }
);

// ─── 评论区 ─────────────────────────────────────────────────
// 含完整表单系统 + Supabase 实时 Listener，完全位于视口底部
// ssr: false 避免服务端注水 (hydration) 开销
export const CommentSection = dynamic(
  () =>
    import("@/components/post/CommentSection").then((m) => m.CommentSection),
  { ssr: false }
);

// ─── 文章目录 ────────────────────────────────────────────────
// 使用 IntersectionObserver 追踪滚动位置，依赖 DOM 环境
export const TableOfContents = dynamic(
  () => import("@/components/post/TableOfContents"),
  { ssr: false }
);
