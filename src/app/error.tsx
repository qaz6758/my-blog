// src/app/error.tsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Runtime Error Boundary caught]:", error);
  }, [error]);

  return (
    <div className="relative min-h-[75vh] w-full flex flex-col items-center justify-center px-6 text-center select-none">
      <div className="max-w-md mx-auto space-y-6">
        <span className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-neutral-300 dark:text-neutral-700">
          500
        </span>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
            遇到了一点小麻烦
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
            页面渲染或数据抓取时发生了偶发异常，请尝试重新加载或返回首页。
          </p>
        </div>

        <div className="pt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>重新尝试</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>回到首页</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
