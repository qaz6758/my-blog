// src/components/post/TableOfContents.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";

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
  contentKey?: string;
}

// Anthony Fu 原版目录图标（精准裁切左侧空白，严格对齐文字首字 x=0 垂直轴）
export function TocIcon({ className = "w-[18px] h-[16px]" }: { className?: string }) {
  return (
    <svg
      viewBox="3 4 18 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z" />
    </svg>
  );
}

export function TableOfContents({
  tocList,
  items,
  activeId: externalActiveId,
  className = "",
  isArticleHovered = false,
  contentKey = "",
}: TableOfContentsProps) {
  const propList = tocList || items;
  const [domList, setDomList] = useState<TocItem[]>([]);
  const [internalActiveId, setInternalActiveId] = useState<string>("");
  const [isSelfHovered, setIsSelfHovered] = useState(false);

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

      const elements = articleEl.querySelectorAll("h2, h3, h4");
      if (elements.length === 0) {
        setDomList([]);
        return false;
      }

      const extracted: TocItem[] = [];
      const seenIds = new Set<string>();

      elements.forEach((el, index) => {
        const text = (el.textContent || "").trim();
        const level = Number(el.tagName.replace("H", "")) || 2;

        if (!text) return;

        // 生成唯一规范 slug
        const slug = text
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5\d-]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);

        const uniqueId = seenIds.has(slug)
          ? `${slug || "heading"}-${index}`
          : slug || `heading-${index}`;

        el.setAttribute("id", uniqueId);
        seenIds.add(uniqueId);
        extracted.push({ id: uniqueId, text, level });
      });

      if (extracted.length > 0) {
        setDomList((prev) => {
          if (
            prev.length === extracted.length &&
            prev.every(
              (item, i) =>
                item.id === extracted[i].id &&
                item.text === extracted[i].text &&
                item.level === extracted[i].level
            )
          ) {
            return prev;
          }
          return extracted;
        });
        setInternalActiveId((prev) => {
          if (extracted.some((item) => item.id === prev)) return prev;
          return extracted[0].id;
        });
        return true;
      } else {
        setDomList([]);
        return false;
      }
    };

    // 初始扫描与渐进式多阶段重试，确保无缝捕获异步翻译与 DOM 重排后的最新标题
    extractHeadings();

    let observer: MutationObserver | null = null;
    const setupObserver = () => {
      if (observer) return;
      const target =
        document.querySelector(".post-article") ||
        document.querySelector("article");
      if (target && typeof MutationObserver !== "undefined") {
        observer = new MutationObserver(() => {
          extractHeadings();
        });
        observer.observe(target, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    };

    setupObserver();

    const t1 = setTimeout(() => { extractHeadings(); setupObserver(); }, 80);
    const t2 = setTimeout(() => { extractHeadings(); setupObserver(); }, 250);
    const t3 = setTimeout(() => { extractHeadings(); setupObserver(); }, 600);
    const t4 = setTimeout(() => { extractHeadings(); setupObserver(); }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [propList, contentKey]);

   // 2. 统一监听滚动：精准判定画框内的阅读标题（Scroll Spy）
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;

        // 用户点击跳转平滑滚动期间锁定，不抢占高亮
        if (
          isClickScrollingRef.current ||
          externalActiveId !== undefined ||
          list.length === 0
        ) {
          return;
        }

        const scrollContainer = document.querySelector(
          ".home-panel-scroll"
        ) as HTMLElement | null;

        // 🎯 1. 在画框容器内进行高亮判定
        if (scrollContainer) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

          // 只有画框内真正滑到最底部（余量 30px）时，才高亮最后一项
          if (scrollTop + clientHeight >= scrollHeight - 30) {
            setInternalActiveId(list[list.length - 1].id);
            return;
          }

          const containerRect = scrollContainer.getBoundingClientRect();
          let activeHeadingId = list[0].id;

          for (let i = 0; i < list.length; i++) {
            const el = document.getElementById(list[i].id);
            if (!el) continue;

            const rect = el.getBoundingClientRect();
            // 标题距离画框顶部的相对垂直距离（到达顶部 70px 内即判定为当前章节）
            const relativeTop = rect.top - containerRect.top;

            if (relativeTop <= 70) {
              activeHeadingId = list[i].id;
            } else {
              break;
            }
          }

          setInternalActiveId(activeHeadingId);
          return;
        }

        // 🎯 2. 兜底全局滚动模式
        let activeHeadingId = list[0].id;
        for (let i = 0; i < list.length; i++) {
          const el = document.getElementById(list[i].id);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= 120) {
            activeHeadingId = list[i].id;
          } else {
            break;
          }
        }
        setInternalActiveId(activeHeadingId);
      });
    };

    const scrollContainer =
      document.querySelector(".home-panel-scroll") || window;
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    const initTimer = setTimeout(handleScroll, 120);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      clearTimeout(initTimer);
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [list, externalActiveId]);

  // 没有任何二级标题时，彻底隐藏大纲与 ≡ 按钮
  if (list.length === 0) return null;


const handleItemClick = (e: React.MouseEvent, id: string) => {
  e.preventDefault();

  const element = document.getElementById(id);
  if (!element) return;

  isClickScrollingRef.current = true;

  if (externalActiveId === undefined) {
    setInternalActiveId(id);
  }

  if (scrollEndTimerRef.current) {
    clearTimeout(scrollEndTimerRef.current);
  }

  // 🎯 寻找外层画框的滚动容器 .home-panel-scroll
  const scrollContainer = document.querySelector(".home-panel-scroll");
  if (scrollContainer) {
    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    // 计算目标标题相对于滚动容器顶部的准确位移（预留 20px 顶部呼吸余量）
    const targetScrollTop =
      scrollContainer.scrollTop + (elementRect.top - containerRect.top) - 20;

    scrollContainer.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: "smooth",
    });
  } else {
    // 兜底方案
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  try {
    window.history.pushState(null, "", `#${id}`);
  } catch {}

  // 滚动结束解锁
  const onScrollEnd = () => {
    isClickScrollingRef.current = false;
    window.removeEventListener("scrollend", onScrollEnd);
  };

  window.addEventListener("scrollend", onScrollEnd, { once: true });
  scrollEndTimerRef.current = setTimeout(onScrollEnd, 800);
};
  const isVisible = true;

  return (
        <nav
          aria-label="文章目录大纲"
          onMouseEnter={() => setIsSelfHovered(true)}
          onMouseLeave={() => setIsSelfHovered(false)}
          className={`relative w-full select-none ${className}`}
        >
      <div className="flex flex-col items-start">
        {/* 顶部 ≡ 锚点按钮 (严格对齐下方目录文字左侧基准线) */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="文章目录 (点击置顶)"
          aria-label="回到顶部"
          className={`mb-3.5 flex items-center justify-start p-0 rounded transition-colors duration-300 cursor-pointer ${
            isVisible
              ? "text-neutral-700 dark:text-neutral-300 opacity-80"
              : "text-neutral-400 dark:text-neutral-500 opacity-45 hover:opacity-100 hover:text-[#33FF33] dark:hover:text-[#33FF33]"
          }`}
        >
          <TocIcon className="w-[18px] h-[16px]" />
        </button>

        {/* 目录列表 */}
        <ul
          className={`w-full p-0 m-0 list-none space-y-1.5 text-[13px] font-['W95FA',sans-serif] tracking-wide select-none overflow-y-auto max-h-[calc(100vh-160px)] transition-opacity duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isVisible
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {list.map((item, idx) => {
            const isActive = currentActiveId === item.id;
            const isH2 = item.level <= 2;
            const isH3 = item.level === 3;
            const isH4 = item.level >= 4;

            // 大章节之间赋予自然呼吸间距
            const hasSectionMargin = isH2 && idx > 0;

            const titleText = item.text;

            return (
              <li
                key={item.id}
                className={`relative flex items-start ${
                  isH4
                    ? "pl-[1.7rem]"
                    : isH3
                      ? "pl-[0.85rem]"
                      : "pl-0"
                } ${hasSectionMargin ? "mt-2.5" : "mt-1"}`}
              >
             
              <a
                href={`#${item.id}`}
                onClick={(e) => handleItemClick(e, item.id)}
                className={`inline-block leading-snug transition-colors duration-200 ${
                  isActive
                    ? "text-white font-bold"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-normal"
                }`}
                title={titleText}
              >
                {titleText}
              </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export default TableOfContents;