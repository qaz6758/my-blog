// components/post/LazyPostContent.tsx
// ⚡ 客户端桥接组件 — next/dynamic ssr:false 必须在 Client Component 内声明
"use client";

import dynamic from "next/dynamic";

// ─── Prism.js + ReactMarkdown 代码高亮渲染器 ──────────────
// 13 种语言 Grammar 约 80KB，完全延迟到首屏绘制结束后按需拉取，移除闪烁骨架屏
export const LazyPostContent = dynamic(
  () =>
    import("@/components/post/PostContentWrapper").then(
      (m) => m.PostContentWrapper
    ),
  {
    ssr: true,
  }
);
