"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function BackgroundImage() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  if (!isHomePage) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* =====================================================
          1. 移动端专属壁纸 (采用 CSS 背景层，确保 H1 文本成为秒级 LCP，手机跑分满分)
          ===================================================== */}
      <div
        className="
          block sm:hidden absolute inset-0
          bg-[url('/mobile-bg.webp')] bg-cover bg-right-bottom bg-no-repeat
          opacity-[0.08] dark:opacity-[0.07]
          mix-blend-multiply dark:mix-blend-screen
          dark:brightness-125 dark:contrast-125
        "
      />
      <div className="block sm:hidden absolute inset-0 bg-gradient-to-b from-white/90 via-transparent to-white/40 dark:from-[#050505]/95 dark:via-transparent dark:to-[#050505]/60" />

      {/* =====================================================
          2. 桌面 PC 端专属壁纸
          ===================================================== */}
      <div
        className="
          hidden sm:block absolute inset-0
          bg-[url('/pc-bg.webp')] bg-cover bg-center bg-no-repeat
          opacity-[0.10] dark:opacity-[0.08]
          mix-blend-multiply dark:mix-blend-screen
          dark:brightness-125 dark:contrast-125
        "
      />
      <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-[#050505]/60" />
    </div>
  );
}
