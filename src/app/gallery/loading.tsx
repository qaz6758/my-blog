// app/gallery/loading.tsx
import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function GalleryLoading() {
  return (
    <div className="relative min-h-screen w-full px-4 pt-20 pb-12 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1800px]">
        {/* 画廊头部骨架 */}
        <div className="mb-10 space-y-3 pl-1">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-md opacity-60" />
        </div>

        {/* 瀑布流/网格照片卡片骨架 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className={`w-full overflow-hidden rounded-2xl ${
                i % 3 === 0
                  ? "aspect-[3/4]"
                  : i % 2 === 0
                  ? "aspect-square"
                  : "aspect-[4/5]"
              }`}
            >
              <Skeleton className="h-full w-full rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
