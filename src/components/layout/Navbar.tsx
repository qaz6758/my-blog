// components/layout/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, ArrowUp } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { StatusCapsule } from "@/components/layout/StatusCapsule";
import { useLiveStatus } from "@/hooks/useLiveStatus";
import { useI18n } from "@/lib/i18n/I18nContext";

const NAV_LINKS = [
  { key: "nav.posts" as const, name: "Blog", href: "/posts" },
  { key: "nav.playlist" as const, name: "Playlist", href: "/playlist" },
  { key: "nav.gallery" as const, name: "Gallery", href: "/gallery" },
  { key: "nav.thoughts" as const, name: "Thinking", href: "/thoughts" },
];

function BrandLogo({ className = "h-8 w-8 sm:h-9 sm:w-9" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-neutral-800 dark:text-[#f3f0ea] transition-all duration-300 transform group-hover:scale-105"
        aria-label="Vince Ou (VO)"
      >
        <title>Vince Ou</title>
        {/* 方案 2：外层呼吸感微断环 O */}
        <path
          d="M 28 20 A 38 38 0 1 0 86 42"
          stroke="currentColor"
          strokeWidth="4.2"
          strokeLinecap="round"
          className="transition-all duration-300 group-hover:stroke-neutral-400"
        />
        {/* 方案 2：内切利落先锋折线 V */}
        <path
          d="M 40 38 L 52 64 L 68 38"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300 group-hover:translate-y-[-1px]"
        />
      </svg>
    </div>
  );
}

function ThemeToggleButton({ className = "" }: { className?: string }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      data-theme-toggle
      onClick={(e) => {
        let x = 0;
        let y = 0;
        if (e.currentTarget instanceof HTMLElement) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;
          }
        }
        if (x === 0 && y === 0 && typeof e.clientX === "number" && (e.clientX > 0 || e.clientY > 0)) {
          x = e.clientX;
          y = e.clientY;
        }
        if (x === 0 && y === 0 && typeof window !== "undefined") {
          x = window.innerWidth - 44;
          y = 28;
        }
        toggleTheme(e, {
          origin: { x, y },
        });
      }}
      className={`group relative flex h-9 w-9 items-center justify-center text-neutral-700 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none ${className}`}
      aria-label="切换明暗主题"
    >
      <Sun className="h-[19px] w-[19px] stroke-[2] rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[19px] w-[19px] stroke-[2] rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
    </button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const liveStatus = useLiveStatus();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const isOnline = (liveStatus.activity === "music" && liveStatus.music !== null) || liveStatus.app !== null;

  // 路由跳转时关闭移动端菜单
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Anthony Fu 原版：滚动超过 300px 显示右下角轻量回顶按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* ===================== Anthony Fu 原版回顶按钮 (当 scroll > 300 时右下角静默呈现) ===================== */}
      <button
        type="button"
        title="Scroll to top"
        aria-label="Scroll to top"
        onClick={scrollToTop}
        className={`fixed right-3 bottom-3 z-40 flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-500/20 dark:hover:bg-neutral-400/20 transition duration-300 cursor-pointer print:hidden ${
          showScrollTop ? "opacity-30 hover:opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      {/* ===================== 顶部导航容器（Antfu 方案 A：流式绝对定位，仅在最顶部展现，下滑自然滚出） ===================== */}
      <header 
        className="absolute inset-x-0 top-0 z-40 h-16 sm:h-[72px] bg-transparent select-none"
      >
        {/* 顶部通透全延展容器 (对齐 Anthony Fu antfu.me 极客排版：最边缘留白 20px) */}
        <div className="relative mx-auto flex h-full w-full items-center justify-end px-5">
          {/* ===================== 左侧：手写连笔 OW 艺术签名 Logo + 状态胶囊 (对齐 Antfu: absolute xl:fixed) ===================== */}
          <div className="flex items-center gap-3 absolute xl:fixed left-5 top-3.5 sm:top-3.5 z-50">
            <Link
              href="/"
              className="group flex items-center shrink-0 cursor-pointer select-none opacity-80 hover:opacity-100 transition-opacity duration-200"
              aria-label="回到首页"
              title="Vince Ou"
            >
              <BrandLogo />
            </Link>

            {/* 实时状态胶囊：仅在有状态信息（在线）时展示 */}
            {isOnline && (
              <div className="hidden sm:flex items-center">
                <StatusCapsule />
              </div>
            )}
          </div>

          {/* ===================== 右侧：文字导航 + 图标群带 Tooltip（Antfu 方案 A：纯静态流式，无滚动打扰） ===================== */}
          <div className="hidden md:flex items-center gap-6 lg:gap-7">
            <nav className="flex items-center gap-6 lg:gap-7 select-none">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[14.5px] sm:text-[15px] font-sans tracking-wide transition-opacity duration-200 select-none cursor-pointer py-1 ${
                      isActive
                        ? "opacity-100 font-bold text-black dark:text-white"
                        : "opacity-60 hover:opacity-100 text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <span>{t(link.key)}</span>
                  </Link>
                );
              })}
            </nav>

            {/* 右侧功能区：无任何竖线，全流式平铺衔接 */}
            <div className="flex items-center gap-3.5">
              {/* GitHub */}
              <div className="group relative flex items-center justify-center">
                <a
                  href="https://github.com/qaz6758"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center text-neutral-700 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none"
                  aria-label="GitHub Profile"
                >
                  <svg className="h-[20px] w-[20px]" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded bg-[#18181b] border border-white/10 text-white px-2 py-0.5 text-[11px] font-mono shadow-md whitespace-nowrap z-50">
                  GitHub
                </span>
              </div>


              {/* Theme Toggle */}
              <div className="group relative flex items-center justify-center">
                <ThemeToggleButton />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded bg-[#18181b] border border-white/10 text-white px-2 py-0.5 text-[11px] font-mono shadow-md whitespace-nowrap z-50">
                  Toggle Theme
                </span>
              </div>
            </div>
          </div>

          {/* ===================== 移动端右侧：世界切换 + 汉堡菜单 ===================== */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggleButton />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-700 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
              aria-label="切换菜单"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

      {/* ===================== 移动端空间展开 (不推动页面，融回内容) ===================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="pointer-events-auto absolute inset-x-0 top-full md:hidden bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md px-6 pt-2 pb-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
            variants={{
              open: { 
                opacity: 1, 
                y: 0, 
                transition: { 
                  duration: isDark ? 0.24 : 0.20, 
                  ease: "easeOut",
                  staggerChildren: 0.04,
                  delayChildren: 0.02
                } 
              },
              closed: { 
                opacity: 0, 
                y: -4, 
                transition: { 
                  duration: isDark ? 0.18 : 0.16, 
                  ease: "easeIn",
                  staggerChildren: 0.03,
                  staggerDirection: -1,
                  when: "afterChildren"
                } 
              }
            }}
            initial="closed"
            animate="open"
            exit="closed"
            style={{ 
              // 极弱的底缘背景差，替代生硬的 border
              backgroundImage: isDark ? "linear-gradient(to bottom, rgba(5,5,5,1) 85%, rgba(10,10,10,1) 100%)" : "none"
            }}
          >
            {isOnline && (
              <motion.div 
                variants={{
                  open: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
                  closed: { opacity: 0, y: -4, transition: { duration: 0.12, ease: "easeIn" } }
                }}
                className="mb-7 pl-2" // Status 与 Navigation 之间的呼吸空间 (28px)
              >
                <StatusCapsule hideWhenOffline={false} disablePopover={true} inlineApp={true} />
              </motion.div>
            )}
            
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <motion.div
                    key={link.name}
                    variants={{
                      open: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
                      closed: { opacity: 0, y: -4, transition: { duration: 0.12, ease: "easeIn" } }
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group relative flex items-center py-2 px-2 transition-colors cursor-pointer select-none"
                    >
                      <span className={`relative z-10 transition-colors ${
                        isActive
                          ? "text-neutral-900 dark:text-white font-medium tracking-wide"
                          : "text-neutral-500 dark:text-neutral-400 font-normal tracking-wide hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}>
                        {t(link.key)}
                      </span>
                      
                      {/* Active 痕迹 (极短、极细的纯黑/纯白) */}
                      <span 
                        className={`absolute left-2 bottom-1 h-[1.5px] transition-all duration-300 ease-out pointer-events-none rounded-full ${
                          isActive
                            ? "w-[16px] bg-neutral-950 dark:bg-white opacity-100"
                            : "w-0 bg-transparent opacity-0"
                        }`}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* 移动端底部快捷图标群 */}
            <div className="mt-5 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-4 pl-2">
              <a
                href="https://github.com/qaz6758"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
}