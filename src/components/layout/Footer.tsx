// components/layout/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="w-full select-none bg-transparent">
      {/* 调整 pt-12 pb-12 为 py-4 */}
      <div className="mx-auto w-full max-w-3xl px-1 py-4">
        {/* 上层：版权、技术栈与快捷跳转 */}
        <div className="flex flex-col gap-3 text-[13px] leading-6 text-neutral-500 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[12px]">
            <span>© 2026 {siteConfig.name}</span>

            <span className="text-neutral-300 dark:text-neutral-700">
              /
            </span>

            <span>Next.js · Supabase</span>
          </div>

          <div className="flex items-center gap-4 text-[12.5px]">
            <Link
              href="/about"
              className="text-neutral-500 underline decoration-neutral-300 underline-offset-[3px] transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:decoration-neutral-700 dark:hover:text-neutral-100"
            >
              About
            </Link>

            <span className="text-neutral-300 dark:text-neutral-700">
              ·
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}