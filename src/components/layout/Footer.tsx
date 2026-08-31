// components/layout/Footer.tsx
"use client";

import React from "react";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="w-full select-none bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-6 py-6 sm:py-8">
        {/* 居中版权与口号信息，去除代码技术栈与 About */}
        <div className="flex flex-col items-center justify-center gap-1 text-center font-mono text-[12px] text-neutral-400 dark:text-neutral-500">
          <span>© 2026 {siteConfig.name}</span>
          <span className="text-[11px] opacity-80">{siteConfig.tagline}</span>
        </div>
      </div>
    </footer>
  );
}