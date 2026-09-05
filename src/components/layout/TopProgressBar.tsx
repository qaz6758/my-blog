"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * TopProgressLine
 * 纯 CSS 极简流体顶部进度条（适用于局部异步占位）
 */
export function TopProgressLine() {
  return (
    <div
      id="top-progress-bar"
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none overflow-hidden h-[1.5px]"
      style={{
        lineHeight: 0,
        fontSize: 0,
      }}
    >
      <div
        className="w-full h-full bg-gradient-to-r from-transparent via-[#8c7150] to-neutral-800 dark:via-[#c8ab83]/70 dark:to-[#ede7dc] animate-top-progress"
      />
    </div>
  );
}

/**
 * TopProgressBar
 * 全局路由跳转顶部极简微光流体进度指示条
 * 严格锁定 1.5px 发丝级高度，无感缝合进顶部导航
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setVisible(true);
    setProgress(18);

    // 平滑流体步进
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        const diff = (85 - prev) * 0.2;
        return Math.min(85, prev + Math.max(diff, 2));
      });
    }, 140);
  };

  const done = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    fadeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
  };

  // 路由发生变化时迅速跑满 100% 并渐隐
  useEffect(() => {
    done();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [pathname, searchParams]);

  // 监听站内跳转链接点击，秒级响应
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
        return;
      }

      const anchor = (e.target as Element).closest<HTMLAnchorElement>("a");
      if (!anchor) return;

      const target = anchor.getAttribute("target");
      const href = anchor.getAttribute("href");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin === window.location.origin) {
          const currentUrl = new URL(window.location.href);
          if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
            start();
          }
        }
      } catch {}
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      id="top-progress-bar"
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[1.5px]"
      style={{
        lineHeight: 0,
        fontSize: 0,
        opacity: visible ? 1 : 0,
        transition: "opacity 240ms ease",
      }}
    >
      <div
        className="relative h-full bg-gradient-to-r from-transparent via-[#8c7150]/60 to-neutral-800 dark:via-[#c8ab83]/60 dark:to-[#ede7dc]"
        style={{
          width: `${progress}%`,
          transition:
            progress === 100
              ? "width 100ms ease-out"
              : "width 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* 前端微光发丝光晕（极细柔和，绝无刺眼粗白雾） */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[2px] w-8 bg-gradient-to-r from-transparent to-white/90 dark:to-[#ede7dc] blur-[0.5px]" />
      </div>
    </div>
  );
}
