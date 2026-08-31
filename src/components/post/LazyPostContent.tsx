// components/post/LazyPostContent.tsx
// ⚡ 客户端桥接组件 — next/dynamic ssr:false 必须在 Client Component 内声明
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";

// ─── Prism.js + ReactMarkdown 代码高亮渲染器 ──────────────
// 13 种语言 Grammar 约 80KB，完全延迟到首屏绘制结束后按需拉取
export const LazyPostContent = dynamic(
  () =>
    import("@/components/post/PostContentWrapper").then(
      (m) => m.PostContentWrapper
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-5 w-full rounded-md" />
        <Skeleton className="h-5 w-[95%] rounded-md" />
        <Skeleton className="h-5 w-[88%] rounded-md" />
        <Skeleton className="h-5 w-[70%] rounded-md" />
        <div className="pt-4">
          <Skeleton className="h-5 w-1/3 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-full rounded-md" />
        <Skeleton className="h-5 w-[92%] rounded-md" />
        <Skeleton className="h-40 w-full rounded-2xl opacity-80 mt-6" />
      </div>
    ),
  }
);
