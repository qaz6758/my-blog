// src/components/post/TableOfContents.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";

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
  locale?: string;
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
  locale: propLocale,
}: TableOfContentsProps) {
  const { locale: contextLocale, convertText } = useI18n();
  const currentLocale = propLocale || contextLocale;
  const propList = tocList || items;
  const [domList, setDomList] = useState<TocItem[]>([]);
  const [internalActiveId, setInternalActiveId] = useState<string>("");
  const [readingProgress, setReadingProgress] = useState(0);
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

          id = seenIds.has(id || slug)
            ? `${slug || "heading"}-${index}`
            : slug || `heading-${index}`;

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

    // 初始扫描与渐进式多阶段重试，确保无缝捕获异步翻译与 DOM 重排后的最新标题
    extractHeadings();

    const t1 = setTimeout(extractHeadings, 80);
    const t2 = setTimeout(extractHeadings, 250);
    const t3 = setTimeout(extractHeadings, 600);
    const t4 = setTimeout(extractHeadings, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [propList, contentKey, currentLocale]);

  // 2. 统一监听滚动：计算阅读进度百分比 + 智能高亮当前阅读位置（Scroll Spy）
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;

        const articleEl = (
          document.querySelector(".post-article") ||
          document.querySelector("article")
        ) as HTMLElement;

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
          progress = Math.min(
            100,
            Math.max(0, (scrolled / articleHeight) * 100)
          );
        }

        setReadingProgress(Math.round(progress));

        // B. 智能判定当前阅读标题
        // 用户点击跳转平滑滚动期间严格锁定，不执行判断
        if (
          isClickScrollingRef.current ||
          externalActiveId !== undefined ||
          list.length === 0
        ) {
          return;
        }

        // 触底保护：如果已滑动至文章/页面底部，稳定高亮最后一个标题
        if (
          windowHeight + scrollY >=
          document.documentElement.scrollHeight - 50
        ) {
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

  // 没有任何二级标题时，彻底隐藏大纲与 ≡ 按钮
  if (list.length === 0) return null;

  // 点击平滑跳转：状态锁定，杜绝闪烁中间项
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
    const targetY = Math.max(
      0,
      element.getBoundingClientRect().top + window.scrollY - 84
    );

    window.scrollTo({
      top: targetY,
      behavior: "smooth",
    });

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

  const isVisible = isArticleHovered || isSelfHovered;

  return (
    <nav
      aria-label="文章目录大纲"
      onMouseEnter={() => setIsSelfHovered(true)}
      onMouseLeave={() => setIsSelfHovered(false)}
      className={`fixed left-6 top-24 z-30 hidden xl:block w-[220px] select-none ${className}`}
    >
      <div className="flex flex-col items-start">
        {/* 顶部 ≡ 锚点按钮 (严格对齐下方目录文字左侧基准线) */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title={
            currentLocale === "zh-TW"
              ? "文章目錄 (點擊置頂)"
              : "文章目录 (点击置顶)"
          }
          aria-label="回到顶部"
          className={`mb-3.5 flex items-center justify-start p-0 rounded transition-colors duration-300 cursor-pointer ${
            isVisible
              ? "text-neutral-700 dark:text-neutral-300 opacity-80"
              : "text-neutral-400 dark:text-neutral-500 opacity-45 hover:opacity-80 hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <TocIcon className="w-[18px] h-[16px]" />
        </button>

        {/* 目录列表 */}
        <ul
          className={`w-full p-0 m-0 list-none space-y-1 text-[13px] font-sans overflow-y-auto max-h-[calc(100vh-160px)] transition-opacity duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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

            const titleText =
              currentLocale === "zh-TW"
                ? convertText(item.text)
                : item.text;

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
                  className={`inline-block leading-snug pb-[1.5px] border-b transition-colors duration-200 ${
                    isActive
                      ? "text-neutral-800 dark:text-neutral-100 border-neutral-600 dark:border-neutral-300 font-medium"
                      : "text-neutral-500 dark:text-neutral-400 border-neutral-300/80 dark:border-neutral-700/80 hover:text-neutral-800 dark:hover:text-neutral-200 hover:border-neutral-600 dark:hover:border-neutral-400 font-normal"
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