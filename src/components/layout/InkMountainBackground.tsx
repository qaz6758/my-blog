// src/components/layout/InkMountainBackground.tsx
"use client";

import React from "react";

export function InkMountainBackground() {
  return (
<div
  aria-hidden="true"
  className="hidden sm:block pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden z-0"
>
      {/* 浪客行（Vagabond）原画抠图真迹：武藏持刀伫立，赤墨牡丹绽放，纯净无缝贴底 */}
      <div className="absolute right-0 bottom-0 h-full flex items-end justify-end pointer-events-none z-10 pr-2 sm:pr-6 md:pr-12">
        <img
          src="/images/musashi-peony-cutout.webp"
          alt="Miyamoto Musashi with Peonies"
          className="h-[230px] sm:h-[260px] md:h-[290px] max-h-[300px] w-auto object-contain object-bottom drop-shadow-[0_8px_24px_rgba(0,0,0,0.10)] dark:drop-shadow-[0_12px_30px_rgba(0,0,0,0.9)] transition-all duration-300"
        />
      </div>
    </div>
  );
}
