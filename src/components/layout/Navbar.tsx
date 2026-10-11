// components/layout/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useMusic } from "@/components/playlist/MusicContext";

// =========================================================================
// Ajeet Patel 物理弹簧参数体系 (layoutSpring & textSpring)
// =========================================================================
const layoutSpring = {
  type: "spring" as const,
  stiffness: 460,
  damping: 34,
  mass: 0.62,
};

const textSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.7,
};

// =========================================================================
// Custom App-Grade Animated Hollow Icons (Pure Outline Style - 空心极简线框)
// =========================================================================

// 0. Hollow Home Icon (纯空心小屋：房屋外轮廓 + 拱门悬浮回弹)
function HollowHomeIcon({ isHovered = false }: { isHovered?: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      <path d="M3 10.2L12 3.2L21 10.2V19.8C21 20.46 20.46 21 19.8 21H4.2C3.54 21 3 20.46 3 19.8V10.2Z" />
      <motion.path
        d="M9.5 21V14.5C9.5 13.12 10.62 12 12 12C13.38 12 14.5 13.12 14.5 14.5V21"
        variants={{
          rest: { scaleY: 1 },
          hover: {
            scaleY: [1, 1.18, 0.94, 1],
            transition: { duration: 0.36, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "12px 21px" }}
      />
    </motion.svg>
  );
}

// 1. Hollow Blog Icon (纯空心书本：书本外框 + 书脊竖线 + 丝带书签滑出微动效)
function HollowBlogIcon({ isHovered = false }: { isHovered?: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8.5" y1="3" x2="8.5" y2="21" strokeWidth="1.5" />
      <motion.path
        d="M13.5 3v6l-1.75-1.3L10 9V3"
        strokeWidth="1.5"
        variants={{
          rest: { y: 0 },
          hover: {
            y: [0, 3.5, 0],
            transition: { duration: 0.45, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "11.75px 3px" }}
      />
      <line x1="12" y1="13.5" x2="16.5" y2="13.5" strokeWidth="1.5" />
      <line x1="12" y1="17" x2="15" y2="17" strokeWidth="1.5" />
    </motion.svg>
  );
}

// 2. Hollow Playlist Icon (纯空心耳机：头梁圆弧 + 空心左右耳罩 + 中央音频律动跳跃)
function HollowPlaylistIcon({ isHovered = false }: { isHovered?: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      <path d="M4.5 13C4.5 7.8 8 4 12 4C16 4 19.5 7.8 19.5 13" />
      <rect x="2.5" y="11" width="4.5" height="8" rx="2.2" />
      <rect x="17" y="11" width="4.5" height="8" rx="2.2" />
      <motion.line
        x1="9.5"
        y1="13"
        x2="9.5"
        y2="17"
        strokeWidth="1.5"
        variants={{
          rest: { scaleY: 0.6 },
          hover: {
            scaleY: [0.6, 1.4, 0.4, 1.2, 0.6],
            transition: { duration: 0.52, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "9.5px 15px" }}
      />
      <motion.line
        x1="12"
        y1="11"
        x2="12"
        y2="19"
        strokeWidth="1.5"
        variants={{
          rest: { scaleY: 0.8 },
          hover: {
            scaleY: [0.8, 1.45, 0.35, 1.2, 0.8],
            transition: { duration: 0.55, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "12px 15px" }}
      />
      <motion.line
        x1="14.5"
        y1="13"
        x2="14.5"
        y2="17"
        strokeWidth="1.5"
        variants={{
          rest: { scaleY: 0.5 },
          hover: {
            scaleY: [0.5, 1.35, 0.5, 1.1, 0.5],
            transition: { duration: 0.48, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "14.5px 15px" }}
      />
    </motion.svg>
  );
}

// 3. Hollow Photos Icon (纯空心旁轴相机：机身空心轮廓 + 机械快门按钮 + 镜头内圈光圈对焦)
function HollowPhotosIcon({ isHovered = false }: { isHovered?: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      <path d="M4 7C2.9 7 2 7.9 2 9V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V9C22 7.9 21.1 7 20 7H16.5L15 4.5H9L7.5 7H4Z" />
      <motion.line
        x1="5.5"
        y1="4.5"
        x2="7.5"
        y2="4.5"
        strokeWidth="1.6"
        variants={{
          rest: { y: 0 },
          hover: {
            y: [0, 2, 0],
            transition: { duration: 0.32, ease: "easeInOut" },
          },
        }}
      />
      <circle cx="17.5" cy="9.5" r="0.8" strokeWidth="1.4" />
      <circle cx="12" cy="13.5" r="4.2" strokeWidth="1.8" />
      <motion.circle
        cx="12"
        cy="13.5"
        r="1.8"
        strokeWidth="1.4"
        variants={{
          rest: { scale: 1 },
          hover: {
            scale: [1, 0.4, 1.4, 1],
            transition: { duration: 0.44, ease: [0.16, 1, 0.3, 1] },
          },
        }}
        style={{ transformOrigin: "12px 13.5px" }}
      />
    </motion.svg>
  );
}

// 4. Hollow Thoughts Icon (纯空心随想气泡：空心对话气泡轮廓 + 内部 3 个小空心圆点微波浪跳跃)
function HollowThoughtsIcon({ isHovered = false }: { isHovered?: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      <path d="M12 3.5C6.75 3.5 2.5 7.1 2.5 11.5C2.5 13.8 3.55 15.8 5.3 17.2C5 18.6 4.25 19.8 3.2 20.6C3 20.8 3.15 21.2 3.45 21.1C5.9 20.8 8 19.5 9.2 18.9C10.1 19.3 11 19.5 12 19.5C17.25 19.5 21.5 15.9 21.5 11.5C21.5 7.1 17.25 3.5 12 3.5Z" />
      <motion.circle
        cx="8"
        cy="11.5"
        r="1"
        strokeWidth="1.4"
        variants={{
          rest: { y: 0 },
          hover: {
            y: [0, -2.5, 0],
            transition: { duration: 0.36, delay: 0, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "8px 11.5px" }}
      />
      <motion.circle
        cx="12"
        cy="11.5"
        r="1"
        strokeWidth="1.4"
        variants={{
          rest: { y: 0 },
          hover: {
            y: [0, -2.5, 0],
            transition: { duration: 0.36, delay: 0.08, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "12px 11.5px" }}
      />
      <motion.circle
        cx="16"
        cy="11.5"
        r="1"
        strokeWidth="1.4"
        variants={{
          rest: { y: 0 },
          hover: {
            y: [0, -2.5, 0],
            transition: { duration: 0.36, delay: 0.16, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "16px 11.5px" }}
      />
    </motion.svg>
  );
}

// 5. Hollow Theme Toggle Icon (纯空心主题切换：日间为空心太阳，暗夜为空心弯月)
function HollowThemeToggleIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-5 h-5 flex items-center justify-center shrink-0 ${className}`}>
      {/* 日间模式：空心小太阳 */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="block dark:hidden shrink-0 transition-transform duration-300 hover:rotate-45"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
      {/* 夜间模式：空心新月 */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden dark:block shrink-0 transition-transform duration-300 hover:-rotate-12"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </div>
  );
}

// =========================================================================
// 路由定义与激活研判
// =========================================================================
const NAV_ITEMS = [
  { name: "home", href: "/", icon: HollowHomeIcon },
  { name: "blog", href: "/posts", icon: HollowBlogIcon },
  { name: "playlist", href: "/playlist", icon: HollowPlaylistIcon },
  { name: "photos", href: "/photos", icon: HollowPhotosIcon },
  { name: "thoughts", href: "/thoughts", icon: HollowThoughtsIcon },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(href);
}

// =========================================================================
// 单项导航按钮组件
// =========================================================================
function DockNavItem({
  item,
  isActive,
  isExpanded,
  isHovered,
  onHover,
}: {
  item: (typeof NAV_ITEMS)[number];
  isActive: boolean;
  isExpanded: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`relative isolate inline-flex items-center justify-center rounded-full h-9 min-w-9 px-2.5 transition-colors duration-150 outline-none select-none cursor-pointer ${
        isActive
          ? "text-[#0969da] dark:text-[#33FF33] font-bold"
          : "text-[#656d76] hover:text-[#0969da] dark:text-[#a1a1aa] dark:hover:text-[#33FF33]"
      }`}
      aria-label={item.name}
    >
      <div className="flex items-center justify-center shrink-0 w-5 h-5">
        <Icon isHovered={isHovered} />
      </div>

      <motion.span
        aria-hidden={!isExpanded}
        initial={false}
        animate={{
          width: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
          x: isExpanded ? 0 : -4,
          marginLeft: isExpanded ? 7 : 0,
          filter: isExpanded ? "blur(0px)" : "blur(3px)",
        }}
        transition={textSpring}
        className="hidden sm:inline-block overflow-hidden whitespace-nowrap font-['W95FA',sans-serif] text-[13.5px] sm:text-[14px] tracking-wide pointer-events-none select-none"
      >
        {item.name}
      </motion.span>
    </Link>
  );
}

// =========================================================================
// 主题切换按钮组件
// =========================================================================
function ThemeActionItem({
  isExpanded,
  onHover,
}: {
  isExpanded: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}) {
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
          x = window.innerWidth / 2;
          y = 36;
        }
        toggleTheme(e, {
          origin: { x, y },
        });
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="relative isolate inline-flex items-center justify-center rounded-full h-9 min-w-9 px-2.5 transition-colors duration-150 outline-none select-none cursor-pointer text-[#656d76] hover:text-[#0969da] dark:text-[#a1a1aa] dark:hover:text-[#33FF33]"
      aria-label="切换主题"
      title="切换主题"
    >
      <div className="flex items-center justify-center shrink-0 w-5 h-5">
        <HollowThemeToggleIcon />
      </div>

      <motion.span
        aria-hidden={!isExpanded}
        initial={false}
        animate={{
          width: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
          x: isExpanded ? 0 : -4,
          marginLeft: isExpanded ? 7 : 0,
          filter: isExpanded ? "blur(0px)" : "blur(3px)",
        }}
        transition={textSpring}
        className="hidden sm:inline-block overflow-hidden whitespace-nowrap font-['W95FA',sans-serif] text-[13.5px] sm:text-[14px] tracking-wide pointer-events-none select-none"
      >
        theme
      </motion.span>
    </button>
  );
}

// =========================================================================
// 主导出 Navbar 组件
// =========================================================================
export function Navbar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { currentSong } = useMusic();

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

  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return;
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
    collapseTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
      setHoveredKey(null);
    }, 90);
  };

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* ===================== Anthony Fu 回顶按钮 (当 scroll > 300 时右下角静默呈现) ===================== */}
      <button
        type="button"
        title="Scroll to top"
        aria-label="Scroll to top"
        onClick={scrollToTop}
        className={`fixed right-4 sm:right-6 z-40 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-500/20 dark:hover:bg-neutral-400/20 transition-all duration-300 cursor-pointer print:hidden ${
          currentSong
            ? "bottom-[calc(92px+env(safe-area-inset-bottom,0px))] sm:bottom-6"
            : "bottom-[calc(18px+env(safe-area-inset-bottom,0px))] sm:bottom-6"
        } ${
          showScrollTop ? "opacity-60 hover:opacity-100 dark:opacity-75 dark:hover:opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      {/* ===================== 顶部居中悬浮交互 Dock ===================== */}
      <header
        className="fixed top-[calc(14px+env(safe-area-inset-top,0px))] sm:top-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none transition-all duration-300"
      >
        <motion.nav
          layout="size"
          transition={layoutSpring}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-home-dock
          className="pointer-events-auto relative inline-flex items-center overflow-hidden rounded-full border-2 border-[#d0d7de] bg-white/90 shadow-[0_0_0_1px_rgba(208,215,222,0.8)] dark:border-[#484848] dark:bg-[#080808] dark:shadow-none backdrop-blur-2xl p-1.5 gap-1 select-none min-h-[48px]"
          aria-label="主导航栏"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <DockNavItem
                key={item.href}
                item={item}
                isActive={isActive}
                isExpanded={isExpanded}
                isHovered={hoveredKey === item.name}
                onHover={(h) => setHoveredKey(h ? item.name : null)}
              />
            );
          })}

          <ThemeActionItem
            isExpanded={isExpanded}
            isHovered={hoveredKey === "theme"}
            onHover={(h) => setHoveredKey(h ? "theme" : null)}
          />
        </motion.nav>
      </header>
    </>
  );
}