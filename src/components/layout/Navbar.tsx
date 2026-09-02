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
      className={`text-neutral-400 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white opacity-60 hover:opacity-100 transition-all duration-200 cursor-pointer ${className}`}
      title="切换主题"
      aria-label="切换主题"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-[18px] w-[18px]" />
        ) : (
          <Moon className="h-[18px] w-[18px]" />
        )
      ) : (
        <div className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 监听页面滚动：常态透明，下滑 15px 后覆盖磨砂底色
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
      className={`fixed inset-x-0 top-0 z-40 h-16 sm:h-[68px] transition-all duration-300 ${
        isScrolled
          ? "border-b border-black/[0.06] bg-white/85 shadow-xs backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#050505]/85"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {/* 顶部全宽铺满容器 */}
      <div className="flex h-full w-full items-center justify-between px-5 sm:px-8 md:px-10 lg:px-14 xl:px-16">
        {/* ===================== 左侧：签名 Logo + 状态胶囊 ===================== */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="group flex items-center cursor-pointer select-none"
            aria-label="回到首页"
          >
            <SignatureLogo className="h-9 w-auto text-neutral-900 transition-opacity group-hover:opacity-75 dark:text-neutral-100 sm:h-[42px]" />
          </Link>

          {/* 实时状态胶囊：仅 PC 端显示，移动端隐藏 */}
          <div className="hidden md:flex items-center">
            <StatusCapsule />
          </div>
        </div>

        {/* ===================== 桌面端右侧：极简纯文字（灰变白高对比度过渡） + 主题切换 ===================== */}
        <div className="hidden md:flex items-center gap-5 lg:gap-7">
          <nav className="flex items-center gap-5 sm:gap-7">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-[14px] tracking-[0.01em] transition-opacity duration-200 py-1 select-none cursor-pointer font-normal text-neutral-900 dark:text-white ${
                    isActive
                      ? "opacity-100"
                      : "opacity-55 hover:opacity-100"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="h-3.5 w-[1px] bg-black/[0.08] dark:bg-white/[0.1]" />

          <ThemeToggleButton className="p-1" />
        </div>

        {/* ===================== 移动端右侧：主题切换 + 汉堡菜单 ===================== */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggleButton className="p-1" />

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-neutral-700 dark:text-neutral-300 cursor-pointer"
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
            className="md:hidden border-b border-black/[0.06] bg-white/95 px-6 py-4 shadow-xl backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#050505]/95"
          >
            <nav className="flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-1.5 text-sm transition-opacity duration-200 cursor-pointer font-normal text-neutral-900 dark:text-white ${
                      isActive
                        ? "opacity-100"
                        : "opacity-55 hover:opacity-100"
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