// app/posts/loading.tsx
import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PostsLoading() {
  return (
    <div className="relative min-h-screen w-full px-5 pt-24 pb-20 sm:px-8 sm:pt-28">
      <div className="mx-auto w-full max-w-[760px]">
        {/* 头部标题与描述骨架 */}
        <div className="mb-8 space-y-3">
          <Skeleton className="h-9 w-28 rounded-xl sm:h-10 sm:w-36" />
          <Skeleton className="h-4 w-60 rounded-md opacity-60" />
        </div>

        {/* 分类 Tab 胶囊骨架 */}
        <div className="mb-12 flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-4 dark:border-white/[0.08]">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg opacity-75" />
          <Skeleton className="h-7 w-24 rounded-lg opacity-75" />
          <Skeleton className="h-7 w-20 rounded-lg opacity-75" />
        </div>

        {/* 年份与文章列表条目骨架 */}
        <div className="space-y-12">
          {/* 年份区块 1 */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <Skeleton
                    className={`h-5 rounded-md ${
                      i % 3 === 0
                        ? "w-3/4"
                        : i % 2 === 0
                        ? "w-3/5"
                        : "w-4/5"
                    }`}
                  />
                  <Skeleton className="h-4 w-16 shrink-0 rounded-md opacity-60" />
                </div>
              ))}
            </div>
          </div>

          {/* 年份区块 2 */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-20 rounded-lg opacity-75" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <Skeleton
                    className={`h-5 rounded-md ${
                      i % 2 === 0 ? "w-2/3" : "w-1/2"
                    }`}
                  />
                  <Skeleton className="h-4 w-16 shrink-0 rounded-md opacity-60" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
