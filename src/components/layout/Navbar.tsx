// components/layout/Navbar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { StatusCapsule } from "@/components/layout/StatusCapsule";
import { useLiveStatus } from "@/hooks/useLiveStatus";

const NAV_LINKS = [
  { name: "Blog", href: "/posts" },
  { name: "Playlist", href: "/playlist" },
  { name: "Gallery", href: "/gallery" },
  { name: "Thinking", href: "/thoughts" },
];

function ThemeToggleButton({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={(e) => toggleTheme(e)}
      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-neutral-700 hover:text-neutral-950 dark:text-[#9d9589] dark:hover:text-[#eae5dc] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] active:scale-95 transition-all duration-200 cursor-pointer select-none ${className}`}
      title="切换世界（昼行 / 夜行）"
      aria-label="切换世界（昼行 / 夜行）"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4 stroke-[1.75]" />
        ) : (
          <Moon className="h-4 w-4 stroke-[1.75]" />
        )
      ) : (
        <div className="h-4 w-4" />
      )}
    </button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const liveStatus = useLiveStatus();
  const isOnline = (liveStatus.activity === "music" && liveStatus.music !== null) || liveStatus.app !== null;

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 sm:h-[68px] border-b border-black/[0.06] dark:border-white/[0.04] bg-[#ede7dc]/88 dark:bg-[#181614]/92 backdrop-blur-md select-none transition-colors duration-300">
      {/* 顶部适度收拢容器 (居中对称排版，微缩进) */}
      <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-between px-4 sm:px-6 md:px-8">
        {/* ===================== 左侧：头像身份锚点 + 状态胶囊 ===================== */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="group flex items-center shrink-0 cursor-pointer select-none"
            aria-label="回到首页"
          >
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-xl border border-black/[0.07] dark:border-white/10 bg-neutral-100 dark:bg-[#201e1b] shadow-2xs transition-all duration-200 group-hover:scale-105 group-hover:border-black/15 dark:group-hover:border-white/20">
              <img
                src="/avatar.jpg"
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
          </Link>

          {/* 实时状态胶囊：仅在有状态信息（在线）时展示 */}
          {isOnline && (
            <div className="hidden md:flex items-center">
              <StatusCapsule />
            </div>
          )}
        </div>

        {/* ===================== 居中：导航栏链接（墨字排印 + 题跋落痕） ===================== */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center">
          <nav className="flex items-center gap-1 sm:gap-2 py-1 px-1 select-none">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative text-[13px] sm:text-[14px] tracking-[0.02em] px-3 py-1.5 transition-colors duration-200 select-none cursor-pointer ${
                    isActive
                      ? "text-neutral-950 dark:text-[#eae5dc] font-semibold"
                      : "text-neutral-600 hover:text-neutral-950 dark:text-[#9d9589] dark:hover:text-[#eae5dc] font-normal"
                  }`}
                >
                  <span>{link.name}</span>
                  {/* 昼行朱砂印痕 / 夜行素霜月白细痕（极细 1.5px，告别 SaaS 卡片底框） */}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 inset-x-2.5 h-[1.5px] rounded-full transition-all duration-200 pointer-events-none ${
                      isActive
                        ? "bg-[#b91c1c] dark:bg-white/45 opacity-100 scale-x-100"
                        : "bg-[#b91c1c]/0 dark:bg-white/0 opacity-0 scale-x-75 group-hover:bg-black/15 dark:group-hover:bg-white/20 group-hover:opacity-60"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ===================== 右侧：世界切换触发器 (克制、无光晕) ===================== */}
        <div className="hidden md:flex items-center">
          <ThemeToggleButton />
        </div>

        {/* ===================== 移动端右侧：世界切换 + 汉堡菜单 ===================== */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggleButton />

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-700 hover:text-neutral-950 dark:text-[#9d9589] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
            aria-label="切换菜单"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ===================== 移动端下拉折叠菜单 ===================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-b border-black/[0.06] dark:border-white/[0.04] bg-[#ede7dc]/96 dark:bg-[#181614]/96 px-6 py-4 shadow-xl backdrop-blur-2xl"
          >
            {isOnline && (
              <div className="mb-3 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                <StatusCapsule />
              </div>
            )}
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? "border-l-2 border-l-[#b91c1c] dark:border-l-white/45 text-neutral-950 dark:text-[#eae5dc] font-semibold bg-black/[0.025] dark:bg-white/[0.03] pl-2.5"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-[#9d9589] dark:hover:text-[#eae5dc]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}