// app/playlist/loading.tsx
import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PlaylistLoading() {
  return (
    <div className="relative min-h-screen w-full bg-transparent px-4 pt-20 pb-4 sm:px-8 lg:px-10 xl:px-14">
      <main className="mx-auto w-full max-w-[1800px]">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* 左侧侧边栏骨架 */}
          <div className="h-72 w-full animate-pulse rounded-2xl bg-neutral-200/50 dark:bg-neutral-800/40 lg:w-56 xl:w-64" />
          
          {/* 右侧音乐卡片网格骨架 */}
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl bg-neutral-200/50 dark:bg-neutral-800/40"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
