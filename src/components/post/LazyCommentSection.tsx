// components/post/LazyCommentSection.tsx
// ⚡ 客户端桥接组件 — 评论区完全懒加载，移除闪烁骨架屏
"use client";

import dynamic from "next/dynamic";

export const LazyCommentSection = dynamic(
  () =>
    import("@/components/post/CommentSection").then((m) => m.CommentSection),
  {
    ssr: false,
    loading: () => null,
  }
);
