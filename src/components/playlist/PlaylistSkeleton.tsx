// components/playlist/PlaylistSkeleton.tsx
"use client";

import React from "react";

export function PlaylistSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-10">
      {/* 顶部 Hero 骨架 */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 pt-2">
        {/* 大封面骨架 */}
        <div className="h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72 shrink-0 rounded-3xl bg-neutral-200/50 dark:bg-white/[0.05]" />

        {/* 歌单信息骨架 */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 flex-1 pt-2 w-full max-w-lg">
          <div className="h-4 w-24 rounded-md bg-neutral-200/60 dark:bg-white/[0.06]" />
          <div className="h-8 w-64 sm:w-80 rounded-lg bg-neutral-200/80 dark:bg-white/[0.08]" />
          <div className="h-4 w-full rounded-md bg-neutral-200/40 dark:bg-white/[0.04]" />
          <div className="h-4 w-3/4 rounded-md bg-neutral-200/40 dark:bg-white/[0.04]" />
          
          <div className="pt-2">
            <div className="h-10 w-28 rounded-full bg-neutral-200/70 dark:bg-white/[0.07]" />
          </div>
        </div>
      </div>

      {/* 歌曲列表骨架 */}
      <div className="w-full space-y-2 pt-6">
        {/* 表头骨架 */}
        <div className="flex items-center justify-between py-2 border-b border-black/[0.05] dark:border-white/[0.05]">
          <div className="h-3 w-12 rounded bg-neutral-200/50 dark:bg-white/[0.05]" />
          <div className="h-3 w-16 rounded bg-neutral-200/50 dark:bg-white/[0.05]" />
          <div className="h-3 w-16 rounded bg-neutral-200/50 dark:bg-white/[0.05]" />
          <div className="h-3 w-8 rounded bg-neutral-200/50 dark:bg-white/[0.05]" />
        </div>

        {/* 歌曲行骨架 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 px-2 rounded-2xl bg-transparent"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="h-4 w-4 rounded bg-neutral-200/40 dark:bg-white/[0.04]" />
              <div className="h-10 w-10 rounded-xl bg-neutral-200/60 dark:bg-white/[0.06]" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <div className="h-3.5 w-40 rounded bg-neutral-200/70 dark:bg-white/[0.07]" />
                <div className="h-2.5 w-24 rounded bg-neutral-200/40 dark:bg-white/[0.04]" />
              </div>
            </div>

            <div className="hidden md:block h-3 w-28 rounded bg-neutral-200/40 dark:bg-white/[0.04]" />
            <div className="hidden lg:block h-3 w-32 rounded bg-neutral-200/40 dark:bg-white/[0.04]" />
            <div className="h-3 w-10 rounded bg-neutral-200/40 dark:bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
