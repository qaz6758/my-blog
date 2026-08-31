// app/posts/[id]/loading.tsx
import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PostDetailLoading() {
  return (
    <div className="relative min-h-screen w-full px-5 pt-24 pb-20 sm:px-8 sm:pt-28">
      <div className="mx-auto w-full max-w-[760px]">
        {/* 返回按钮骨架 */}
        <div className="mb-8">
          <Skeleton className="h-6 w-20 rounded-md opacity-60" />
        </div>

        {/* 文章大标题骨架 */}
        <div className="mb-6 space-y-3">
          <Skeleton className="h-10 w-4/5 rounded-xl sm:h-12" />
          <Skeleton className="h-10 w-1/2 rounded-xl sm:h-12" />
        </div>

        {/* 文章元信息栏 (日期、分类、阅读时间) */}
        <div className="mb-10 flex flex-wrap items-center gap-4 border-b border-black/[0.06] pb-6 dark:border-white/[0.08]">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md opacity-75" />
          <Skeleton className="h-4 w-16 rounded-md opacity-75" />
        </div>

        {/* 正文段落骨架模拟 (段落、小标题、代码块) */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-[94%] rounded-md" />
            <Skeleton className="h-5 w-[88%] rounded-md" />
            <Skeleton className="h-5 w-[70%] rounded-md" />
          </div>

          <div className="pt-4">
            <Skeleton className="h-7 w-1/3 rounded-lg" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-[90%] rounded-md" />
            <Skeleton className="h-5 w-[82%] rounded-md" />
          </div>

          {/* 模拟代码块骨架 */}
          <div className="pt-2">
            <Skeleton className="h-40 w-full rounded-2xl opacity-80" />
          </div>

          <div className="space-y-3 pt-2">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-[96%] rounded-md" />
            <Skeleton className="h-5 w-[65%] rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
