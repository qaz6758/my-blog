// src/components/layout/InkMountainBackground.tsx
"use client";

import React from "react";

export function InkMountainBackground() {
  return (
    <div
      aria-hidden="true"
      className="hidden sm:block pointer-events-none select-none absolute right-0 bottom-0 z-0 pr-4 sm:pr-8 md:pr-14 pb-0"
    >
      {/* 浪客行（Vagabond）原画立绘：严丝合缝贴底，右侧留足呼吸气口，尺寸克制灵动 */}
      <div className="relative flex items-end justify-end">
        <img
          src="/images/musashi-peony-cutout.webp"
          alt="Miyamoto Musashi with Peonies"
          className="w-auto h-[240px] sm:h-[270px] md:h-[300px] lg:h-[320px] max-h-[330px] object-contain object-bottom drop-shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] opacity-80 dark:opacity-85 hover:opacity-100 transition-opacity duration-300"
        />
      </div>
    </div>
  );
}
