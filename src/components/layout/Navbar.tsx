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
      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full   text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/10 transition-all duration-200 cursor-pointer ${className}`}
      title="切换主题"
      aria-label="切换主题"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
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
    <header className="fixed inset-x-0 top-0 z-40 h-16 sm:h-[68px] border-b border-black/[0.06] dark:border-white/[0.08] bg-[#ede7dc]/80 dark:bg-[#181614]/80 backdrop-blur-md select-none transition-colors duration-200">
      {/* 顶部适度收拢容器 (参考图一排版：整体往内缩进，居中对称布局) */}
      <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-between px-4 sm:px-6 md:px-8">
        {/* ===================== 左侧：头像 + 状态胶囊 ===================== */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="group flex items-center shrink-0 cursor-pointer select-none"
            aria-label="回到首页"
          >
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-xl border border-black/[0.08] dark:border-white/15 bg-neutral-100 dark:bg-neutral-800 shadow-xs transition-transform duration-200 group-hover:scale-105">
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

        {/* ===================== 居中：导航栏链接 (图一卡片胶囊风格) ===================== */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center">
          <nav className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-[13px] sm:text-[14px] tracking-[0.01em] transition-all duration-200 px-3 py-1.5 rounded-lg select-none cursor-pointer ${
                    isActive
                      ? "bg-black/[0.07] dark:bg-white/10 text-neutral-900 dark:text-white font-medium border border-black/[0.05] dark:border-white/10 shadow-xs"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ===================== 右侧：圆形功能按钮 (图一风格) ===================== */}
        <div className="hidden md:flex items-center">
          <ThemeToggleButton />
        </div>

        {/* ===================== 移动端右侧：主题切换 + 汉堡菜单 ===================== */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggleButton />

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg  text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white cursor-pointer transition-colors"
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="md:hidden border-b border-black/[0.06] dark:border-white/[0.08] bg-[#ede7dc]/95 dark:bg-[#181614]/95 px-6 py-4 shadow-xl backdrop-blur-2xl"
          >
            {isOnline && (
              <div className="mb-3 pb-3 border-b border-black/[0.05] dark:border-white/[0.08]">
                <StatusCapsule />
              </div>
            )}
            <nav className="flex flex-col gap-1.5">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-black/[0.07] dark:bg-white/10 text-neutral-900 dark:text-white font-medium"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
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