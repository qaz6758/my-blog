// components/layout/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, Rss } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { StatusCapsule } from "@/components/layout/StatusCapsule";
import { useLiveStatus } from "@/hooks/useLiveStatus";

const NAV_LINKS = [
  { name: "Blog", href: "/posts" },
  { name: "Playlist", href: "/playlist" },
  { name: "Gallery", href: "/gallery" },
  { name: "Thinking", href: "/thoughts" },
];

function BrandLogo({ className = "h-9 w-9 sm:h-11 sm:w-11" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-neutral-800 dark:text-[#f3f0ea] transition-all duration-300 transform group-hover:scale-105"
        aria-label="OW (Vince Ou)"
      >
        <title>OW @ vinceou.site</title>
        <path
          d="M 36 14 C 20 20 13 46 16 72 C 19 86 28 88 36 82 C 43 74 46 44 42 24 C 40 14 34 16 32 24 C 31 32 38 36 48 34 C 51 46 51 70 54 84 C 56 90 61 88 64 74 C 69 54 71 44 74 42 C 77 42 75 62 77 82 C 79 90 84 88 87 72 C 92 48 94 26 95 12"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
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
        if ((x === 0 && y === 0) && typeof window !== "undefined") {
          x = window.innerWidth - 44;
          y = 28;
        }
        toggleTheme(e, {
          origin: { x, y },
        });
      }}
      className={`flex h-9 w-9 items-center justify-center text-neutral-700 hover:text-neutral-950 dark:text-[#9d9589] dark:hover:text-[#eae5dc] opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none ${className}`}
      title="切换世界（昼行 / 夜行）"
      aria-label="切换世界（昼行 / 夜行）"
    >
      <span className="inline-flex items-center justify-center transition-transform duration-300 ease-out transform group-hover:rotate-12">
        <Sun className="h-[19px] w-[19px] stroke-[1.9] hidden dark:block" />
        <Moon className="h-[19px] w-[19px] stroke-[1.9] block dark:hidden" />
      </span>
    </button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const liveStatus = useLiveStatus();
  const { isDark } = useTheme();
  const isOnline = (liveStatus.activity === "music" && liveStatus.music !== null) || liveStatus.app !== null;

  // 路由跳转时恒定呼出导航栏
  useEffect(() => {
    setIsVisible(true);
  }, [pathname]);

  // 下滑平滑隐退，上滑即时呼出，顶部 60px 恒定展示
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // 顶部前 60px 恒定展示
          if (currentScrollY <= 60) {
            setIsVisible(true);
          } else {
            const diff = currentScrollY - lastScrollYRef.current;
            // 下滑超过 8px 且菜单未展开时隐退
            if (diff > 8 && !mobileMenuOpen) {
              setIsVisible(false);
            } else if (diff < -8) {
              // 上滑超过 8px 顺畅呼出
              setIsVisible(true);
            }
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  return (
    <header 
      className={`fixed inset-x-0 top-0 z-40 h-16 sm:h-[76px] bg-transparent select-none transition-transform duration-300 ease-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* 顶部通透全延展容器 (对齐 Anthony Fu antfu.me 极致两极排版：全屏展开，两端极致呼吸) */}
      <div className="relative mx-auto flex h-full w-full items-center justify-between px-6 sm:px-10 md:px-14 lg:px-16">
        {/* ===================== 左侧：手写连笔 OW 艺术签名 Logo + 状态胶囊 ===================== */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center shrink-0 cursor-pointer select-none opacity-80 hover:opacity-100 transition-opacity duration-200"
            aria-label="回到首页"
            title="OW @ vinceou.site"
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

        {/* ===================== 右侧：文字导航 + 图标群带 Tooltip（Anthony Fu 像素级复刻） ===================== */}
        <div className="hidden md:flex items-center gap-6 lg:gap-7">
          <nav className="flex items-center gap-6 lg:gap-7 select-none">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-[15px] sm:text-[16px] tracking-normal transition-opacity duration-200 select-none cursor-pointer py-1 ${
                    isActive
                      ? "opacity-100 font-medium text-neutral-950 dark:text-[#eae5dc]"
                      : "opacity-60 hover:opacity-100 text-neutral-800 dark:text-neutral-200"
                  }`}
                >
                  <span>{link.name}</span>
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
                className="flex h-9 w-9 items-center justify-center text-neutral-700 hover:text-neutral-950 dark:text-[#9d9589] dark:hover:text-[#eae5dc] opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none"
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

            {/* RSS */}
            <div className="group relative flex items-center justify-center">
              <Link
                href="/api/rss"
                target="_blank"
                className="flex h-9 w-9 items-center justify-center text-neutral-700 hover:text-neutral-950 dark:text-[#9d9589] dark:hover:text-[#eae5dc] opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-pointer select-none"
                aria-label="RSS Feed"
              >
                <Rss className="h-[19px] w-[19px] stroke-[2]" />
              </Link>
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded bg-[#18181b] border border-white/10 text-white px-2 py-0.5 text-[11px] font-mono shadow-md whitespace-nowrap z-50">
                RSS
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
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-700 hover:text-neutral-950 dark:text-[#9d9589] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
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
            className="absolute inset-x-0 top-full md:hidden bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md px-6 pt-2 pb-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
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
                          ? "text-neutral-900 dark:text-[#eae5dc] font-medium tracking-wide"
                          : "text-neutral-500 dark:text-[#888176] font-normal tracking-wide hover:text-neutral-800 dark:hover:text-[#c4bfb6]"
                      }`}>
                        {link.name}
                      </span>
                      
                      {/* Active 痕迹 (极短、极细的朱砂/月白) */}
                      <span 
                        className={`absolute left-2 bottom-1 h-[1.5px] transition-all duration-300 ease-out pointer-events-none rounded-full ${
                          isActive
                            ? "w-[16px] bg-[#b91c1c] dark:bg-white/40 opacity-100"
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
                className="flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-[#eae5dc] transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </a>
              <Link
                href="/api/rss"
                target="_blank"
                className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-[#eae5dc] transition-colors"
              >
                <Rss className="h-3.5 w-3.5 stroke-[1.9]" />
                <span>RSS</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}