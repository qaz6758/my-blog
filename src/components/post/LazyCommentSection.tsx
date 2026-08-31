// components/post/LazyCommentSection.tsx
// ⚡ 客户端桥接组件 — 评论区完全懒加载，滚动到底部才拉取
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";

export const LazyCommentSection = dynamic(
  () =>
    import("@/components/post/CommentSection").then((m) => m.CommentSection),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-6 w-28 rounded-md" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    ),
  }
);
