// components/layout/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef, useId } from "react";
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
// Custom App-Grade Animated Icons (Duotone Ink Style)
// =========================================================================

// 0. Duotone Home Icon (高辨识度墨色小屋：屋脊轮廓 + 半透墨色 + 门洞悬浮回弹)
function DuotoneHomeIcon({ isHovered = false }: { isHovered?: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      {/* 房屋外框与尖顶：1.8px 墨线 + 26% 透光墨色 */}
      <path
        d="M3 10.2L12 3.2L21 10.2V19.8C21 20.46 20.46 21 19.8 21H4.2C3.54 21 3 20.46 3 19.8V10.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.26"
      />
      {/* 拱形门洞：悬浮时柔和轻微跳跃回弹 */}
      <motion.path
        d="M9.5 21V14.5C9.5 13.12 10.62 12 12 12C13.38 12 14.5 13.12 14.5 14.5V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
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

// 1. Duotone Blog Icon (高辨识度水墨手册：封皮线框 + 浓墨书脊 + 丝带书签滑出 + 阅读条纹延展)
function DuotoneBlogIcon({ isHovered = false }: { isHovered?: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.28"
      />
      <rect
        x="4"
        y="3"
        width="4.2"
        height="18"
        rx="1.2"
        fill="currentColor"
      />
      <motion.path
        d="M12.8 2.5H9.5V10.8L11.15 9.4L12.8 10.8V2.5Z"
        fill="currentColor"
        variants={{
          rest: { y: 0, rotate: 0 },
          hover: {
            y: [0, 4.2, -0.5, 0],
            rotate: [0, -3.5, 1.5, 0],
            transition: { duration: 0.5, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "11px 2.5px" }}
      />
      <motion.rect
        x="10"
        y="13.2"
        width="6.5"
        height="1.6"
        rx="0.8"
        fill="currentColor"
        variants={{
          rest: { scaleX: 1, opacity: 0.7 },
          hover: {
            scaleX: [1, 1.35, 1],
            opacity: [0.7, 1, 0.7],
            transition: { duration: 0.45, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "10px 13.2px" }}
      />
      <motion.rect
        x="10"
        y="16.5"
        width="4.2"
        height="1.6"
        rx="0.8"
        fill="currentColor"
        variants={{
          rest: { scaleX: 1, opacity: 0.7 },
          hover: {
            scaleX: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
            transition: { duration: 0.45, delay: 0.08, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "10px 16.5px" }}
      />
    </motion.svg>
  );
}

// 2. Duotone Playlist Icon (高辨识度头戴耳机：清晰头梁圆弧 + 实体耳罩微震 + 中央音频均衡器跳跃)
function DuotonePlaylistIcon({ isHovered = false }: { isHovered?: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      <path
        d="M4 14C4 8.5 7.6 4 12 4C16.4 4 20 8.5 20 14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <motion.rect
        x="2"
        y="11"
        width="5"
        height="8.5"
        rx="2.5"
        fill="currentColor"
        variants={{
          rest: { scale: 1 },
          hover: { scale: [1, 1.15, 1], transition: { duration: 0.38 } },
        }}
        style={{ transformOrigin: "4.5px 15px" }}
      />
      <motion.rect
        x="17"
        y="11"
        width="5"
        height="8.5"
        rx="2.5"
        fill="currentColor"
        variants={{
          rest: { scale: 1 },
          hover: { scale: [1, 1.15, 1], transition: { duration: 0.38 } },
        }}
        style={{ transformOrigin: "19.5px 15px" }}
      />
      <motion.rect
        x="9.2"
        y="12"
        width="1.6"
        height="6.5"
        rx="0.8"
        fill="currentColor"
        variants={{
          rest: { scaleY: 0.5 },
          hover: {
            scaleY: [0.5, 1.4, 0.25, 1.1, 0.5],
            transition: { duration: 0.52, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "10px 18.5px" }}
      />
      <motion.rect
        x="11.7"
        y="9.5"
        width="1.6"
        height="9"
        rx="0.8"
        fill="currentColor"
        variants={{
          rest: { scaleY: 0.7 },
          hover: {
            scaleY: [0.7, 1.45, 0.3, 1.25, 0.7],
            transition: { duration: 0.55, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "12.5px 18.5px" }}
      />
      <motion.rect
        x="14.2"
        y="11.5"
        width="1.6"
        height="7"
        rx="0.8"
        fill="currentColor"
        variants={{
          rest: { scaleY: 0.45 },
          hover: {
            scaleY: [0.45, 1.35, 0.5, 1.05, 0.45],
            transition: { duration: 0.48, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "15px 18.5px" }}
      />
    </motion.svg>
  );
}

// 3. Duotone Photos Icon (高辨识度旁轴相机：清晰机身轮廓 + 机械快门真实下沉 + 镜头光圈对焦)
function DuotonePhotosIcon({ isHovered = false }: { isHovered?: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      <path
        d="M4 6.8C2.9 6.8 2 7.7 2 8.8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8.8C22 7.7 21.1 6.8 20 6.8H16.5L15 4.5H9L7.5 6.8H4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.28"
      />
      <motion.rect
        x="5"
        y="3"
        width="3.2"
        height="2"
        rx="0.75"
        fill="currentColor"
        variants={{
          rest: { y: 0 },
          hover: {
            y: [0, 2.2, 0],
            transition: { duration: 0.32, ease: "easeInOut" },
          },
        }}
      />
      <circle
        cx="17.2"
        cy="8.2"
        r="1.1"
        fill="currentColor"
      />
      <circle
        cx="12"
        cy="13.2"
        r="4.6"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <motion.circle
        cx="12"
        cy="13.2"
        r="2.2"
        fill="currentColor"
        variants={{
          rest: { scale: 1 },
          hover: {
            scale: [1, 0.35, 1.35, 1],
            transition: { duration: 0.44, ease: [0.16, 1, 0.3, 1] },
          },
        }}
        style={{ transformOrigin: "12px 13.2px" }}
      />
    </motion.svg>
  );
}

// 4. Style 1 Thoughts Icon (极度饱满纯实心随想气泡：内部 3 墨孔波浪跃起)
function Style1ThoughtsIcon({ isHovered = false }: { isHovered?: boolean }) {
  const rawId = useId();
  const maskId = "nav-thought-mask-" + rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="overflow-visible shrink-0"
      animate={isHovered ? "hover" : "rest"}
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <motion.circle
            cx="7.8"
            cy="11.5"
            r="1.6"
            fill="black"
            variants={{
              rest: { y: 0, scale: 1 },
              hover: {
                y: [0, -3.5, 0],
                scale: [1, 1.25, 1],
                transition: { duration: 0.42, delay: 0, ease: "easeInOut" },
              },
            }}
          />
          <motion.circle
            cx="12"
            cy="11.5"
            r="1.6"
            fill="black"
            variants={{
              rest: { y: 0, scale: 1 },
              hover: {
                y: [0, -3.5, 0],
                scale: [1, 1.25, 1],
                transition: { duration: 0.42, delay: 0.09, ease: "easeInOut" },
              },
            }}
          />
          <motion.circle
            cx="16.2"
            cy="11.5"
            r="1.6"
            fill="black"
            variants={{
              rest: { y: 0, scale: 1 },
              hover: {
                y: [0, -3.5, 0],
                scale: [1, 1.25, 1],
                transition: { duration: 0.42, delay: 0.18, ease: "easeInOut" },
              },
            }}
          />
        </mask>
      </defs>

      <motion.path
        mask={`url(#${maskId})`}
        d="M12 3C6.48 3 2 6.8 2 11.5C2 13.9 3.1 16 5 17.5C4.7 18.9 3.9 20.2 2.8 21.1C2.5 21.3 2.7 21.8 3.1 21.7C5.8 21.4 8.1 20 9.4 19.3C10.2 19.8 11.1 20 12 20C17.5 20 22 16.2 22 11.5C22 6.8 17.5 3 12 3Z"
        fill="currentColor"
        variants={{
          rest: { scale: 1 },
          hover: {
            scale: [1, 1.1, 0.98, 1],
            transition: { duration: 0.38, ease: "easeInOut" },
          },
        }}
        style={{ transformOrigin: "12px 12px" }}
      />
    </motion.svg>
  );
}

// 5. Paul Stamatiou Theme Toggle Icon (太阳 180° 自转隐退 + 黑色月牙遮罩滑入咬合)
function PaulThemeToggleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width="20"
      height="20"
      fill="currentColor"
      className={`theme-toggle shrink-0 ${className}`}
      viewBox="0 0 32 32"
    >
      <defs>
        <clipPath id="theme-picker-cutout">
          <path d="M0-11h25a1 1 0 0117 13v30H0Z" />
        </clipPath>
        <mask id="theme-picker-moon-mask">
          <rect width="32" height="32" fill="white" />
          <circle className="moon-cradle" cx="28" cy="8" r="10" fill="black" />
        </mask>
      </defs>
      <g clipPath="url(#theme-picker-cutout)">
        <circle className="main-circle" cx="16" cy="16" r="8.5" mask="url(#theme-picker-moon-mask)" />
        <path
          className="sun-rays"
          d="M16 .9c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3S14.7.9 16 .9zm0 25.6c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3zm12.8-12.8c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3zM3.2 13.7c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3S.9 17.3.9 16s1-2.3 2.3-2.3zM6.7 4.4c1.3 0 2.3 1 2.3 2.3S8 9 6.7 9 4.4 8 4.4 6.7s1-2.3 2.3-2.3zm18.6 18.6c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3zM25.3 4.4c1.3 0 2.3 1 2.3 2.3S26.6 9 25.3 9 23 8 23 6.7s1-2.3 2.3-2.3zM6.7 23c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3z"
        />
      </g>
    </svg>
  );
}

// =========================================================================
// 路由定义与激活研判
// =========================================================================
const NAV_ITEMS = [
  { name: "home", href: "/", icon: DuotoneHomeIcon },
  { name: "blog", href: "/posts", icon: DuotoneBlogIcon },
  { name: "playlist", href: "/playlist", icon: DuotonePlaylistIcon },
  { name: "photos", href: "/photos", icon: DuotonePhotosIcon },
  { name: "thoughts", href: "/thoughts", icon: Style1ThoughtsIcon },
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
      className={`relative isolate inline-flex items-center justify-center rounded-full font-medium h-9 min-w-9 px-2.5 transition-colors duration-150 outline-none select-none cursor-pointer ${
        isActive
          ? "text-[#33FF33]"
          : "text-white hover:text-[#33FF33] "
      }`}
      aria-label={item.name}
    >
      {isActive && (
        <motion.div
          layoutId="dock-active-pill"
          transition={layoutSpring}
          className="absolute inset-0 -z-10 rounded-full  shadow-xs"
        />
      )}

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
        className="hidden sm:inline-block overflow-hidden whitespace-nowrap text-[13px] font-medium pointer-events-none select-none"
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
      className="relative isolate inline-flex items-center justify-center rounded-full font-medium h-9 min-w-9 px-2.5 transition-colors duration-150 outline-none select-none cursor-pointer text-white hover:text-[#33FF33]"
      aria-label="切换主题"
      title="切换主题"
    >
      <div className="flex items-center justify-center shrink-0 w-5 h-5">
        <PaulThemeToggleIcon className="w-5 h-5" />
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
        className="hidden sm:inline-block overflow-hidden whitespace-nowrap text-[13px] font-medium pointer-events-none select-none"
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
          className="pointer-events-auto relative inline-flex items-center overflow-hidden rounded-full border-2 border-[#484848] bg-[#080808] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-2xl p-1.5 gap-1 select-none min-h-[48px]"
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