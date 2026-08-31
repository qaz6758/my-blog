// app/thoughts/loading.tsx
import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ThoughtsLoading() {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between bg-transparent px-4 pt-24 pb-4 sm:px-8 lg:px-12 antialiased">
      <main className="mx-auto w-full max-w-3xl flex-1">
        {/* 头部标题与标语骨架 */}
        <header className="mb-10 pl-1 space-y-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-4 w-44 rounded-md opacity-60" />
        </header>

        {/* 随笔列表骨架 */}
        <div className="space-y-10">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="space-y-4 rounded-xl border border-black/[0.04] p-5 dark:border-white/[0.05]"
            >
              {/* 日期与徽章 */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md opacity-75" />
              </div>

              {/* 随笔主体正文 */}
              <div className="space-y-2.5 pt-1">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-[92%] rounded-md" />
                <Skeleton className="h-4 w-[78%] rounded-md" />
              </div>

              {/* 模拟随笔配图或引用块 */}
              {i === 2 && (
                <div className="pt-2">
                  <Skeleton className="h-36 w-full rounded-lg opacity-80" />
                </div>
              )}

              {/* 底部交互小栏 */}
              <div className="flex items-center gap-4 pt-2">
                <Skeleton className="h-4 w-12 rounded-md opacity-60" />
                <Skeleton className="h-4 w-12 rounded-md opacity-60" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
