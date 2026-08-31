// app/loading.tsx
import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RootLoading() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full px-6 pt-24 pb-16 sm:pt-28">
      <div className="mx-auto w-full max-w-[650px] space-y-8">
        {/* 标题骨架 */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg opacity-60" />
        </div>

        {/* 正文段落骨架 */}
        <div className="space-y-4 pt-4">
          <Skeleton className="h-5 w-full rounded-lg" />
          <Skeleton className="h-5 w-[92%] rounded-lg" />
          <Skeleton className="h-5 w-[75%] rounded-lg" />
        </div>

        <div className="space-y-4 pt-2">
          <Skeleton className="h-5 w-[96%] rounded-lg" />
          <Skeleton className="h-5 w-[88%] rounded-lg" />
          <Skeleton className="h-5 w-[60%] rounded-lg" />
        </div>

        {/* 底部骨架 */}
        <div className="pt-8 space-y-3">
          <Skeleton className="h-4 w-28 rounded-md opacity-50" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
