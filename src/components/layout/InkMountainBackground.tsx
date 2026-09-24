// src/components/layout/InkMountainBackground.tsx
"use client";

import React from "react";

export function InkMountainBackground() {
  return (
    <div
      aria-hidden="true"
      className="hidden sm:block pointer-events-none select-none absolute right-0 bottom-0 z-0 pr-4 sm:pr-8 md:pr-14 pb-2 sm:pb-4"
    >
      {/* 浪客行（Vagabond）原画立绘：尺寸精致克制，四周留足呼吸感与水墨留白 */}
      <div className="relative flex items-end justify-end">
        <img
          src="/images/musashi-peony-cutout.webp"
          alt="Miyamoto Musashi with Peonies"
          className="w-auto h-[240px] sm:h-[270px] md:h-[300px] lg:h-[320px] max-h-[330px] object-contain object-bottom object-right drop-shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] opacity-80 dark:opacity-85 hover:opacity-100 transition-opacity duration-300"
        />
      </div>
    </div>
  );
}
