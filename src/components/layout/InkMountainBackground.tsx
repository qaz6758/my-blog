// src/components/layout/InkMountainBackground.tsx
"use client";

import React from "react";

export function InkMountainBackground() {
  return (
<div
  aria-hidden="true"
  className="hidden sm:block pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden z-0"
>
      {/* ===================== 日间：混沌武士（Champloo）落日荒原赤阳 ===================== */}
      <div className="block dark:hidden absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <img
          src="/images/footer-champloo-day.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-right mix-blend-multiply opacity-95 transition-opacity duration-500"
        />
      </div>

      {/* ===================== 夜间：浪客行（Vagabond）原画抠图真迹（纯净夜色底色，贴合底部） ===================== */}
      <div className="hidden dark:block absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {/* 前景层：原画抠图真迹（武藏持刀伫立暗夜，赤墨牡丹绽放，严丝合缝贴合底部） */}
        <div className="absolute right-0 bottom-0 h-full flex items-end justify-end pointer-events-none z-10 pr-2 sm:pr-6 md:pr-12">
          <img
            src="/images/musashi-peony-cutout.webp"
            alt="Miyamoto Musashi with Peonies"
            className="h-[84%] sm:h-[90%] md:h-[94%] max-h-[460px] w-auto object-contain object-bottom drop-shadow-[0_12px_30px_rgba(0,0,0,0.9)]"
          />
        </div>
      </div>
    </div>
  );
}
