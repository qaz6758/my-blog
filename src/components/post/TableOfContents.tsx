// src/components/post/TableOfContents.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
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
}: TableOfContentsProps) {
  const propList = tocList || items;
  const [domList, setDomList] = useState<TocItem[]>([]);
  const [internalActiveId, setInternalActiveId] = useState<string>("");
  const [readingProgress, setReadingProgress] = useState(0);

  // 点击平滑跳转锁定，严禁中间过渡项抢占高亮
  const isClickScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      const seenIds = new Set<string>();

      elements.forEach((el, index) => {
        let id = el.getAttribute("id");
        const text = (el.textContent || "").trim();
        const level = Number(el.tagName.replace("H", "")) || 2;
        if (!text) return;

        // 若标题无原生 id 或存在重复，自动生成唯一规范 slug
        if (!id || seenIds.has(id)) {
          const slug = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\d-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40);
          id = seenIds.has(id || slug) ? `${slug || "heading"}-${index}` : (slug || `heading-${index}`);
          el.setAttribute("id", id);
        }

        seenIds.add(id);
        extracted.push({ id, text, level });
      });

      if (extracted.length > 0) {
        setDomList(extracted);
        setInternalActiveId((prev) => prev || extracted[0].id);
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

  // 2. 统一监听滚动：计算阅读进度百分比 + 智能高亮当前阅读位置（Scroll Spy）
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;

        const articleEl = (document.querySelector(".post-article") || document.querySelector("article")) as HTMLElement;
        if (!articleEl) return;

        // A. 计算文章阅读进度
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const articleTop = articleEl.offsetTop;
        const articleHeight = articleEl.offsetHeight;

        let progress = 0;
        if (scrollY < articleTop - windowHeight / 2) {
          progress = 0;
        } else if (scrollY > articleTop + articleHeight - windowHeight) {
          progress = 100;
        } else {
          const scrolled = scrollY - articleTop + windowHeight / 2;
          progress = Math.min(100, Math.max(0, (scrolled / articleHeight) * 100));
        }
        setReadingProgress(Math.round(progress));

        // B. 智能判定当前阅读标题（用户点击跳转平滑滚动期间严格锁定，不执行判断）
        if (isClickScrollingRef.current || externalActiveId !== undefined || list.length === 0) {
          return;
        }

        // 触底保护：如果已滑动至文章/页面底部，稳定高亮最后一个标题
        if (windowHeight + scrollY >= document.documentElement.scrollHeight - 50) {
          setInternalActiveId(list[list.length - 1].id);
          return;
        }

        // 正常阅读基准线：导航栏高度 68px + 适度余量 = 120px
        const readingLineOffset = 120;
        let activeHeadingId = list[0].id;

        for (let i = 0; i < list.length; i++) {
          const el = document.getElementById(list[i].id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top <= readingLineOffset) {
            activeHeadingId = list[i].id;
          } else {
            // 文档有序，一旦当前标题在基准线下方，后续标题无需继续检查
            break;
          }
        }

        setInternalActiveId(activeHeadingId);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    const initTimer = setTimeout(handleScroll, 120);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(initTimer);
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [list, externalActiveId]);

  if (list.length === 0) return null;

  // 3. 点击平滑跳转：状态锁定，杜绝闪烁中间项
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;

    // 立即锁定状态，避免平滑滑动过程被中间标题抢占高亮
    isClickScrollingRef.current = true;
    if (externalActiveId === undefined) {
      setInternalActiveId(id);
    }

    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }

    // 精准定位：导航栏高度 68px + 16px 留白 = 84px 呼吸间距
    const targetY = Math.max(0, element.getBoundingClientRect().top + window.scrollY - 84);
    window.scrollTo({ top: targetY, behavior: "smooth" });

    try {
      window.history.pushState(null, "", `#${id}`);
    } catch {}

    // 滚动结束解锁机制：优先 scrollend 事件，配合 800ms 超时兜底
    const onScrollEnd = () => {
      isClickScrollingRef.current = false;
      window.removeEventListener("scrollend", onScrollEnd);
    };

    window.addEventListener("scrollend", onScrollEnd, { once: true });
    scrollEndTimerRef.current = setTimeout(onScrollEnd, 800);
  };

  return (
    <nav aria-label="文章目录大纲" className={`select-none w-full ${className}`}>
      <div className="mb-8">
        <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">目录</h3>
        <div className="h-px w-6 bg-neutral-300 dark:bg-neutral-700 mb-6" />
        
        <ul className="space-y-3.5 text-[13px]">
          {list.map((item) => {
            const isActive = currentActiveId === item.id;
            const isSub = item.level > 2;

            return (
              <li
                key={item.id}
                className={`relative flex items-start transition-all ${
                  isSub ? "pl-3 text-[12.5px]" : ""
                }`}
              >
                {/* 极简高雅的高亮指示条 */}
                {isActive && (
                  <div className="absolute -left-3 top-1.5 h-3.5 w-[2px] bg-[#292623] dark:bg-white rounded-full" />
                )}
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleItemClick(e, item.id)}
                  className={`block leading-relaxed transition-colors duration-200 line-clamp-2 flex-1 ${
                    isActive
                      ? "text-[#292623] dark:text-white font-medium"
                      : "text-neutral-400 hover:text-[#292623] dark:text-[#777168] dark:hover:text-[#eae5dc]"
                  }`}
                  title={item.text}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-16">
        <div className="flex justify-between items-center text-[11px] text-neutral-400 dark:text-neutral-500 mb-3 font-mono">
          <span>阅读进度</span>
          <span>{readingProgress}%</span>
        </div>
        <div className="h-0.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-neutral-800 dark:bg-neutral-400 transition-all duration-300 ease-out"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      </div>
    </nav>
  );
}

export default TableOfContents;