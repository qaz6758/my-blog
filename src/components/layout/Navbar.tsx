// components/layout/Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { SignatureLogo } from "@/components/layout/SignatureLogo";
import { StatusCapsule } from "@/components/layout/StatusCapsule";

const NAV_LINKS = [
  { name: "Blog", href: "/posts/" },
  { name: "Playlist", href: "/playlist" },
  { name: "Gallery", href: "/gallery" },
  { name: "thinking", href: "/thoughts" },
];

export function Navbar() {
  const pathname = usePathname();
  const { isDark, toggleTheme, mounted } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 监听页面滚动：常态透明，下滑 15px 后覆盖磨砂深灰底色
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 h-16 transition-all duration-300 ${
        isScrolled
          ? "border-b border-black/[0.06] bg-white/80 shadow-sm backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#141415]/85"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between px-4 sm:px-8 lg:px-12">
        {/* ===================== 左侧：签名 Logo + 紧随其后的状态胶囊 ===================== */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <Link
            href="/"
            className="group flex items-center cursor-pointer select-none"
            aria-label="回到首页"
          >
            <SignatureLogo className="h-7.5 w-auto text-neutral-900 transition-opacity group-hover:opacity-75 dark:text-neutral-100 sm:h-8.5" />
          </Link>

          {/* 引入现有状态组件，自带弹窗与交互逻辑 */}
          <StatusCapsule />
        </div>

        {/* ===================== 桌面端右侧：路由导航 + 主题切换 ===================== */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "text-neutral-950 font-semibold dark:text-white"
                      : "text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className="rounded-full p-2 text-neutral-500 hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
            title="切换主题"
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
        </div>

        {/* ===================== 移动端右侧：主题切换 + 汉堡菜单 ===================== */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className="rounded-full p-1.5 text-neutral-600 dark:text-neutral-400 cursor-pointer"
            title="切换主题"
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

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-neutral-700 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10 cursor-pointer"
            aria-label="切换菜单"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
            className="md:hidden border-b border-black/[0.06] bg-white/95 px-6 py-4 shadow-xl backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#141415]/95"
          >
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-semibold"
                        : "text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5"
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