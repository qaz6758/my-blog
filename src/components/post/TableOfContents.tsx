// src/components/post/TableOfContents.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  tocList?: TocItem[];
  items?: TocItem[];
  activeId?: string;
  className?: string;
  isArticleHovered?: boolean;
}

// 图二标准三条杠目录图标（上长、中短、下长）
export function TocIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="3.5" y1="5.5" x2="20.5" y2="5.5" />
      <line x1="3.5" y1="12" x2="13.5" y2="12" />
      <line x1="3.5" y1="18.5" x2="20.5" y2="18.5" />
    </svg>
  );
}

export function TableOfContents({
  tocList,
  items,
  activeId: externalActiveId,
  className = "",
  isArticleHovered,
}: TableOfContentsProps) {
  const propList = tocList || items;
  const [domList, setDomList] = useState<TocItem[]>([]);
  const [internalActiveId, setInternalActiveId] = useState<string>("");
  const [isSelfHovered, setIsSelfHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [internalArticleHovered, setInternalArticleHovered] = useState(false);

  // 监听文章区域悬浮（仅限真实文章正文字体区域，两边留白不触发）
  useEffect(() => {
    if (isArticleHovered !== undefined) return;

    let leaveTimer: NodeJS.Timeout | null = null;
    const findTarget = () =>
      document.querySelector(".post-article") ||
      document.querySelector("article");

    let target = findTarget();
    const onEnter = () => {
      if (leaveTimer) clearTimeout(leaveTimer);
      setInternalArticleHovered(true);
    };
    const onLeave = () => {
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        setInternalArticleHovered(false);
      }, 350);
    };

    if (target) {
      target.addEventListener("mouseenter", onEnter);
      target.addEventListener("mouseleave", onLeave);
    }

    const timer = setTimeout(() => {
      const retryTarget = findTarget();
      if (retryTarget && retryTarget !== target) {
        target = retryTarget;
        target.addEventListener("mouseenter", onEnter);
        target.addEventListener("mouseleave", onLeave);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (leaveTimer) clearTimeout(leaveTimer);
      if (target) {
        target.removeEventListener("mouseenter", onEnter);
        target.removeEventListener("mouseleave", onLeave);
      }
    };
  }, [isArticleHovered]);

  const list = propList && propList.length > 0 ? propList : domList;
  const currentActiveId = externalActiveId ?? internalActiveId;

  // 1. 异步自动扫描正文中的 h1~h4 标题
  useEffect(() => {
    if (propList && propList.length > 0) return;

    const extractHeadings = () => {
      const articleEl =
        document.querySelector(".post-article") ||
        document.querySelector("article");
      if (!articleEl) return false;

      const elements = articleEl.querySelectorAll("h1, h2, h3, h4");
      if (elements.length === 0) return false;

      const extracted: TocItem[] = [];
      elements.forEach((el, index) => {
        let id = el.getAttribute("id");
        const text = (el.textContent || "").trim();
        const level = Number(el.tagName.replace("H", "")) || 2;
        if (!text) return;

        // 若标题无原生 id（如 RSS HTML），自动生成拼音/英文 slug 赋给元素
        if (!id) {
          const slug = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40);
          id = slug ? `heading-${index}-${slug}` : `heading-${index}`;
          el.setAttribute("id", id);
        }

        extracted.push({ id, text, level });
      });

      if (extracted.length > 0) {
        setDomList(extracted);
        return true;
      }
      return false;
    };

    if (!extractHeadings()) {
      const t1 = setTimeout(extractHeadings, 80);
      const t2 = setTimeout(extractHeadings, 250);
      const t3 = setTimeout(extractHeadings, 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [propList]);

  // 2. 监听阅读滚动进度
  useEffect(() => {
    if (externalActiveId !== undefined || list.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          setInternalActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "0px 0px -65% 0px",
        threshold: 0,
      }
    );

    list.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [list, externalActiveId]);

  if (list.length === 0) return null;

  // 3. 点击平滑跳转并同步锚点
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;

    const y = element.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: "smooth" });

    window.history.pushState(null, "", `#${id}`);
    if (externalActiveId === undefined) {
      setInternalActiveId(id);
    }
  };

  // 核心显隐逻辑：鼠标进入文章范围、或鼠标悬浮在目录上、或点击锁定常驻
  const isVisible = Boolean(
    (isArticleHovered ?? internalArticleHovered) || isSelfHovered || isPinned
  );

  return (
    <nav
      aria-label="文章目录大纲"
      onMouseEnter={() => setIsSelfHovered(true)}
      onMouseLeave={() => setIsSelfHovered(false)}
      className={`select-none transition-all duration-300 ${className}`}
    >
      {/* 图二三条杠图标按钮 (无背景、无边框、纯净极简、点击可锁定常驻) */}
      <button
        type="button"
        onClick={() => setIsPinned((prev) => !prev)}
        className={`group mb-3.5 flex items-center justify-start bg-transparent border-none p-0 cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none transition-all duration-200 select-none ${
          isPinned
            ? "opacity-100 text-neutral-900 dark:text-white"
            : isVisible
            ? "opacity-80 text-neutral-700 dark:text-neutral-300 hover:opacity-100 hover:text-neutral-900 dark:hover:text-white"
            : "opacity-45 text-neutral-500 dark:text-neutral-400 hover:opacity-100 hover:text-neutral-900 dark:hover:text-white"
        }`}
        title={isPinned ? "点击取消常驻目录" : "悬浮正文字体显示，点击常驻目录"}
        aria-label="目录大纲"
      >
        <TocIcon className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105" />
      </button>

      {/* 目录列表：Antfu 同款平滑淡入淡出动效 */}
      <AnimatePresence>
        {isVisible && (
          <motion.ul
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="max-h-[calc(100vh-14rem)] space-y-2 overflow-y-auto pr-2 text-[13px]"
          >
            {list.map((item) => {
              const isActive = currentActiveId === item.id;
              const indentClass =
                item.level <= 2 ? "" : item.level === 3 ? "pl-3" : "pl-5";

              return (
                <li key={item.id} className={indentClass}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleItemClick(e, item.id)}
                    className={`inline-block py-0.5 leading-snug underline underline-offset-4 decoration-1 transition-all duration-200 ${
                      isActive
                        ? "opacity-100 text-neutral-900 dark:text-neutral-100 font-medium decoration-neutral-900 dark:decoration-neutral-100"
                        : "opacity-45 hover:opacity-100 text-neutral-700 dark:text-neutral-300 decoration-neutral-300/70 dark:decoration-neutral-700/80 hover:decoration-neutral-800 dark:hover:decoration-neutral-200"
                    }`}
                  >
                    {item.text}
                  </a>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default TableOfContents;