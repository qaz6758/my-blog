// src/components/layout/CctvTimestamp.tsx
"use client";

import React, { useState, useEffect } from "react";

function formatCctvTime(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}  ${hours}:${minutes}:${seconds}`;
}

/**
 * 门外实时监控时间戳组件
 * 使用站点统一的 W95FA 原生复古字体，每秒走秒更新当前真实时间
 */
export function CctvTimestamp() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    setTimeStr(formatCctvTime(new Date()));
    const interval = setInterval(() => {
      setTimeStr(formatCctvTime(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="hidden sm:block fixed top-6 left-8 sm:top-6 sm:left-8 z-40 select-none pointer-events-none"
      aria-label="实时监控时间戳"
    >
      <span
        suppressHydrationWarning
        className="font-['W95FA',monospace] text-[15px] sm:text-[17px] tracking-[0.05em] text-neutral-500 dark:text-neutral-400 transition-opacity"
      >
        {timeStr}
      </span>
    </div>
  );
}
