// components/post/LazyTableOfContents.tsx
// ⚡ 客户端桥接组件 — 目录组件依赖 IntersectionObserver，纯客户端加载
"use client";

import dynamic from "next/dynamic";

export const LazyTableOfContents = dynamic(
  () => import("@/components/post/TableOfContents"),
  { ssr: false }
);
