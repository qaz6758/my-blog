// src/components/layout/InkMountainBackground.tsx
"use client";

import React from "react";

export function InkMountainBackground() {
  return (
    <div
      aria-hidden="true"
      className="hidden sm:block pointer-events-none select-none absolute right-0 bottom-0 z-0"
    >
      {/* 浪客行（Vagabond）原画立绘：独立于页脚层级，局部放大呈现深邃武侠与水墨氛围 */}
      <div className="relative flex items-end justify-end">
        <img
          src="/images/musashi-peony-cutout.webp"
          alt="Miyamoto Musashi with Peonies"
          className="w-auto h-[360px] sm:h-[400px] md:h-[450px] lg:h-[490px] max-h-[520px] object-contain object-bottom object-right drop-shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_16px_40px_rgba(0,0,0,0.95)] opacity-90 dark:opacity-95 transition-all duration-300 transform origin-bottom-right"
        />
      </div>
    </div>
  );
}
