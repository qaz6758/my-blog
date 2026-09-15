// components/layout/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
      className={`group flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-neutral-700 hover:text-neutral-950 dark:text-[#9d9589] dark:hover:text-[#eae5dc] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] active:scale-90 transition-transform duration-200 ease-out cursor-pointer select-none ${className}`}
      style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
      title="切换世界（昼行 / 夜行）"
      aria-label="切换世界（昼行 / 夜行）"
    >
      <span className="inline-flex items-center justify-center transition-transform duration-300 ease-out transform group-hover:rotate-12 group-active:scale-90">
        <Sun className="h-4 w-4 stroke-[1.75] hidden dark:block" />
        <Moon className="h-4 w-4 stroke-[1.75] block dark:hidden" />
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
      className={`fixed inset-x-0 top-0 z-40 h-16 sm:h-[68px] bg-transparent select-none transition-transform duration-300 ease-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* 顶部适度收拢容器 (居中对称排版，微缩进) */}
      <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-between px-4 sm:px-6 md:px-8">
        {/* ===================== 左侧：头像身份锚点 + 状态胶囊 ===================== */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="group flex items-center shrink-0 cursor-pointer select-none"
            aria-label="回到首页"
          >
            <div 
              className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-full border border-black/[0.08] dark:border-white/15 bg-neutral-100 dark:bg-[#201e1b] shadow-2xs transition-all group-hover:scale-[1.03] group-hover:border-black/15 dark:group-hover:border-white/25 shrink-0"
              style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
            >
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
                  className={`group relative text-[13px] sm:text-[14px] tracking-[0.02em] px-3 py-1.5 transition-colors select-none cursor-pointer ${
                    isActive
                      ? "text-neutral-950 dark:text-[#eae5dc] font-semibold"
                      : "text-neutral-600 hover:text-neutral-950 dark:text-[#9d9589] dark:hover:text-[#eae5dc] font-normal"
                  }`}
                  style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
                >
                  <span>{link.name}</span>
                  {/* 昼行朱砂印痕 / 夜行素霜月白细痕（极细 1.5px，告别 SaaS 卡片底框） */}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 inset-x-2.5 h-[1.5px] rounded-full transition-all pointer-events-none ${
                      isActive
                        ? "bg-[#b91c1c] dark:bg-white/45 opacity-100 scale-x-100"
                        : "bg-[#b91c1c]/0 dark:bg-white/0 opacity-0 scale-x-75 group-hover:bg-black/15 dark:group-hover:bg-white/20 group-hover:opacity-60"
                    }`}
                    style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
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
            className="absolute inset-x-0 top-full md:hidden bg-[#ede7dc]/95 dark:bg-[#111213]/95 backdrop-blur-md px-6 pt-2 pb-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
            style={{ 
              // 极弱的底缘背景差，替代生硬的 border
              backgroundImage: isDark ? "linear-gradient(to bottom, rgba(24,22,20,1) 85%, rgba(20,18,16,1) 100%)" : "none"
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}