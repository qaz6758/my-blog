// app/thoughts/[id]/loading.tsx
import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ThoughtDetailLoading() {
  return (
    <div className="relative min-h-screen w-full px-5 pt-24 pb-20 sm:px-8 sm:pt-28">
      <div className="mx-auto w-full max-w-[760px] space-y-8">
        {/* 返回按钮 */}
        <Skeleton className="h-6 w-20 rounded-md opacity-60" />

        {/* 思考详情卡片骨架 */}
        <div className="space-y-6 rounded-2xl border border-black/[0.05] p-6 dark:border-white/[0.06] sm:p-8">
          <div className="flex items-center justify-between border-b border-black/[0.05] pb-4 dark:border-white/[0.06]">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md opacity-75" />
          </div>

          <div className="space-y-3 pt-2">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-[96%] rounded-md" />
            <Skeleton className="h-5 w-[88%] rounded-md" />
            <Skeleton className="h-5 w-[75%] rounded-md" />
          </div>

          {/* 配图骨架 */}
          <div className="pt-4">
            <Skeleton className="h-64 w-full rounded-xl opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}
